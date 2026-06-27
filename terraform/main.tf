terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.80"
    }
  }

  backend "s3" {
    bucket  = "cupidshoots-tfstate"
    key     = "terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region
}

# ── Aurora DSQL Cluster ────────────────────────────────────────────────────────

resource "aws_dsql_cluster" "main" {
  deletion_protection_enabled = var.deletion_protection
}

# ── Secrets Manager ────────────────────────────────────────────────────────────
# Stores the cluster endpoint so Lambda and Next.js can retrieve it at runtime.
# DSQL uses short-lived IAM auth tokens — no password is stored here.

resource "aws_secretsmanager_secret" "dsql" {
  name        = "cupidshoots/dsql"
  description = "Aurora DSQL cluster endpoint for CupidShoots.ai"
}

resource "aws_secretsmanager_secret_version" "dsql" {
  secret_id = aws_secretsmanager_secret.dsql.id
  secret_string = jsonencode({
    endpoint = "${aws_dsql_cluster.main.identifier}.dsql.${var.aws_region}.on.aws"
    region   = var.aws_region
    database = "postgres"
  })
}

# ── Cognito User Pool (organizer auth) ─────────────────────────────────────────

resource "aws_cognito_user_pool" "organizers" {
  name = "cupidshoots-organizers"

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_uppercase = false
    require_lowercase = false
    require_numbers   = false
    require_symbols   = false
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = true
  }

  schema {
    attribute_data_type = "String"
    name                = "name"
    required            = true
    mutable             = true
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "cupidshoots-web"
  user_pool_id = aws_cognito_user_pool.organizers.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  prevent_user_existence_errors = "ENABLED"
}

# ── Lambda IAM Role ────────────────────────────────────────────────────────────

resource "aws_iam_role" "lambda_exec" {
  name = "cupidshoots-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_secrets" {
  name = "cupidshoots-lambda-secrets"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "secretsmanager:GetSecretValue"
      Resource = aws_secretsmanager_secret.dsql.arn
    }]
  })
}

# ── Lambda Function ────────────────────────────────────────────────────────────

data "archive_file" "match_processor" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/match-processor"
  output_path = "${path.module}/../lambda/match-processor.zip"
}

resource "aws_lambda_function" "match_processor" {
  function_name    = "cupidshoots-match-processor"
  role             = aws_iam_role.lambda_exec.arn
  filename         = data.archive_file.match_processor.output_path
  source_code_hash = data.archive_file.match_processor.output_base64sha256
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 300

  environment {
    variables = {
      APP_URL          = var.app_url
      INTERNAL_API_KEY = var.internal_api_key
    }
  }
}

# ── EventBridge Scheduler IAM Role ────────────────────────────────────────────

resource "aws_iam_role" "scheduler" {
  name = "cupidshoots-scheduler"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "scheduler.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "scheduler_invoke" {
  name = "cupidshoots-scheduler-invoke"
  role = aws_iam_role.scheduler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "lambda:InvokeFunction"
      Resource = aws_lambda_function.match_processor.arn
    }]
  })
}
