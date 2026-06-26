# Architecture.md — CupidShoots.ai (Step 1: Discovery Complete)

---

## Stack (Hackathon-Constrained)

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Vercel v0 → Next.js | Hackathon required |
| Backend API | Next.js API Routes (serverless on Vercel) | Co-located with frontend, no cold start overhead |
| Database | **Aurora DSQL** | Hackathon required AWS DB; justified by concurrent writes at event end |
| Auth (organizer) | AWS Cognito User Pool | Managed, serverless, free tier |
| Match Processor | AWS Lambda + EventBridge Scheduler | Fires exactly at event.end_time |
| AI / Poems | AWS Bedrock (Claude Haiku) | All-AWS story; ~$0.003/poem |
| Email | AWS SES | Transactional, reliable, cheap |
| Secrets | AWS Secrets Manager | DB credentials, API keys |
| Monitoring | CloudWatch + X-Ray | Lambda traces, alarms |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     VERCEL (Edge)                       │
│                                                         │
│  ┌──────────────┐      ┌────────────────────────────┐   │
│  │  Next.js UI  │────▶ │   Next.js API Routes       │   │
│  │  (v0 gen'd)  │      │  /api/events               │   │
│  │              │      │  /api/events/:code         │   │
│  │  - Landing   │      │  /api/events/:code/submit  │   │
│  │  - Compliment│      │  /api/organizer/*          │   │
│  │    Form      │      └──────────┬─────────────────┘   │
│  │  - Organizer │                 │                      │
│  │    Dashboard │                 │                      │
│  └──────────────┘                 │                      │
└──────────────────────────────────┼──────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │        AWS Services          │
                    │                             │
                    │  ┌─────────────────────┐    │
                    │  │   Aurora DSQL       │    │
                    │  │  (serverless PG)    │◀───┤
                    │  │  - organizers       │    │
                    │  │  - events           │    │
                    │  │  - submissions      │    │
                    │  │  - compliments      │    │
                    │  │  - matches          │    │
                    │  └─────────────────────┘    │
                    │                             │
                    │  ┌─────────────────────┐    │
                    │  │  EventBridge        │    │
                    │  │  Scheduler          │────┤
                    │  │  (fires at          │    │
                    │  │   event.end_time)   │    │
                    │  └──────────┬──────────┘    │
                    │             │               │
                    │  ┌──────────▼──────────┐    │
                    │  │  Lambda             │    │
                    │  │  Match Processor    │    │
                    │  │  1. Query matches   │    │
                    │  │  2. Call Bedrock    │    │
                    │  │  3. Send SES emails │    │
                    │  │  4. Update status   │    │
                    │  └──────────┬──────────┘    │
                    │             │               │
                    │  ┌──────────▼──────────┐    │
                    │  │  AWS Bedrock        │    │
                    │  │  Claude Haiku       │    │
                    │  │  (poem generation)  │    │
                    │  └─────────────────────┘    │
                    │                             │
                    │  ┌─────────────────────┐    │
                    │  │  AWS SES            │    │
                    │  │  (match email +     │    │
                    │  │   poem delivery)    │    │
                    │  └─────────────────────┘    │
                    │                             │
                    │  ┌─────────────────────┐    │
                    │  │  Cognito User Pool  │    │
                    │  │  (organizer auth)   │    │
                    │  └─────────────────────┘    │
                    └─────────────────────────────┘
```

---

## Data Model (Aurora DSQL — PostgreSQL-compatible)

```sql
-- Organizer accounts
CREATE TABLE organizers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cognito_sub VARCHAR(255) UNIQUE NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Events created by organizers
CREATE TABLE events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES organizers(id),
  event_code   CHAR(6) UNIQUE NOT NULL,
  event_name   VARCHAR(255) NOT NULL,
  venue        VARCHAR(255),
  event_date   TIMESTAMPTZ NOT NULL,
  end_time     TIMESTAMPTZ NOT NULL,  -- when matching runs
  status       VARCHAR(20) DEFAULT 'active'
                 CHECK (status IN ('active','processing','completed')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_events_code ON events(event_code);
CREATE INDEX idx_events_end_time ON events(end_time, status);

-- One row per attendee per event
CREATE TABLE submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID NOT NULL REFERENCES events(id),
  attendee_name    VARCHAR(255) NOT NULL,
  attendee_number  INTEGER NOT NULL,
  attendee_email   VARCHAR(255) NOT NULL,
  compliment_count INTEGER DEFAULT 0,
  submitted_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, attendee_number)
);
CREATE INDEX idx_submissions_event ON submissions(event_id);

-- Individual compliments (min 3 per submission)
CREATE TABLE compliments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id),
  event_id      UUID NOT NULL REFERENCES events(id),
  from_number   INTEGER NOT NULL,
  to_name       VARCHAR(255) NOT NULL,
  to_number     INTEGER NOT NULL,
  message       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CHECK (from_number != to_number)
);
CREATE INDEX idx_compliments_event_from ON compliments(event_id, from_number);
CREATE INDEX idx_compliments_event_to ON compliments(event_id, to_number);

-- Mutual matches after processing
CREATE TABLE matches (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id              UUID NOT NULL REFERENCES events(id),
  person_a_submission   UUID NOT NULL REFERENCES submissions(id),
  person_b_submission   UUID NOT NULL REFERENCES submissions(id),
  poem_for_a            TEXT,
  poem_for_b            TEXT,
  matched_at            TIMESTAMPTZ DEFAULT NOW(),
  emails_sent           BOOLEAN DEFAULT FALSE,
  emails_sent_at        TIMESTAMPTZ
);
```

### Key Access Patterns
| Pattern | Query |
|---------|-------|
| Validate event code | `SELECT * FROM events WHERE event_code = $1 AND status = 'active'` |
| Check for duplicate submission | `SELECT id FROM submissions WHERE event_id=$1 AND attendee_number=$2` |
| Find mutual compliments | Self-join on compliments WHERE c1.from=c2.to AND c1.to=c2.from AND event_id |
| Get events ready to process | `SELECT * FROM events WHERE end_time <= NOW() AND status = 'active'` |
| Organizer dashboard stats | COUNT submissions + matches GROUP BY event_id |

### Mutual Match Query
```sql
SELECT DISTINCT
  LEAST(c1.from_number, c2.from_number) AS person_a,
  GREATEST(c1.from_number, c2.from_number) AS person_b,
  c1.message AS msg_a_to_b,
  c2.message AS msg_b_to_a
FROM compliments c1
JOIN compliments c2
  ON c1.event_id = c2.event_id
 AND c1.from_number = c2.to_number
 AND c1.to_number   = c2.from_number
WHERE c1.event_id = $1
  AND c1.from_number < c2.from_number;  -- deduplicate pairs
```

---

## API Spec

### Public (Attendee)
```
GET  /api/events/:code
     → 200 { event_id, event_name, event_date, status }
     → 404 { error: "Event not found" }
     → 410 { error: "Event has ended" }

POST /api/events/:code/submit
     Body: {
       attendee_name: string,
       attendee_number: number,
       attendee_email: string,
       compliments: [{ to_name, to_number, message }]  // min 3
     }
     → 201 { message: "Compliments sealed! Check email after the event." }
     → 400 { error: "Minimum 3 compliments required" }
     → 409 { error: "You already submitted for this event" }
```

### Organizer (Cognito JWT required)
```
POST /api/organizer/events
     Body: { event_name, venue, event_date, end_time }
     → 201 { event_id, event_code }

GET  /api/organizer/events
     → 200 [{ event_id, event_name, event_code, status, submission_count, match_count }]

GET  /api/organizer/events/:id
     → 200 { ...event, submission_count, match_count, compliment_count }

POST /api/organizer/events/:id/close   (manual override)
     → 202 { message: "Processing started" }
```

### Internal (Lambda only — API key protected)
```
POST /api/internal/process-matches
     Headers: x-internal-key: <secret>
     Body: { event_id }
     → 200 { matches_found, emails_sent }
```

---

## IaC Blueprint (AWS CDK — TypeScript)

```typescript
// lib/cupidshoots-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export class CupidShootsStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── Cognito (Organizer Auth) ──────────────────────────────────────
    const userPool = new cognito.UserPool(this, 'OrganizerPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireDigits: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'OrganizerClient', {
      userPool,
      authFlows: { userSrp: true },
      generateSecret: false,
    });

    // ── Secrets Manager ───────────────────────────────────────────────
    const dbSecret = new secretsmanager.Secret(this, 'DsqlSecret', {
      description: 'Aurora DSQL connection credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
      },
    });

    const internalApiKey = new secretsmanager.Secret(this, 'InternalApiKey', {
      description: 'Internal Lambda → API key',
      generateSecretString: { excludePunctuation: true, passwordLength: 32 },
    });

    // ── Match Processor Lambda ────────────────────────────────────────
    const matchProcessor = new lambda.Function(this, 'MatchProcessor', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/match-processor'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        DB_SECRET_ARN: dbSecret.secretArn,
        INTERNAL_API_URL: 'https://cupidshoots.vercel.app/api/internal/process-matches',
        INTERNAL_API_KEY_ARN: internalApiKey.secretArn,
        FROM_EMAIL: 'noreply@cupidshoots.ai',
        BEDROCK_REGION: 'us-east-1',
      },
    });

    dbSecret.grantRead(matchProcessor);
    internalApiKey.grantRead(matchProcessor);

    // Bedrock permissions
    matchProcessor.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: ['arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-haiku-*'],
    }));

    // SES permissions
    matchProcessor.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    }));

    // ── EventBridge Scheduler (dynamic, created per event via API) ────
    // Scheduler role created here; individual schedules created at runtime
    const schedulerRole = new cdk.aws_iam.Role(this, 'SchedulerRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('scheduler.amazonaws.com'),
    });
    matchProcessor.grantInvoke(schedulerRole);

    // ── CloudWatch Alarms ─────────────────────────────────────────────
    new cloudwatch.Alarm(this, 'MatchProcessorErrors', {
      metric: matchProcessor.metricErrors({ period: cdk.Duration.minutes(5) }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Match processor Lambda errored',
    });

    // ── Outputs ───────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'MatchProcessorArn', { value: matchProcessor.functionArn });
    new cdk.CfnOutput(this, 'SchedulerRoleArn', { value: schedulerRole.roleArn });
  }
}
```

---

## Deployment Plan

### Environments
| Env | Branch | URL |
|-----|--------|-----|
| dev | `develop` | cupidshoots-dev.vercel.app |
| prod | `main` | cupidshoots.ai |

### GitHub Actions (OIDC — no long-lived keys)
```yaml
# .github/workflows/deploy-aws.yml
name: Deploy AWS Infrastructure
on:
  push:
    branches: [main]
    paths: ['cdk/**', 'lambda/**']

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/GithubDeployRole
          aws-region: us-east-1
      - run: cd cdk && npm ci && npx cdk deploy --require-approval never
```

### AWS Budget Alert
```typescript
new cdk.aws_budgets.CfnBudget(this, 'MonthlyCap', {
  budget: {
    budgetType: 'COST',
    timeUnit: 'MONTHLY',
    budgetLimit: { amount: 50, unit: 'USD' },
  },
  notificationsWithSubscribers: [{
    notification: {
      notificationType: 'ACTUAL',
      comparisonOperator: 'GREATER_THAN',
      threshold: 80,
    },
    subscribers: [{ subscriptionType: 'EMAIL', address: 'arvitej9@gmail.com' }],
  }],
});
```

---

## Monthly Cost Estimate (Early Scale: 30 events, 100 attendees avg)

| Service | Usage | Est. Cost |
|---------|-------|-----------|
| Aurora DSQL | ~10k queries/month | ~$1 |
| Lambda | ~30 invocations × 5min | ~$0 (free tier) |
| Bedrock Claude Haiku | ~300 poems (assume 30% match rate) | ~$1 |
| SES | ~600 emails | ~$0.06 |
| Cognito | <50k MAU | $0 |
| Secrets Manager | 2 secrets | ~$0.80 |
| EventBridge Scheduler | 30 schedules | ~$0.03 |
| CloudWatch | Basic metrics | ~$0 |
| **Total** | | **~$3–5/month** |

> ⚠️ Cost caution: Bedrock scales with match volume. At 1000 events/month, estimate ~$100/month for AI alone. Add SES domain verification before launch.

---

## Aurora DSQL Setup (Hackathon Fast-Path)

```bash
# 1. Create DSQL cluster via AWS Console or CLI
aws dsql create-cluster \
  --deletion-protection-enabled false \
  --region us-east-1

# 2. Get connection endpoint from console
# 3. Connect with psql using IAM token auth
export DSQL_ENDPOINT=<your-cluster>.dsql.us-east-1.on.aws
aws dsql generate-db-connect-admin-auth-token \
  --hostname $DSQL_ENDPOINT \
  --region us-east-1

# 4. Run schema
psql "host=$DSQL_ENDPOINT dbname=postgres sslmode=require" \
  -f schema.sql
```

---

## Security Checklist
- [x] Secrets Manager for all credentials (no env var secrets)
- [x] Cognito JWT validation on all organizer routes
- [x] Internal API key for Lambda → Next.js route
- [x] DSQL: IAM auth token (rotates automatically)
- [x] OIDC for GitHub Actions (no static AWS keys)
- [x] CloudTrail enabled by default on AWS account
- [ ] Enable GuardDuty (recommended post-hackathon)
- [ ] SES domain verification before production send
