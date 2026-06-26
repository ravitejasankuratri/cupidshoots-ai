# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CupidShoots.ai** — Anonymous compliment + mutual matching for singles meetups. Attendees submit compliments; when two people complimented each other, the system generates a love poem via AWS Bedrock and emails both parties.

Hackathon deadline: **June 29, 2026 @ 5pm PDT**. Submission requires Vercel deployment, Aurora DSQL usage, demo video, and architecture diagram.

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend + API | Next.js (App Router) on Vercel — scaffolded via v0.dev |
| Database | Aurora DSQL (PostgreSQL-compatible, serverless) in us-east-1 |
| Auth | AWS Cognito User Pool (organizer-only; attendees are anonymous) |
| Match Processor | AWS Lambda (Node 20) triggered by EventBridge Scheduler |
| AI / Poems | AWS Bedrock — `anthropic.claude-haiku-20240307-v1:0` |
| Email | AWS SES from `noreply@cupidshoots.ai` |
| Secrets | AWS Secrets Manager (`cupidshoots/dsql`, internal API key) |
| IaC | AWS CDK (TypeScript) in `cdk/` |
| Lambda source | `lambda/match-processor/index.ts` |

---

## Planned File Structure

```
app/
  page.tsx                          # Landing — event code entry
  event/[code]/
    page.tsx                        # Compliment form (3-step)
    confirmation/page.tsx           # "Sealed" confirmation screen
  organizer/
    page.tsx                        # Cognito login/signup (AWS Amplify)
    dashboard/page.tsx              # Event list with status + stats
    events/new/page.tsx             # Create event form
    events/[id]/page.tsx            # Event detail + stats
api/
  events/[code]/route.ts            # GET — validate event code
  events/[code]/submit/route.ts     # POST — submit compliments
  organizer/events/route.ts         # GET list / POST create event
  organizer/events/[id]/route.ts    # GET event detail
  organizer/events/[id]/close/route.ts  # POST — manual close
  internal/process-matches/route.ts # POST — called by Lambda (x-internal-key header)
cdk/
  lib/cupidshoots-stack.ts          # CDK stack (Cognito, Lambda, EventBridge, Secrets)
lambda/
  match-processor/index.ts          # Match query + Bedrock poems + SES emails
```

---

## Key Architecture Decisions

### Two-system boundary
Next.js API routes handle all HTTP traffic. The Lambda match processor calls back into Next.js via `POST /api/internal/process-matches` using an `x-internal-key` secret header — it does NOT connect to the DB directly. This keeps DB credentials out of Lambda and centralizes data access.

> Note: `Agents.md` also shows a direct DB pattern for the Lambda. The API-callback pattern is preferred for simpler credential management.

### Attendee flow (no auth)
Attendees are identified only by `(event_id, attendee_number)`. No account needed. Duplicate prevention is handled by the unique constraint on `submissions(event_id, attendee_number)`.

### Mutual match detection
```sql
SELECT DISTINCT
  LEAST(c1.from_number, c2.from_number) AS person_a,
  GREATEST(c1.from_number, c2.from_number) AS person_b
FROM compliments c1
JOIN compliments c2
  ON c1.event_id = c2.event_id
 AND c1.from_number = c2.to_number
 AND c1.to_number   = c2.from_number
WHERE c1.event_id = $1
  AND c1.from_number < c2.from_number;
```

### Event scheduling
When an organizer creates an event, the API immediately creates an EventBridge Scheduler one-time schedule (`at(ISO8601)`) targeting the Lambda ARN with `{ event_id }` as input. The schedule auto-deletes after firing (`ActionAfterCompletion: 'DELETE'`).

### Organizer auth
All `/api/organizer/*` routes require a Cognito JWT. The frontend uses AWS Amplify for sign-in. The JWT is validated server-side on each request.

---

## Required Environment Variables (Vercel)

```
DSQL_ENDPOINT=<cluster>.dsql.us-east-1.on.aws
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
INTERNAL_API_KEY=          # from Secrets Manager, shared with Lambda
FROM_EMAIL=noreply@cupidshoots.ai
MATCH_PROCESSOR_LAMBDA_ARN=
SCHEDULER_ROLE_ARN=
```

---

## Database Schema Summary

Five tables: `organizers`, `events`, `submissions`, `compliments`, `matches`.

- `events.event_code` — 6-char uppercase alphanumeric, unique; generated server-side via `Math.random().toString(36).substring(2,8).toUpperCase()` with retry on collision.
- `events.status` — `'active' | 'processing' | 'completed'`
- `submissions` — one row per attendee per event; unique on `(event_id, attendee_number)`
- `compliments` — min 3 per submission; `from_number != to_number` enforced by CHECK constraint
- `matches` — written by match processor; stores both poems + `emails_sent` flag

Full DDL is in `Architecture.md`.

---

## AWS CDK

```bash
cd cdk
npm ci
npx cdk deploy        # deploy stack
npx cdk diff          # preview changes
```

CDK stack outputs: `UserPoolId`, `UserPoolClientId`, `MatchProcessorArn`, `SchedulerRoleArn`.

---

## Aurora DSQL Connection (local dev / schema setup)

```bash
export DSQL_ENDPOINT=<your-cluster>.dsql.us-east-1.on.aws

# Generate IAM auth token
aws dsql generate-db-connect-admin-auth-token \
  --hostname $DSQL_ENDPOINT \
  --region us-east-1

# Connect with psql
psql "host=$DSQL_ENDPOINT dbname=postgres sslmode=require"

# Run schema
psql "host=$DSQL_ENDPOINT dbname=postgres sslmode=require" -f schema.sql
```

---

## API Contract

### Public (attendee, no auth)
- `GET /api/events/:code` — validate event code; returns `{ event_id, event_name, event_date, status }` or 404/410
- `POST /api/events/:code/submit` — body: `{ attendee_name, attendee_number, attendee_email, compliments: [{to_name, to_number, message}] }` (min 3 compliments); returns 201 or 400/409

### Organizer (Cognito JWT required)
- `POST /api/organizer/events` — create event, returns `{ event_id, event_code }`
- `GET /api/organizer/events` — list events with counts
- `GET /api/organizer/events/:id` — event detail
- `POST /api/organizer/events/:id/close` — manual trigger match processing

### Internal (Lambda only)
- `POST /api/internal/process-matches` — header `x-internal-key: <secret>`, body `{ event_id }`

---

## Bedrock Poem Generation

Model: `anthropic.claude-haiku-20240307-v1:0`, `max_tokens: 300`.

Prompt pattern: transform a compliment message into a 4-6 line poem addressed to the recipient, signed "— Your Secret Admirer, {from_name}".

---

## Environments

| Env | Branch | URL |
|-----|--------|-----|
| dev | `develop` | cupidshoots-dev.vercel.app |
| prod | `main` | cupidshoots.ai |

CI/CD: GitHub Actions with OIDC (no static AWS keys). See `Architecture.md` for the workflow definition.
