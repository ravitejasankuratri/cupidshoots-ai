# Agents.md — CupidShoots.ai (Step 1: Discovery Complete)

> This file is the build checklist. Each agent or engineer picks up their task with full context. No prior chat history needed.

---

## Project Summary (always read first)
**CupidShoots.ai** — Anonymous compliment + mutual matching for singles meetups.
- Organizer creates event → shares 6-char code at event
- Attendees submit ≥3 compliments (target name + sticker number + message + own email)
- At event end_time → system finds mutual compliments → generates love poem via Bedrock → emails both parties
- Stack: Next.js on Vercel (v0 scaffolded), Aurora DSQL, AWS Lambda, EventBridge, Bedrock, SES, Cognito
- Deadline: **June 29, 2026 @ 5pm PDT**

---

## Agent 1 — Database Setup
**Owner:** Backend  
**Deadline:** June 26 EOD  
**Dependencies:** AWS account with Aurora DSQL access

### Tasks
- [ ] Provision Aurora DSQL cluster in us-east-1
- [ ] Store connection endpoint in AWS Secrets Manager as `cupidshoots/dsql`
- [ ] Run `schema.sql` (see Architecture.md for full DDL)
- [ ] Verify all tables created: `organizers, events, submissions, compliments, matches`
- [ ] Verify indexes on `events(event_code)`, `submissions(event_id, attendee_number)`, `compliments(event_id, from_number)`, `compliments(event_id, to_number)`
- [ ] Test connection from local with IAM auth token

### Validation
```sql
-- Should return 5 rows
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Output
- `DSQL_ENDPOINT` → add to Vercel env vars + Lambda env
- `DB_SECRET_ARN` → add to CDK stack

---

## Agent 2 — Next.js Project Setup (v0)
**Owner:** Frontend/Fullstack  
**Deadline:** June 26 EOD  
**Dependencies:** Vercel account, v0.app access

### Tasks
- [ ] Init Next.js project via v0: `v0.dev` prompt → "singles meetup anonymous compliment app"
- [ ] Connect to Vercel project, set up `develop` and `main` branches
- [ ] Install dependencies: `pg` (or `@aws-sdk/client-dsql`), `aws-amplify`, `@aws-sdk/client-ses`, `@aws-sdk/client-bedrock-runtime`
- [ ] Set Vercel env vars:
  ```
  DSQL_ENDPOINT=<cluster>.dsql.us-east-1.on.aws
  AWS_ACCESS_KEY_ID=<>       # or use Vercel OIDC
  AWS_SECRET_ACCESS_KEY=<>
  AWS_REGION=us-east-1
  COGNITO_USER_POOL_ID=<>
  COGNITO_CLIENT_ID=<>
  INTERNAL_API_KEY=<>        # from Secrets Manager
  FROM_EMAIL=noreply@cupidshoots.ai
  ```
- [ ] Verify Vercel deployment on `develop` branch is live

### Page Structure
```
app/
  page.tsx                  ← Landing (event code entry)
  event/[code]/
    page.tsx                ← Compliment form
    confirmation/page.tsx   ← "Sealed ✉️" screen
  organizer/
    page.tsx                ← Login/signup
    dashboard/page.tsx      ← Events list
    events/new/page.tsx     ← Create event form
    events/[id]/page.tsx    ← Event detail + stats
api/
  events/[code]/route.ts    ← GET validate code
  events/[code]/submit/route.ts ← POST submit compliments
  organizer/events/route.ts     ← GET list, POST create
  organizer/events/[id]/route.ts ← GET detail
  internal/process-matches/route.ts ← POST (Lambda calls this)
```

---

## Agent 3 — Attendee Compliment Form
**Owner:** Frontend  
**Deadline:** June 27 AM  
**Dependencies:** Agent 2 complete

### UI Requirements
1. Step 1: Enter event code → validate against API → proceed
2. Step 2: Enter own name, sticker number, email
3. Step 3: Add compliments (repeatable component)
   - Target name (text)
   - Target sticker number (number)
   - Your message to them (textarea, max 280 chars)
   - [+ Add another] button
   - Counter: "X / 3 compliments added" (green when ≥3)
4. Submit button: **disabled until ≥3 compliments added**
5. Step 4: Confirmation screen — "Your compliments are sealed. We'll email you after the event if there's a match. 💌"

### Validation (frontend + backend)
- Min 3 compliments (hard block on submit)
- Cannot compliment yourself (from_number ≠ to_number)
- Email format validation
- Sticker number must be positive integer
- Duplicate check: if attendee_number already submitted for this event → show "You already submitted!"

### API Call
```typescript
POST /api/events/:code/submit
{
  attendee_name: "Alex",
  attendee_number: 7,
  attendee_email: "alex@example.com",
  compliments: [
    { to_name: "Sam", to_number: 12, message: "..." },
    { to_name: "Jordan", to_number: 5, message: "..." },
    { to_name: "Casey", to_number: 23, message: "..." }
  ]
}
```

---

## Agent 4 — Organizer Flow
**Owner:** Fullstack  
**Deadline:** June 27 AM  
**Dependencies:** Agent 2 + Cognito stack deployed

### Tasks
- [ ] Signup/Login page using AWS Amplify + Cognito
- [ ] "Create Event" form: event name, venue (optional), date, end time
- [ ] On create: generate 6-char alphanumeric code (server-side), store event, create EventBridge schedule
- [ ] Dashboard: list events with status badge + stats (submissions, matches)
- [ ] Event detail: show event code prominently (easy to copy), show counts
- [ ] Manual "Close Event Now" button → calls `/api/organizer/events/:id/close`

### Event Code Generation
```typescript
// server-side
function generateEventCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
// Retry if collision (unique constraint on DB)
```

### EventBridge Schedule Creation (on event create)
```typescript
import { SchedulerClient, CreateScheduleCommand } from '@aws-sdk/client-scheduler';

const client = new SchedulerClient({ region: 'us-east-1' });
await client.send(new CreateScheduleCommand({
  Name: `process-event-${eventId}`,
  ScheduleExpression: `at(${endTime.toISOString()})`,
  Target: {
    Arn: process.env.MATCH_PROCESSOR_LAMBDA_ARN,
    RoleArn: process.env.SCHEDULER_ROLE_ARN,
    Input: JSON.stringify({ event_id: eventId }),
  },
  FlexibleTimeWindow: { Mode: 'OFF' },
  ActionAfterCompletion: 'DELETE',  // auto-cleanup
}));
```

---

## Agent 5 — Match Processor (Lambda)
**Owner:** Backend  
**Deadline:** June 27 PM  
**Dependencies:** DB schema, Bedrock access, SES verified

### Lambda Handler (lambda/match-processor/index.ts)
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Client } from 'pg';

export const handler = async (event: { event_id: string }) => {
  const { event_id } = event;

  // 1. Get DB credentials
  const sm = new SecretsManagerClient({ region: 'us-east-1' });
  const secret = await sm.send(new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }));
  const { password } = JSON.parse(secret.SecretString!);

  // 2. Connect to Aurora DSQL
  const db = new Client({
    host: process.env.DSQL_ENDPOINT,
    database: 'postgres',
    user: 'admin',
    password,
    ssl: { rejectUnauthorized: true },
  });
  await db.connect();

  // 3. Update event status → processing
  await db.query("UPDATE events SET status='processing' WHERE id=$1", [event_id]);

  // 4. Find mutual matches
  const { rows: matches } = await db.query(`
    SELECT DISTINCT
      s1.id AS sub_a_id, s1.attendee_name AS name_a, s1.attendee_email AS email_a,
      s2.id AS sub_b_id, s2.attendee_name AS name_b, s2.attendee_email AS email_b,
      c1.message AS msg_a_to_b,
      c2.message AS msg_b_to_a
    FROM compliments c1
    JOIN compliments c2
      ON c1.event_id = c2.event_id
     AND c1.from_number = c2.to_number
     AND c1.to_number   = c2.from_number
    JOIN submissions s1 ON s1.event_id = c1.event_id AND s1.attendee_number = c1.from_number
    JOIN submissions s2 ON s2.event_id = c1.event_id AND s2.attendee_number = c2.from_number
    WHERE c1.event_id = $1 AND c1.from_number < c2.from_number
  `, [event_id]);

  // 5. For each match: generate poems + send emails
  const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });
  const ses = new SESClient({ region: 'us-east-1' });

  for (const match of matches) {
    // Generate poem for person A (from B's message)
    const poem_for_a = await generatePoem(bedrock, match.name_b, match.name_a, match.msg_b_to_a);
    const poem_for_b = await generatePoem(bedrock, match.name_a, match.name_b, match.msg_a_to_b);

    // Save match to DB
    await db.query(`
      INSERT INTO matches (event_id, person_a_submission, person_b_submission, poem_for_a, poem_for_b)
      VALUES ($1, $2, $3, $4, $5)
    `, [event_id, match.sub_a_id, match.sub_b_id, poem_for_a, poem_for_b]);

    // Send emails
    await sendMatchEmail(ses, match.email_a, match.name_a, match.name_b, poem_for_a);
    await sendMatchEmail(ses, match.email_b, match.name_b, match.name_a, poem_for_b);
  }

  // 6. Mark event completed
  await db.query("UPDATE events SET status='completed' WHERE id=$1", [event_id]);
  await db.end();

  return { matches_found: matches.length };
};

async function generatePoem(
  bedrock: BedrockRuntimeClient,
  from: string, to: string, message: string
): Promise<string> {
  const prompt = `You are a romantic poet. Someone named ${from} left this message for ${to} at a singles event: "${message}". Transform this into a short, warm, playful love poem (4-6 lines). Address it to ${to}. Sign it "— Your Secret Admirer, ${from}". Return only the poem.`;

  const response = await bedrock.send(new InvokeModelCommand({
    modelId: 'anthropic.claude-haiku-20240307-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  }));

  const result = JSON.parse(Buffer.from(response.body).toString());
  return result.content[0].text;
}

async function sendMatchEmail(
  ses: SESClient, to: string, toName: string, fromName: string, poem: string
) {
  await ses.send(new SendEmailCommand({
    Source: process.env.FROM_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: `💘 You have a match, ${toName}!` },
      Body: {
        Html: {
          Data: `
            <h2>It's a match, ${toName}! 💘</h2>
            <p>${fromName} also left you a compliment — and we turned it into something special:</p>
            <blockquote style="font-style:italic; font-size:1.1em; border-left:3px solid #e91e63; padding-left:1em;">
              ${poem.replace(/\n/g, '<br/>')}
            </blockquote>
            <p>Their email: <a href="mailto:${to}">${fromName}</a></p>
            <p style="color:#888; font-size:0.8em;">Powered by CupidShoots.ai 🏹</p>
          `
        }
      }
    }
  }));
}
```

### Validation Steps
- [ ] Deploy Lambda via CDK
- [ ] Test with mock event_id (seed test data in DB)
- [ ] Verify poem generation (check Bedrock response parsing)
- [ ] Verify SES sends (use SES sandbox with verified test email first)
- [ ] Check matches table populated correctly
- [ ] Check event status updated to 'completed'

---

## Agent 6 — Submission Checklist (Hackathon)
**Owner:** Ravi  
**Deadline:** June 29 @ 4pm PDT (1hr buffer)

### Required Deliverables
- [ ] Working demo URL on Vercel (prod deployment)
- [ ] Vercel Team ID (Settings → General)
- [ ] 3-min demo video (YouTube) covering:
  - [ ] Problem being solved + for whom
  - [ ] Live app walkthrough (create event, submit compliments, show email)
  - [ ] Explain Aurora DSQL choice and why it fits
- [ ] Architecture diagram image (export from draw.io or Excalidraw using Architecture.md as source)
- [ ] Screenshot of Aurora DSQL cluster in AWS Console
- [ ] Text description mentioning Aurora DSQL by name
- [ ] GitHub repo link (make public)

### Bonus (content for extra points)
- [ ] Publish blog post on dev.to or builder.aws.com: "How I built CupidShoots.ai with Aurora DSQL and Vercel v0"
- [ ] Include hashtag #H0Hackathon
- [ ] Must mention this was created for the hackathon

### Demo Script (3 min)
```
0:00 – Hook: "At my last singles meetup I saw 3 people I wanted to talk to. I talked to zero."
0:20 – Problem: approach anxiety, missed connections, no async solution for in-person events
0:45 – Demo: Open cupidshoots.ai, enter event code, fill compliment form (3 compliments), submit
1:30 – Show organizer dashboard: event created, end time set, submission count
2:00 – Show match email received (pre-seeded demo): poem, connection made
2:30 – Architecture: "Aurora DSQL handles concurrent writes at event peak, serverless scaling"
2:50 – Closing: "Built in 3 days, ready to take to production tomorrow"
```

---

## Build Order (Critical Path)

```
Day 1 (June 26)
  Agent 1: DB schema live ──────────────────────────────────────┐
  Agent 2: Next.js + Vercel setup ─────────────────────────────┤
                                                                 ↓
Day 2 (June 27)                                          All can proceed
  Agent 3: Compliment form + API ──────────────────────────────┐
  Agent 4: Organizer flow + EventBridge ───────────────────────┤
  Agent 5: Lambda match processor ─────────────────────────────┘
                                                                 ↓
Day 3 (June 28)                                          Integration
  End-to-end test (seed event → submit → trigger processor → check email)
  Fix bugs
  Record demo video
  Draw architecture diagram
  
June 29 AM:
  Final deploy to prod
  Submit on Devpost by 4pm PDT
```
