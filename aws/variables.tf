variable "aws_region" {
  description = "AWS region to deploy to"
  type        = string
  default     = "eu-west-3"
}

// Root domain (used for Route 53 record if enabled)
variable "domain_name" {
  description = "Root domain (e.g., fauray.org). Required if create_route53_record is true."
  type        = string
  default     = ""
}

// Subdomain for the edge/Nginx entrypoint
variable "edge_subdomain" {
  description = "Subdomain for the edge/Nginx entrypoint (e.g., shop => shop.example.com)"
  type        = string
  default     = "shop"
}

// EC2 instance size
variable "instance_type" {
  description = "EC2 instance type (use arm64 type like t4g.nano or x86 like t3.nano)"
  type        = string
  default     = "t4g.nano"
}

// Architecture for the AMI (arm64 for t4g, x86_64 for t3)
variable "ami_architecture" {
  description = "AMI architecture to match the instance type (arm64 for t4g, x86_64 for t3)"
  type        = string
  default     = "arm64"
}

// Git repo to clone on the EC2 instance
variable "github_repo_url" {
  description = "Git repository URL to clone"
  type        = string
  default     = "https://github.com/damray/AIRS-D.git"
}

// CIDR allowed to SSH
variable "ssh_allowed_cidr" {
  description = "CIDR block allowed to SSH (restrict in production)"
  type        = string
  default     = "0.0.0.0/0"
}

// VPC to use (required if no default VPC)
variable "vpc_id" {
  description = "VPC ID where resources will be created (required if no default VPC)"
  type        = string
  default     = ""
}

// Subnet for the EC2 instance
variable "subnet_id" {
  description = "Subnet ID for the EC2 instance (must belong to the VPC)"
  type        = string
  default     = ""
}

// Existing EC2 key pair name
variable "key_name" {
  description = "Existing EC2 key pair name for SSH. Leave empty to deploy without key (not recommended)."
  type        = string
  default     = ""
}

// Generate a new key pair if none provided
variable "generate_key_pair" {
  description = "If no key_name is provided, generate a new key pair (PEM will be in Terraform outputs)."
  type        = bool
  default     = true
}

// Create Route53 record or not
variable "create_route53_record" {
  description = "Create a Route 53 A record for edge_subdomain.domain_name"
  type        = bool
  default     = false
}

// Enable Ollama profile in docker-compose
variable "enable_ollama" {
  description = "Enable the Ollama profile (with-ollama) when bringing up docker compose"
  type        = bool
  default     = false
}

// Version of docker-compose CLI to install
variable "docker_compose_version" {
  description = "docker-compose CLI version to install"
  type        = string
  default     = "v2.23.3"
}

// Prefix for SSM parameter names
variable "ssm_parameter_path_prefix" {
  description = "SSM path prefix for parameters (trailing slash optional)"
  type        = string
  default     = "/airs-d/"
}

// SSM name for DB password (SecureString)
variable "ssm_db_password_parameter" {
  description = "SSM parameter name for the Postgres password (SecureString)"
  type        = string
  default     = "/airs-d/db-password"
}

// Value for DB password
variable "ssm_db_password_value" {
  description = "Value for Postgres password (stored in state; SecureString in SSM)"
  type        = string
  sensitive   = true
  nullable    = false
}

// SSM name for JWT secret (SecureString)
variable "ssm_jwt_secret_parameter" {
  description = "SSM parameter name for the JWT secret (SecureString)"
  type        = string
  default     = "/airs-d/jwt-secret"
}

// Value for JWT secret
variable "ssm_jwt_secret_value" {
  description = "Value for JWT secret (stored in state; SecureString in SSM)"
  type        = string
  sensitive   = true
  nullable    = false
}

// SSM name for AIRS API token (SecureString)
variable "ssm_airs_api_token_parameter" {
  description = "SSM parameter for AIRS API token (SecureString, optional)"
  type        = string
  default     = "/airs-d/airs-api-token"
}

// Value for AIRS API token (optional)
variable "ssm_airs_api_token_value" {
  description = "Value for AIRS API token (optional; stored in state)"
  type        = string
  sensitive   = true
  nullable    = false
}

// SSM name for AIRS API URL
variable "ssm_airs_api_url_parameter" {
  description = "SSM parameter for AIRS API URL (String, optional)"
  type        = string
  default     = "/airs-d/airs-api-url"
}

// Value for AIRS API URL (optional)
variable "ssm_airs_api_url_value" {
  description = "Value for AIRS API URL (optional)"
  type        = string
  nullable    = false
}

// SSM name for AIRS profile
variable "ssm_airs_profile_parameter" {
  description = "SSM parameter for AIRS profile name (String, optional)"
  type        = string
  default     = "/airs-d/airs-profile"
}

// Value for AIRS profile (optional)
variable "ssm_airs_profile_value" {
  description = "Value for AIRS profile name (optional)"
  type        = string
  nullable    = false
}

// SSM name for Vertex API key (SecureString)
variable "ssm_vertex_api_key_parameter" {
  description = "SSM parameter for Vertex API key (SecureString, optional)"
  type        = string
  default     = "/airs-d/vertex-api-key"
}

// Value for Vertex API key (optional)
variable "ssm_vertex_api_key_value" {
  description = "Value for Vertex API key (optional; stored in state)"
  type        = string
  sensitive   = true
  nullable    = false
}

// SSM name for Anthropic API key (SecureString)
variable "ssm_anthropic_api_key_parameter" {
  description = "SSM parameter for Anthropic API key (SecureString, optional)"
  type        = string
  default     = "/airs-d/anthropic-api-key"
}

// Value for Anthropic API key (optional)
variable "ssm_anthropic_api_key_value" {
  description = "Value for Anthropic API key (optional; stored in state)"
  type        = string
  sensitive   = true
  nullable    = false
}

// SSM name for Azure OpenAI endpoint
variable "ssm_azure_openai_endpoint_parameter" {
  description = "SSM parameter for Azure OpenAI endpoint (String, optional)"
  type        = string
  default     = "/airs-d/azure-openai-endpoint"
}

// Value for Azure OpenAI endpoint (optional)
variable "ssm_azure_openai_endpoint_value" {
  description = "Value for Azure OpenAI endpoint (optional)"
  type        = string
  nullable    = false
}

// SSM name for Azure OpenAI API key (SecureString)
variable "ssm_azure_openai_api_key_parameter" {
  description = "SSM parameter for Azure OpenAI API key (SecureString, optional)"
  type        = string
  default     = "/airs-d/azure-openai-api-key"
}

// Value for Azure OpenAI API key (optional)
variable "ssm_azure_openai_api_key_value" {
  description = "Value for Azure OpenAI API key (optional; stored in state)"
  type        = string
  sensitive   = true
  nullable    = false
}

// SSM name for Ollama API URL
variable "ssm_ollama_api_url_parameter" {
  description = "SSM parameter for Ollama API URL (String, optional)"
  type        = string
  default     = "/airs-d/ollama-api-url"
}

// Value for Ollama API URL (optional)
variable "ssm_ollama_api_url_value" {
  description = "Value for Ollama API URL (optional)"
  type        = string
  nullable    = false
}

// Common resource tags
variable "tags" {
  description = "Common tags to apply to AWS resources"
  type        = map(string)
  default     = {
    Project = "airs-d"
    Managed = "terraform"
  }
}
