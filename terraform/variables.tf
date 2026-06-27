variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "deletion_protection" {
  description = "Enable deletion protection on the DSQL cluster"
  type        = bool
  default     = false
}

variable "app_url" {
  description = "Vercel deployment URL (e.g. https://cupidshoots-ai.vercel.app)"
  type        = string
}

variable "internal_api_key" {
  description = "Secret key shared between Lambda and Next.js internal API"
  type        = string
  sensitive   = true
}
