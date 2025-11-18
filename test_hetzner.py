#!/usr/bin/env python3
"""Test Hetzner Cloud API connection"""

import urllib.request
import json
import os

# Credentials from .env
API_TOKEN = "HOVEvCJ23bJwg8YQSDooFTlk72ix7g8YtqF7MXTcBXS1kVNvkNDB2Sl63uh7jQuw"

def test_hetzner_connection():
    """Test connection to Hetzner Cloud API"""

    print("🔍 Testing Hetzner Cloud API Connection...")
    print(f"   Token: {API_TOKEN[:20]}...")
    print()

    # API endpoint
    url = "https://api.hetzner.cloud/v1/servers"

    try:
        # Create request with authorization header
        print("📡 Sending request to Hetzner Cloud API...")
        req = urllib.request.Request(url)
        req.add_header("Authorization", f"Bearer {API_TOKEN}")

        # Make request
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read())

        # Parse response
        servers = data.get("servers", [])

        print(f"✅ Connection successful!")
        print(f"\n📋 Found {len(servers)} server(s):")

        if servers:
            for server in servers:
                name = server.get("name", "Unknown")
                status = server.get("status", "Unknown")
                server_type = server.get("server_type", {}).get("name", "Unknown")
                datacenter = server.get("datacenter", {}).get("name", "Unknown")

                # Get IP addresses
                public_net = server.get("public_net", {})
                ipv4 = public_net.get("ipv4", {}).get("ip", "N/A")
                ipv6 = public_net.get("ipv6", {}).get("ip", "N/A")

                print(f"\n   🖥️  Server: {name}")
                print(f"      Status: {status}")
                print(f"      Type: {server_type}")
                print(f"      Datacenter: {datacenter}")
                print(f"      IPv4: {ipv4}")
                print(f"      IPv6: {ipv6}")
        else:
            print("\n   ℹ️  No servers currently deployed")

        # Test project info
        print("\n📊 Testing project access...")
        project_url = "https://api.hetzner.cloud/v1/projects"
        req = urllib.request.Request(project_url)
        req.add_header("Authorization", f"Bearer {API_TOKEN}")

        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read())
            projects = data.get("projects", [])
            if projects:
                print(f"   ✅ Access to {len(projects)} project(s)")

        return True

    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.reason}")
        try:
            error_data = json.loads(e.read().decode())
            print(f"   Error: {error_data.get('error', {}).get('message', 'Unknown error')}")
        except:
            pass
        return False

    except urllib.error.URLError as e:
        print(f"❌ URL Error: {e.reason}")
        return False

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\n" + "="*60)
    print("   HETZNER CLOUD API CONNECTION TEST")
    print("="*60 + "\n")

    success = test_hetzner_connection()

    print("\n" + "="*60)
    if success:
        print("   ✅ HETZNER: OPERATIONAL")
    else:
        print("   ❌ HETZNER: FAILED")
    print("="*60 + "\n")

    exit(0 if success else 1)
