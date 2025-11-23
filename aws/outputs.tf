output "ec2_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.app.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.app.public_dns
}

output "site_url_ip" {
  description = "URL using the public IP (HTTP)"
  value       = "http://${aws_instance.app.public_ip}"
}

output "site_url_domain" {
  description = "URL using domain if Route 53 record is created"
  value       = var.create_route53_record && var.domain_name != "" ? "http://${var.edge_subdomain}.${var.domain_name}" : ""
}

output "generated_private_key_pem" {
  description = "Generated SSH private key (only when generate_key_pair is true and no key_name provided)"
  value       = var.key_name == "" && var.generate_key_pair ? tls_private_key.generated[0].private_key_pem : ""
  sensitive   = true
}
