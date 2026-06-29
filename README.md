# CupidShoots.ai

Anonymous compliment + mutual matching for singles meetups. Attendees submit compliments; when two people complimented each other, the system generates a love poem via AWS Bedrock and emails both parties.

## Architecture

![Architecture Diagram](./architecture.drawio.png)

## Stack

| Layer | Technology |
|-------|------------|
| Frontend + API | Next.js (App Router) on Vercel |
| Database | Aurora DSQL (PostgreSQL-compatible, serverless) in us-east-1 |
| Auth | AWS Cognito User Pool (organizer-only) |
| Match Processor | AWS Lambda (Node 20) triggered by EventBridge Scheduler |
| AI / Poems | AWS Bedrock — `anthropic.claude-haiku-20240307-v1:0` |
| Email | AWS SES from `noreply@cupidshoots.ai` |
| Secrets | AWS Secrets Manager |
| IaC | AWS CDK (TypeScript) |

## How It Works

1. An organizer creates an event with a 6-character code and schedules a match processing time.
2. Attendees visit the event page, enter the event code, and submit compliments for other attendees (min 3).
3. At the scheduled time, the Lambda match processor fires and calls back into the Next.js API.
4. Mutual matches (A complimented B and B complimented A) are detected.
5. A love poem is generated via AWS Bedrock for each match and emailed to both parties via SES.

## Getting Started

### Prerequisites

- Node.js 20+
- AWS CLI configured with appropriate credentials
- Aurora DSQL cluster
- AWS CDK deployed (`cd cdk && npm ci && npx cdk deploy`)

### Environment Variables

```
DSQL_ENDPOINT=<cluster>.dsql.us-east-1.on.aws
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
INTERNAL_API_KEY=
FROM_EMAIL=noreply@cupidshoots.ai
MATCH_PROCESSOR_LAMBDA_ARN=
SCHEDULER_ROLE_ARN=
```

### Database Setup

```bash
export DSQL_ENDPOINT=<your-cluster>.dsql.us-east-1.on.aws

# Generate IAM auth token
aws dsql generate-db-connect-admin-auth-token \
  --hostname $DSQL_ENDPOINT \
  --region us-east-1

# Run schema
psql "host=$DSQL_ENDPOINT dbname=postgres sslmode=require" -f schema.sql
```

### Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deployed on Vercel. Push to `main` for production (`cupidshoots.ai`), push to `develop` for staging (`cupidshoots-dev.vercel.app`).
