terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.80"
    }
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
