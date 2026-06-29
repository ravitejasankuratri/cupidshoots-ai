# CupidShoots.ai

No account. Just a code. Compliment strangers anonymously. When two people like each other back, we detect the match and email both an AI-generated love poem. Serverless. AWS. Pure magic.

## What It Does

Attendees at singles meetups anonymously compliment each other using a 6-character event code — no account needed. When two people complimented each other back, we detect the mutual match and email both an AI-generated love poem via AWS Bedrock simultaneously. No rejection risk. Just the moment they find out the feeling was mutual.

## How We Built It

Next.js on Vercel for the frontend and API, Aurora DSQL for the matchmaking self-join query, AWS Cognito for organizer auth, EventBridge Scheduler to fire a Lambda exactly when the event closes, and Amazon Nova Micro on Bedrock to generate the poems. Lambda calls back into our Next.js API rather than the DB directly — keeping credentials centralized.

## Challenges We Ran Into

Aurora DSQL IAM auth token generation in a serverless environment, keeping DB credentials out of Lambda while still letting it trigger match processing, and making the poem feel personal rather than generic.

## Accomplishments We're Proud Of

The mutual match detection is a single elegant SQL self-join. The whole system is serverless and costs essentially nothing between events.

## What We Learned

Serverless boundaries force cleaner architecture. The Lambda-to-API callback pattern simplified credential management more than we expected.

## What's Next

Paid organizer tiers, real-time match notifications, and expanding beyond singles events to networking and team socials.

## Architecture

![Architecture Diagram](./architecture.drawio.png)

## Stack

| Layer | Technology |
|-------|------------|
| Frontend + API | Next.js (App Router) on Vercel |
| Database | Aurora DSQL (PostgreSQL-compatible, serverless) in us-east-1 |
| Auth | AWS Cognito User Pool (organizer-only) |
| Match Processor | AWS Lambda (Node 20) triggered by EventBridge Scheduler |
| AI / Poems | AWS Bedrock — Amazon Nova Micro (`amazon.nova-micro-v1:0`) |
| Email | AWS SES from `noreply@cupidshoots.ai` |
| Secrets | AWS Secrets Manager |
| IaC | Terraform |

## Built With

**Languages:** TypeScript, SQL, HCL
**Frameworks:** Next.js (App Router), Terraform
**Platform:** Vercel, AWS
**Cloud Services:** AWS Bedrock, AWS Lambda, AWS SES, AWS Cognito, AWS EventBridge Scheduler, AWS Secrets Manager
**Database:** Aurora DSQL
**APIs:** Amazon Nova Micro (via AWS Bedrock)

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
- Terraform applied (`cd terraform && terraform init && terraform apply`)

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
