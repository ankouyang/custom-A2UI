#!/usr/bin/env python3
"""Test proxy connection to Google API."""

import os
import sys

# Set proxy environment variables
os.environ['HTTP_PROXY'] = 'socks5://127.0.0.1:1080'
os.environ['HTTPS_PROXY'] = 'socks5://127.0.0.1:1080'

print("Testing proxy connection...")
print(f"HTTP_PROXY: {os.environ.get('HTTP_PROXY')}")
print(f"HTTPS_PROXY: {os.environ.get('HTTPS_PROXY')}")

try:
    import requests
    print("\nTrying with requests library...")

    # Test with a simple GET first (disable SSL verification for testing)
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    response = requests.get("https://www.google.com", timeout=10, verify=False)
    print(f"Google.com status: {response.status_code}")

    print("Proxy connection established!")

    # First list available models
    print("\nListing available models...")
    api_key = "AIzaSyA2b-xFGhbkswoE-N1nKcy9hBFc4RLq_Qk"
    list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    list_resp = requests.get(list_url, timeout=10, verify=False)
    if list_resp.status_code == 200:
        models = list_resp.json()
        flash_models = [m for m in models.get('models', []) if 'flash' in m.get('name', '').lower()]
        print(f"Found {len(flash_models)} Flash models")
        if flash_models:
            print("First Flash model:", flash_models[0].get('name'))

    # Now test Gemini API
    print("\nTesting Gemini API...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    data = {
        "contents": [{"parts": [{"text": "Say OK"}]}],
        "generationConfig": {"maxOutputTokens": 10}
    }

    response = requests.post(url, json=data, timeout=30, verify=False)
    print(f"API Status: {response.status_code}")

    if response.status_code == 200:
        print("API Response:", response.json())
    else:
        print("API Error:", response.text)

except ImportError as e:
    print(f"\nMissing dependency: {e}")
    print("\nTrying to install requests[socks]...")
    os.system("pip install requests[socks] -q")
    print("Please run this script again after installation.")

except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    print("\nNote: If you see 'Missing dependencies for SOCKS support', install with:")
    print("  pip install requests[socks]")
