#!/bin/bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}AutoScale AI - Quick Deployment${NC}"
echo -e "${BLUE}Hetzner Cloud Infrastructure${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Terraform
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}✗ Terraform not found${NC}"
    echo "Install: https://developer.hashicorp.com/terraform/downloads"
    exit 1
fi
echo -e "${GREEN}✓ Terraform installed${NC}"

# Check hcloud
if ! command -v hcloud &> /dev/null; then
    echo -e "${RED}✗ hcloud CLI not found${NC}"
    echo "Install: curl https://raw.githubusercontent.com/hetznercloud/cli/main/scripts/install.sh | bash"
    exit 1
fi
echo -e "${GREEN}✓ hcloud CLI installed${NC}"

# Check SSH key
if [ ! -f ~/.ssh/hetzner_autoscale ]; then
    echo -e "${YELLOW}Generating SSH key...${NC}"
    ssh-keygen -t ed25519 -f ~/.ssh/hetzner_autoscale -C "autoscale-ai" -N ""
    echo -e "${GREEN}✓ SSH key generated${NC}"
else
    echo -e "${GREEN}✓ SSH key exists${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Configuration${NC}"
echo -e "${BLUE}========================================${NC}"

# Configure Terraform variables
if [ ! -f terraform/terraform.tfvars ]; then
    echo -e "${YELLOW}Creating terraform.tfvars...${NC}"

    # Get Hetzner token from .env
    if [ -f ~/.env ]; then
        HETZNER_TOKEN=$(grep HETZNER_API_TOKEN ~/.env | cut -d '=' -f2)
    else
        read -p "Enter Hetzner API Token: " HETZNER_TOKEN
    fi

    cat > terraform/terraform.tfvars <<EOF
hcloud_token         = "$HETZNER_TOKEN"
project_name         = "autoscale-ai"
server_location      = "nbg1"
server_type          = "ccx33"
volume_size          = 50
ssh_public_key_path  = "$HOME/.ssh/hetzner_autoscale.pub"
EOF
    echo -e "${GREEN}✓ terraform.tfvars created${NC}"
else
    echo -e "${GREEN}✓ terraform.tfvars exists${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Infrastructure Deployment${NC}"
echo -e "${BLUE}========================================${NC}"

cd terraform/

# Initialize Terraform
if [ ! -d .terraform ]; then
    echo -e "${YELLOW}Initializing Terraform...${NC}"
    terraform init
    echo -e "${GREEN}✓ Terraform initialized${NC}"
fi

# Show plan
echo ""
echo -e "${YELLOW}Terraform Plan:${NC}"
terraform plan

# Confirm deployment
echo ""
read -p "Deploy infrastructure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# Apply
echo -e "${YELLOW}Deploying infrastructure...${NC}"
terraform apply -auto-approve

# Get outputs
SERVER_IP=$(terraform output -raw server_ip)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Server IP: ${BLUE}$SERVER_IP${NC}"
echo -e "SSH Command: ${BLUE}ssh root@$SERVER_IP${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Add DNS record: api.autoscaleai.ca → $SERVER_IP"
echo "2. Wait 5-10 minutes for DNS propagation"
echo "3. SSH to server and deploy application:"
echo "   ${BLUE}ssh root@$SERVER_IP${NC}"
echo ""
echo "See README.md for full deployment instructions."
