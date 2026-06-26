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
