#!/usr/bin/env python3
"""Test Namecheap API connection"""

import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import os

# Credentials from .env
API_USER = "jsleboeuf"
API_KEY = "7c0976fb2ecd44818b57f10529299336"
USERNAME = "jsleboeuf"
CLIENT_IP = "142.169.187.248"

def test_namecheap_connection():
    """Test connection to Namecheap API by getting domain list"""

    print("🔍 Testing Namecheap API Connection...")
    print(f"   API User: {API_USER}")
    print(f"   Client IP: {CLIENT_IP}")
    print()

    # API endpoint
    base_url = "https://api.namecheap.com/xml.response"

    # Parameters
    params = {
        "ApiUser": API_USER,
        "ApiKey": API_KEY,
        "UserName": USERNAME,
        "ClientIp": CLIENT_IP,
        "Command": "namecheap.domains.getList",
        "PageSize": "100",
        "Page": "1"
    }

    # Build URL
    url = f"{base_url}?{urllib.parse.urlencode(params)}"

    try:
        # Make request
        print("📡 Sending request to Namecheap API...")
        with urllib.request.urlopen(url, timeout=10) as response:
            data = response.read()

        # Parse XML response
        root = ET.fromstring(data)

        # Check for errors
        errors = root.findall(".//{http://api.namecheap.com/xml.response}Errors/{http://api.namecheap.com/xml.response}Error")

        if errors:
            print("❌ API Error:")
            for error in errors:
                print(f"   {error.text}")
            return False

        # Get domains
        domains = root.findall(".//{http://api.namecheap.com/xml.response}Domain")

        print(f"✅ Connection successful!")
        print(f"\n📋 Found {len(domains)} domain(s):")

        for domain in domains:
            name = domain.get("Name", "Unknown")
            expires = domain.get("Expires", "Unknown")
            auto_renew = domain.get("AutoRenew", "Unknown")
            is_locked = domain.get("IsLocked", "Unknown")

            print(f"\n   🌐 Domain: {name}")
            print(f"      Expires: {expires}")
            print(f"      Auto-Renew: {auto_renew}")
            print(f"      Locked: {is_locked}")

        return True

    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.reason}")
        print(f"   Response: {e.read().decode()}")
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
    print("   NAMECHEAP API CONNECTION TEST")
    print("="*60 + "\n")

    success = test_namecheap_connection()

    print("\n" + "="*60)
    if success:
        print("   ✅ NAMECHEAP: OPERATIONAL")
    else:
        print("   ❌ NAMECHEAP: FAILED")
    print("="*60 + "\n")

    exit(0 if success else 1)
