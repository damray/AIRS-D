# AIRS-D AWS Bootstrap (Terraform)

Déploie la stack Docker Compose sur une seule instance EC2.

## Prérequis
- AWS creds configurés (`aws configure` ou variables d’env)
- Terraform >= 1.4
- Une paire de clés EC2 existante si vous voulez SSH (`key_name`)
- Secrets stockés dans SSM Parameter Store (SecureString) avec les noms par défaut :
  - `/airs-d/db-password` (obligatoire)
  - `/airs-d/jwt-secret` (obligatoire)
  - `/airs-d/airs-api-token`, `/airs-d/airs-api-url`, `/airs-d/airs-profile` (optionnel)
  - `/airs-d/vertex-api-key`, `/airs-d/anthropic-api-key`, `/airs-d/azure-openai-endpoint`, `/airs-d/azure-openai-api-key`, `/airs-d/ollama-api-url` (optionnel)
  Vous pouvez changer les noms via `variables.tf`.

## Variables clés (voir `variables.tf`)
- `aws_region` (défaut: eu-west-3)
- `instance_type` (défaut: t4g.nano, utilisez t3.nano si vous restez en x86_64)
- `ami_architecture` (arm64 pour t4g, x86_64 pour t3)
- `github_repo_url` (défaut repo AIRS-D)
- `enable_ollama` (false par défaut, passe COMPOSE_PROFILES=with-ollama)
- `create_route53_record` + `domain_name` + `edge_subdomain` pour le DNS
- `ssh_allowed_cidr` et `key_name` pour l’accès SSH
- `vpc_id` et `subnet_id` : obligatoires si vous n’avez pas de VPC par défaut (le subnet doit appartenir au VPC)
- Paramètres SSM : noms configurables, valeurs lues au boot par l’EC2 (rôle IAM auto-créé avec accès en lecture). Les secrets ne passent pas dans le state Terraform.

## Usage
```bash
cd aws
terraform init
terraform plan -out tfplan
terraform apply tfplan
```

## Connexion SSH
terraform output -raw generated_private_key_pem > airs-d-generated.pem    
chmod 600 airs-d-generated.pem            
```bash
ssh -i airs-d-generated.pem ec2-user@$(terraform output -raw ec2_public_ip)
```

## Notes
- Le script `user_data.sh` installe Docker + docker-compose, clone le repo dans `/opt/airs-d`, puis lance `docker-compose up -d`.
- La première montée peut prendre quelques minutes (images, éventuellement Ollama).
- Le SG ouvre 80/443 à tous et 22 selon `ssh_allowed_cidr`. Restreignez en prod.
