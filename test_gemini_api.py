#!/usr/bin/env python3
"""Test script to verify Gemini API key is working."""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("Error: GEMINI_API_KEY not found in environment")
    exit(1)

print(f"API Key found: {API_KEY[:10]}...{API_KEY[-4:]}")
print("\nTesting API connection...")

# Test with a simple request
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}"

headers = {
    "Content-Type": "application/json"
}

data = {
    "contents": [{
        "parts": [{
            "text": "Hello, respond with just 'OK' if you receive this."
        }]
    }],
    "generationConfig": {
        "temperature": 0.1,
        "maxOutputTokens": 10
    }
}

try:
    print(f"Sending request to: {url[:80]}...")
    response = requests.post(url, json=data, headers=headers, timeout=30)

    print(f"\nResponse Status: {response.status_code}")

    if response.status_code == 200:
        result = response.json()
        print("SUCCESS: API Key is VALID and working!")
        print(f"Response: {result}")
    else:
        print(f"API Error: {response.status_code}")
        print(f"Response: {response.text}")

except requests.exceptions.Timeout:
    print("Request timed out after 30 seconds")
    print("This suggests network connectivity issues or API overload")
except requests.exceptions.ConnectionError as e:
    print(f"Connection Error: {e}")
    print("Cannot reach Google's API servers. Check your internet connection.")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
