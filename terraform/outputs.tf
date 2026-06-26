output "dsql_endpoint" {
  description = "Aurora DSQL cluster endpoint — add to Vercel env as DSQL_ENDPOINT"
  value       = aws_dsql_cluster.main.endpoint
}

output "db_secret_arn" {
  description = "Secrets Manager ARN — add to CDK stack as DB_SECRET_ARN"
  value       = aws_secretsmanager_secret.dsql.arn
}

output "cluster_id" {
  description = "Aurora DSQL cluster ID"
  value       = aws_dsql_cluster.main.id
}
