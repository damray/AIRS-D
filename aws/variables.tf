variable "aws_region" {
  description = "AWS region to deploy to"
  type        = string
  default     = "eu-west-3"
}

variable "domain_name" {
  description = "Root domain (e.g., fauray.org). Required if create_route53_record is true."
  type        = string
  default     = ""
}

variable "edge_subdomain" {
  description = "Subdomain for the edge/Nginx entrypoint (e.g., shop => shop.example.com)"
  type        = string
  default     = "shop"
}

variable "instance_type" {
  description = "EC2 instance type (use arm64 type like t4g.nano or x86 like t3.nano)"
  type        = string
  default     = "t4g.nano"
}

variable "ami_architecture" {
  description = "AMI architecture to match the instance type (arm64 for t4g, x86_64 for t3)"
  type        = string
  default     = "arm64"
}

variable "github_repo_url" {
  description = "Git repository URL to clone"
  type        = string
  default     = "https://github.com/damray/AIRS-D.git"
}

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed to SSH (restrict in production)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "vpc_id" {
  description = "VPC ID where resources will be created (required if no default VPC)"
  type        = string
  default     = ""
}

variable "subnet_id" {
  description = "Subnet ID for the EC2 instance (must belong to the VPC)"
  type        = string
  default     = ""
}

variable "key_name" {
  description = "Existing EC2 key pair name for SSH. Leave empty to deploy without key (not recommended)."
  type        = string
  default     = ""
}

variable "generate_key_pair" {
  description = "If no key_name is provided, generate a new key pair (PEM will be in Terraform outputs)."
  type        = bool
  default     = true
}

variable "create_route53_record" {
  description = "Create a Route 53 A record for edge_subdomain.domain_name"
  type        = bool
  default     = false
}

variable "enable_ollama" {
  description = "Enable the Ollama profile (with-ollama) when bringing up docker compose"
  type        = bool
  default     = false
}

variable "docker_compose_version" {
  description = "docker-compose CLI version to install"
  type        = string
  default     = "v2.23.3"
}

variable "ssm_parameter_path_prefix" {
  description = "SSM path prefix for parameters (trailing slash optional)"
  type        = string
  default     = "/airs-d/"
}

variable "ssm_db_password_parameter" {
  description = "SSM parameter name for the Postgres password (SecureString)"
  type        = string
  default     = "your_secure_database_password_here"
}

variable "ssm_jwt_secret_parameter" {
  description = "SSM parameter name for the JWT secret (SecureString)"
  type        = string
  default     = "your_jwt_secret_key_here"
}

variable "ssm_airs_api_token_parameter" {
  description = "SSM parameter for AIRS API token (SecureString, optional)"
  type        = string
  default     = "/airs-d/airs-api-token"
}

variable "ssm_airs_api_url_parameter" {
  description = "SSM parameter for AIRS API URL (String, optional)"
  type        = string
  default     = "/airs-d/airs-api-url"
}

variable "ssm_airs_profile_parameter" {
  description = "SSM parameter for AIRS profile name (String, optional)"
  type        = string
  default     = "/airs-d/airs-profile"
}

variable "ssm_vertex_api_key_parameter" {
  description = "SSM parameter for Vertex API key (SecureString, optional)"
  type        = string
  default     = "/airs-d/vertex-api-key"
}

variable "ssm_anthropic_api_key_parameter" {
  description = "SSM parameter for Anthropic API key (SecureString, optional)"
  type        = string
  default     = "/airs-d/anthropic-api-key"
}

variable "ssm_azure_openai_endpoint_parameter" {
  description = "SSM parameter for Azure OpenAI endpoint (String, optional)"
  type        = string
  default     = "/airs-d/azure-openai-endpoint"
}

variable "ssm_azure_openai_api_key_parameter" {
  description = "SSM parameter for Azure OpenAI API key (SecureString, optional)"
  type        = string
  default     = "/airs-d/azure-openai-api-key"
}

variable "ssm_ollama_api_url_parameter" {
  description = "SSM parameter for Ollama API URL (String, optional)"
  type        = string
  default     = "/airs-d/ollama-api-url"
}

variable "tags" {
  description = "Common tags to apply to AWS resources"
  type        = map(string)
  default     = {
    Project = "airs-d"
    Managed = "terraform"
  }
}
