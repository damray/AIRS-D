terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  name_prefix   = "airs-d"
  repo_dir      = "/opt/airs-d"
  compose_env   = var.enable_ollama ? "COMPOSE_PROFILES=with-ollama" : ""
  instance_tags = merge(var.tags, { Name = "${local.name_prefix}-ec2" })
  ssm_prefix    = length(regexall("^/", var.ssm_parameter_path_prefix)) > 0 ? var.ssm_parameter_path_prefix : "/${var.ssm_parameter_path_prefix}"
  ssm_params    = distinct(compact([
    var.ssm_db_password_parameter,
    var.ssm_jwt_secret_parameter,
    var.ssm_airs_api_token_parameter,
    var.ssm_airs_api_url_parameter,
    var.ssm_airs_profile_parameter,
    var.ssm_vertex_api_key_parameter,
    var.ssm_anthropic_api_key_parameter,
    var.ssm_azure_openai_endpoint_parameter,
    var.ssm_azure_openai_api_key_parameter,
    var.ssm_ollama_api_url_parameter
  ]))
}

# Data source: latest Amazon Linux 2023 AMI matching selected architecture
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-kernel-6.1-*"]
  }

  filter {
    name   = "architecture"
    values = [var.ami_architecture]
  }
}

# Data source: caller identity used to scope SSM policy
data "aws_caller_identity" "current" {}

# Data source: lookup subnets in provided VPC (used when no subnet_id given)
data "aws_subnets" "all" {
  count = var.subnet_id == "" && var.vpc_id != "" ? 1 : 0
  filter {
    name   = "vpc-id"
    values = [var.vpc_id]
  }
}

# Resource: default VPC (only if no vpc_id provided and default exists)
resource "aws_default_vpc" "default" {
  count = var.vpc_id == "" ? 1 : 0
}

# Data source: subnets in default VPC (used if no subnet_id and using default VPC)
data "aws_subnets" "default" {
  count = var.subnet_id == "" && var.vpc_id == "" ? 1 : 0
  filter {
    name   = "vpc-id"
    values = [aws_default_vpc.default[0].id]
  }
}

locals {
  selected_vpc_id = var.vpc_id != "" ? var.vpc_id : aws_default_vpc.default[0].id
  selected_subnet_id = var.subnet_id != "" ? var.subnet_id : (
    var.vpc_id != "" ?
    data.aws_subnets.all[0].ids[0] :
    data.aws_subnets.default[0].ids[0]
  )
}

# Resource: IAM role for EC2 to read SSM parameters (secrets/env)
resource "aws_iam_role" "ec2_role" {
  name = "${local.name_prefix}-role"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.instance_tags
}

# Resource: inline policy granting GetParameter on the configured SSM path prefix
resource "aws_iam_role_policy" "ssm_access" {
  name = "${local.name_prefix}-ssm-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter", "ssm:GetParameters"]
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${trim(local.ssm_prefix, "/") == "" ? "*" : "${local.ssm_prefix}*"}"
      }
    ]
  })
}

# Resource: instance profile to attach IAM role to EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-instance-profile"
  role = aws_iam_role.ec2_role.name
}

# Resource: security group allowing SSH from CIDR and HTTP/HTTPS from anywhere
resource "aws_security_group" "ec2_sg" {
  name        = "${local.name_prefix}-sg"
  description = "Allow SSH/HTTP/HTTPS to AIRS-D host"
  vpc_id      = local.selected_vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
    description = "SSH"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS (optional)"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all egress"
  }

  tags = merge(local.instance_tags, { Name = "${local.name_prefix}-sg" })
}

# Data source: existing key pair, if a name is provided
data "aws_key_pair" "existing" {
  count    = var.key_name != "" ? 1 : 0
  key_name = var.key_name
}

# Resource: generate a key pair when none provided (optional)
resource "tls_private_key" "generated" {
  count     = var.key_name == "" && var.generate_key_pair ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated" {
  count      = var.key_name == "" && var.generate_key_pair ? 1 : 0
  key_name   = "${local.name_prefix}-generated"
  public_key = tls_private_key.generated[0].public_key_openssh
}

# Resource: EC2 host running the Docker Compose stack via user_data bootstrap
resource "aws_instance" "app" {
  ami           = data.aws_ami.al2023.id
  instance_type = var.instance_type
  key_name = var.key_name != "" ? var.key_name : (
    var.generate_key_pair ? aws_key_pair.generated[0].key_name : null
  )

  vpc_security_group_ids      = [aws_security_group.ec2_sg.id]
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  subnet_id                   = local.selected_subnet_id

  user_data = templatefile("${path.module}/user_data.sh", {
    github_repo_url      = var.github_repo_url
    repo_dir             = local.repo_dir
    compose_env          = local.compose_env
    docker_compose_ver   = var.docker_compose_version
    aws_region           = var.aws_region
    ssm_db_password      = var.ssm_db_password_parameter
    ssm_jwt_secret       = var.ssm_jwt_secret_parameter
    ssm_airs_api_token   = var.ssm_airs_api_token_parameter
    ssm_airs_api_url     = var.ssm_airs_api_url_parameter
    ssm_airs_profile     = var.ssm_airs_profile_parameter
    ssm_vertex_api_key   = var.ssm_vertex_api_key_parameter
    ssm_anthropic_key    = var.ssm_anthropic_api_key_parameter
    ssm_azure_endpoint   = var.ssm_azure_openai_endpoint_parameter
    ssm_azure_api_key    = var.ssm_azure_openai_api_key_parameter
    ssm_ollama_api_url   = var.ssm_ollama_api_url_parameter
  })

  tags = local.instance_tags
}

# Data source: hosted zone for creating the edge record (optional)
data "aws_route53_zone" "selected" {
  count = var.create_route53_record ? 1 : 0
  name  = var.domain_name
}

# Resource: Route53 A record pointing edge subdomain to EC2 public IP (optional)
resource "aws_route53_record" "edge" {
  count   = var.create_route53_record ? 1 : 0
  zone_id = data.aws_route53_zone.selected[0].zone_id
  name    = "${var.edge_subdomain}.${var.domain_name}"
  type    = "A"
  ttl     = 300
  records = [aws_instance.app.public_ip]
}
