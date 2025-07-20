#!/usr/bin/env python3
"""
Health check script for the Flask application
"""

import requests
import sys
import time

def check_health():
    """Check if the Flask application is healthy"""
    try:
        response = requests.get('http://localhost:5000/health', timeout=10)
        if response.status_code == 200:
            print("Health check passed")
            return True
        else:
            print(f"Health check failed with status code: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"Health check failed with error: {e}")
        return False

def main():
    """Main function"""
    max_retries = 3
    retry_delay = 2
    
    for attempt in range(max_retries):
        if check_health():
            sys.exit(0)
        
        if attempt < max_retries - 1:
            print(f"Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
    
    print("Health check failed after all retries")
    sys.exit(1)

if __name__ == "__main__":
    main()