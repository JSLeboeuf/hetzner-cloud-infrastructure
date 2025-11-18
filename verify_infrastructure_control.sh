#!/bin/bash
# Script de vérification complète du contrôle infrastructure AutoScale AI

echo "════════════════════════════════════════════════════════════"
echo "  🔍 VÉRIFICATION COMPLÈTE - CONTRÔLE INFRASTRUCTURE"
echo "════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to print status
print_status() {
    local status=$1
    local message=$2

    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✅ OK${NC}     $message"
        ((PASSED++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}   $message"
        ((FAILED++))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}   $message"
        ((WARNINGS++))
    else
        echo -e "${BLUE}ℹ️  INFO${NC}   $message"
    fi
}

echo "─────────────────────────────────────────────────────────────"
echo "📋 1. VÉRIFICATION DES CREDENTIALS"
echo "─────────────────────────────────────────────────────────────"
echo ""

# Check .env file
if [ -f "/home/developer/.env" ]; then
    print_status "OK" ".env file exists"

    # Check Namecheap credentials
    if grep -q "NAMECHEAP_API_KEY" /home/developer/.env; then
        print_status "OK" "Namecheap credentials configured"
    else
        print_status "FAIL" "Namecheap credentials missing"
    fi

    # Check Hetzner credentials
    if grep -q "HETZNER_API_TOKEN" /home/developer/.env; then
        print_status "OK" "Hetzner credentials configured"
    else
        print_status "FAIL" "Hetzner credentials missing"
    fi

    # Check Supabase credentials
    if grep -q "SUPABASE_PROJECT_ID" /home/developer/.env; then
        print_status "OK" "Supabase project ID configured"
        # Check if keys are present
        if grep -q "SUPABASE_ANON_KEY=  #" /home/developer/.env; then
            print_status "WARN" "Supabase ANON_KEY missing (project paused)"
        fi
    else
        print_status "FAIL" "Supabase credentials missing"
    fi
else
    print_status "FAIL" ".env file not found"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "🔧 2. VÉRIFICATION MCP SERVERS"
echo "─────────────────────────────────────────────────────────────"
echo ""

# Check MCP config
if [ -f "/home/developer/.mcp.json" ]; then
    print_status "OK" "MCP config file exists"

    # Check Namecheap MCP
    if grep -q "namecheap" /home/developer/.mcp.json; then
        print_status "OK" "Namecheap MCP server configured"

        # Check if the actual server file exists
        if [ -f "/home/developer/.claude-code/mcp-servers/mcp-namecheap/dist/index.js" ]; then
            print_status "OK" "Namecheap MCP server installed"
        else
            print_status "FAIL" "Namecheap MCP server files missing"
        fi
    else
        print_status "FAIL" "Namecheap MCP server not configured"
    fi

    # Check Hetzner MCP
    if grep -q "hetzner" /home/developer/.mcp.json; then
        print_status "OK" "Hetzner MCP server configured"
    else
        print_status "FAIL" "Hetzner MCP server not configured"
    fi
else
    print_status "FAIL" "MCP config file not found"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "🌐 3. VÉRIFICATION RÉSEAU ET IP"
echo "─────────────────────────────────────────────────────────────"
echo ""

# Get current public IP
CURRENT_IP=$(curl -s https://api.ipify.org)
if [ -n "$CURRENT_IP" ]; then
    print_status "OK" "Current public IP: $CURRENT_IP"

    # Check if this IP is whitelisted in .env
    if grep -q "$CURRENT_IP" /home/developer/.env 2>/dev/null; then
        print_status "OK" "IP whitelisted in .env"
    else
        print_status "WARN" "IP not in .env (may need Namecheap whitelist)"
        echo "         Expected IP in Namecheap: $CURRENT_IP"
    fi
else
    print_status "FAIL" "Unable to determine public IP"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "🧪 4. TESTS DE CONNEXION API"
echo "─────────────────────────────────────────────────────────────"
echo ""

# Test Hetzner API
echo "Testing Hetzner Cloud API..."
HETZNER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer HOVEvCJ23bJwg8YQSDooFTlk72ix7g8YtqF7MXTcBXS1kVNvkNDB2Sl63uh7jQuw" \
    https://api.hetzner.cloud/v1/servers)

if [ "$HETZNER_RESPONSE" = "200" ]; then
    print_status "OK" "Hetzner API: Connected (HTTP $HETZNER_RESPONSE)"
else
    print_status "FAIL" "Hetzner API: Failed (HTTP $HETZNER_RESPONSE)"
fi

# Test Namecheap API (will fail if IP not whitelisted)
echo "Testing Namecheap API..."
python3 /home/developer/test_namecheap.py > /tmp/namecheap_test.log 2>&1
if [ $? -eq 0 ]; then
    print_status "OK" "Namecheap API: Connected"
else
    if grep -q "Invalid request IP" /tmp/namecheap_test.log; then
        print_status "WARN" "Namecheap API: IP not whitelisted ($CURRENT_IP)"
    else
        print_status "FAIL" "Namecheap API: Connection failed"
    fi
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "📊 5. DOCUMENTATION"
echo "─────────────────────────────────────────────────────────────"
echo ""

# Check documentation files
if [ -f "/home/developer/SERVICES.md" ]; then
    print_status "OK" "SERVICES.md documentation exists"
else
    print_status "WARN" "SERVICES.md documentation missing"
fi

if [ -f "/home/developer/CONTROL_CAPABILITIES.md" ]; then
    print_status "OK" "CONTROL_CAPABILITIES.md exists"
else
    print_status "WARN" "CONTROL_CAPABILITIES.md missing"
fi

if [ -f "/home/developer/.env.example" ]; then
    print_status "OK" ".env.example template exists"
else
    print_status "WARN" ".env.example template missing"
fi

# Check .gitignore
if [ -f "/home/developer/.gitignore" ]; then
    if grep -q ".env" /home/developer/.gitignore; then
        print_status "OK" ".gitignore protects .env files"
    else
        print_status "FAIL" ".gitignore doesn't protect .env"
    fi
else
    print_status "WARN" ".gitignore file missing"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  📈 RÉSUMÉ"
echo "════════════════════════════════════════════════════════════"
echo ""
echo -e "   ${GREEN}✅ Passed:${NC}     $PASSED"
echo -e "   ${YELLOW}⚠️  Warnings:${NC}   $WARNINGS"
echo -e "   ${RED}❌ Failed:${NC}     $FAILED"
echo ""

# Calculate percentage
TOTAL=$((PASSED + FAILED + WARNINGS))
if [ $TOTAL -gt 0 ]; then
    PERCENTAGE=$((PASSED * 100 / TOTAL))
    echo -e "   Control Level: ${GREEN}${PERCENTAGE}%${NC}"
    echo ""
fi

# Final verdict
if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}   ✅ CONTRÔLE COMPLET: 100% OPÉRATIONNEL${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    else
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}   ⚠️  CONTRÔLE OPÉRATIONNEL AVEC AVERTISSEMENTS${NC}"
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    fi
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}   ❌ CONTRÔLE INCOMPLET - ACTION REQUISE${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Actions requises
if [ $WARNINGS -gt 0 ] || [ $FAILED -gt 0 ]; then
    echo "⚡ ACTIONS REQUISES:"
    echo ""

    if ! grep -q "$CURRENT_IP" /home/developer/.env 2>/dev/null; then
        echo "   1. Whitelist l'IP actuelle dans Namecheap:"
        echo "      IP: $CURRENT_IP"
        echo "      URL: https://ap.www.namecheap.com/settings/tools/apiaccess/whitelisted-ips"
        echo ""
    fi

    if grep -q "SUPABASE_ANON_KEY=  #" /home/developer/.env 2>/dev/null; then
        echo "   2. Réactiver le projet Supabase pour obtenir les clés API"
        echo "      URL: https://supabase.com/dashboard"
        echo ""
    fi

    echo "════════════════════════════════════════════════════════════"
    echo ""
fi

exit 0
