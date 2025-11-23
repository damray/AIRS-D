# AIRS-D Deployment on AWS (Terraform, Single EC2)

This guide is written for someone new to the project. It deploys the entire Docker Compose stack (edge Nginx, frontend, backend, Postgres, optional Ollama) on one small EC2 instance. Bedrock is used as a managed service (no extra infra to create), other SaaS LLMs are called directly by the backend.

## What Terraform Builds
- One EC2 instance (default t4g/t3 nano) with a public IP.
- Security Group: opens 80/443 to the world, 22 from your chosen CIDR.
- IAM role + instance profile: read SSM parameters; invoke AWS Bedrock.
- SSM parameters: DB/JWT and optional provider secrets are written from the values you provide at `terraform apply`.
- User data on the instance: installs Docker + docker-compose, clones this repo into `/opt/airs-d`, pulls SSM values, writes `.env*`, then runs `docker-compose up -d`.
- Optional Route53 A record if you supply `domain_name` and set `create_route53_record=true`.

## Prerequisites
- AWS credentials configured (`aws configure` or env vars).
- Terraform >= 1.4 installed.
- Networking: either a default VPC exists, or you provide `vpc_id` and `subnet_id` (subnet must belong to the VPC).
- (Optional) Route53 hosted zone if you want DNS.

## Variables You Will Be Asked For (no defaults)
- `ssm_db_password_value`: Postgres password (SecureString).
- `ssm_jwt_secret_value`: JWT secret (SecureString).
- Optional provider values (if you want real calls instead of mocks):
  - `ssm_airs_api_token_value`, `ssm_airs_api_url_value`, `ssm_airs_profile_value`
  - `ssm_vertex_api_key_value`
  - `ssm_anthropic_api_key_value`
  - `ssm_azure_openai_endpoint_value`, `ssm_azure_openai_api_key_value`
  - `ssm_ollama_api_url_value`
If you leave optional values blank, the backend will fall back to mocks where applicable.

## Other Key Variables (defaults set in `variables.tf`)
- `aws_region` (default: eu-west-3).
- `instance_type`, `ami_architecture` (t4g/t3 nano).
- `key_name` (existing key) or `generate_key_pair` (auto-generate, outputs PEM).
- `ssh_allowed_cidr` (who can SSH).
- `enable_ollama` (enable compose profile `with-ollama`).
- `create_route53_record`, `domain_name`, `edge_subdomain` (DNS).
- `vpc_id`, `subnet_id` (required if no default VPC).

## Deploy Steps (one by one)
```bash
cd aws
terraform init
# Plan: you will be prompted for the SSM values above
terraform plan -out tfplan
# Apply: enter "yes" when satisfied
terraform apply tfplan
```

## Terraform Outputs (what they mean)
- `ec2_public_ip`: public IP of the instance. Use http://<ip> to reach the app.
- `ec2_public_dns`: public DNS of the instance.
- `site_url_ip`: handy URL using the IP.
- `site_url_domain`: set only if you created a Route53 record (http://<edge_subdomain>.<domain_name>).
- `generated_private_key_pem`: present only if `generate_key_pair=true` and no `key_name` provided. **Keep it safe.**

## Connect to the App
- Without DNS: open `http://<ec2_public_ip>` in your browser (edge proxies frontend and backend).
- With DNS: open `http://<edge_subdomain>.<domain_name>` if you enabled Route53.
- Health check: `curl http://<ec2_public_ip>/api/health` (proxied via edge) or `curl http://<ec2_public_ip>:80/health`.

## SSH Access
If you generated a key:
```bash
terraform output -raw generated_private_key_pem > airs-d-generated.pem
chmod 600 airs-d-generated.pem
ssh -i airs-d-generated.pem ec2-user@$(terraform output -raw ec2_public_ip)
```
If you used an existing key pair, use that instead.

## After First Boot
- Docker should be running the stack automatically (`docker-compose up -d` in `/opt/airs-d`).
- Verify on the instance:
  ```bash
  ssh -i ... ec2-user@<ip>
  cd /opt/airs-d
  docker ps
  docker-compose logs backend
  ```
- If optional provider SSM values were left empty, backend will use mock responses where designed.

## Notes
- First start may take a few minutes (image pulls, optional Ollama).
- Keep ports 80/443 open for access; restrict 22 via `ssh_allowed_cidr`.
- Bedrock: no extra infra created; IAM on the instance allows InvokeModel in the selected region.
