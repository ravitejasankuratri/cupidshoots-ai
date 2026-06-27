output "dsql_endpoint" {
  description = "Aurora DSQL cluster endpoint — add to Vercel env as DSQL_ENDPOINT"
  value       = "${aws_dsql_cluster.main.identifier}.dsql.${var.aws_region}.on.aws"
}

output "db_secret_arn" {
  description = "Secrets Manager ARN — add to CDK stack as DB_SECRET_ARN"
  value       = aws_secretsmanager_secret.dsql.arn
}

output "cluster_id" {
  description = "Aurora DSQL cluster ID"
  value       = aws_dsql_cluster.main.identifier
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID — add to Vercel env as COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_USER_POOL_ID"
  value       = aws_cognito_user_pool.organizers.id
}

output "cognito_client_id" {
  description = "Cognito App Client ID — add to Vercel env as COGNITO_CLIENT_ID and NEXT_PUBLIC_COGNITO_CLIENT_ID"
  value       = aws_cognito_user_pool_client.web.id
}

output "match_processor_lambda_arn" {
  description = "Lambda ARN — add to Vercel env as MATCH_PROCESSOR_LAMBDA_ARN"
  value       = aws_lambda_function.match_processor.arn
}

output "scheduler_role_arn" {
  description = "EventBridge Scheduler IAM role ARN — add to Vercel env as SCHEDULER_ROLE_ARN"
  value       = aws_iam_role.scheduler.arn
}
