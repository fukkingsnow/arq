# ARQ Infrastructure - Terraform Main Configuration
# Phase 16 Deployment & Infrastructure Initiative
# AWS ECS + RDS + ElastiCache + ALB + Auto Scaling

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "arq-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "ARQ"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}

# VPC Configuration
resource "aws_vpc" "arq" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "arq-vpc-${var.environment}"
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.arq.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  tags = {
    Name = "arq-public-subnet-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.arq.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 3)
  availability_zone = var.availability_zones[count.index]
  tags = {
    Name = "arq-private-subnet-${count.index + 1}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "arq" {
  vpc_id = aws_vpc.arq.id
  tags = {
    Name = "arq-igw"
  }
}

# NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"
  tags = {
    Name = "arq-nat-eip-${count.index + 1}"
  }
  depends_on = [aws_internet_gateway.arq]
}

resource "aws_nat_gateway" "arq" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  tags = {
    Name = "arq-nat-${count.index + 1}"
  }
  depends_on = [aws_internet_gateway.arq]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.arq.id
  route {
    cidr_block      = "0.0.0.0/0"
    gateway_id      = aws_internet_gateway.arq.id
  }
  tags = {
    Name = "arq-public-rt"
  }
}

resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.arq.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.arq[count.index].id
  }
  tags = {
    Name = "arq-private-rt-${count.index + 1}"
  }
}

# Security Groups
resource "aws_security_group" "alb" {
  name        = "arq-alb-sg"
  description = "ARQ ALB Security Group"
  vpc_id      = aws_vpc.arq.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs" {
  name        = "arq-ecs-sg"
  description = "ARQ ECS Security Group"
  vpc_id      = aws_vpc.arq.id

  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# RDS Database
resource "aws_db_instance" "arq" {
  identifier              = "arq-postgres-${var.environment}"
  engine                  = "postgres"
  engine_version          = var.db_version
  instance_class          = var.db_instance_class
  allocated_storage       = var.db_allocated_storage
  storage_type            = "gp3"
  storage_encrypted       = true
  multi_az                = var.db_multi_az
  publicly_accessible     = false
  db_subnet_group_name    = aws_db_subnet_group.arq.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  db_name                 = var.db_name
  username                = var.db_username
  password                = random_password.db_password.result
  skip_final_snapshot     = false
  final_snapshot_identifier = "arq-${var.environment}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  backup_retention_period = 30
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"
  deletion_protection     = true
  
  tags = {
    Name = "arq-postgres-${var.environment}"
  }
}

# ElastiCache Redis Cluster
resource "aws_elasticache_cluster" "arq" {
  cluster_id           = "arq-redis-${var.environment}"
  engine               = "redis"
  node_type            = var.cache_node_type
  num_cache_nodes      = var.cache_num_nodes
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.arq.name
  security_group_ids   = [aws_security_group.redis.id]
  automatic_failover_enabled = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token            = random_password.redis_auth.result
  
  tags = {
    Name = "arq-redis-${var.environment}"
  }
}

# ALB
resource "aws_lb" "arq" {
  name               = "arq-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = true
  enable_http2              = true
  enable_cross_zone_load_balancing = true
  
  tags = {
    Name = "arq-alb-${var.environment}"
  }
}

# Target Group
resource "aws_lb_target_group" "arq" {
  name        = "arq-tg-${var.environment}"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.arq.id
  target_type = "ip"

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
  
  tags = {
    Name = "arq-tg-${var.environment}"
  }
}

# ALB Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.arq.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.arq.arn
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "arq" {
  name              = "/ecs/arq-${var.environment}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.logs.arn
  
  tags = {
    Name = "arq-logs-${var.environment}"
  }
}

# Random Passwords
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "random_password" "redis_auth" {
  length  = 32
  special = true
}

# Outputs
output "alb_dns_name" {
  value       = aws_lb.arq.dns_name
  description = "DNS name of the load balancer"
}

output "rds_endpoint" {
  value       = aws_db_instance.arq.endpoint
  description = "RDS database endpoint"
}

output "redis_endpoint" {
  value       = aws_elasticache_cluster.arq.cache_nodes[0].address
  description = "Redis cluster endpoint"
}

output "vpc_id" {
  value       = aws_vpc.arq.id
  description = "VPC ID"
}

output "ecs_security_group_id" {
  value       = aws_security_group.ecs.id
  description = "ECS security group ID"
}
