import os
import urllib.request
import json
import ssl
import sys

KEY_FILE_PATH = r"c:\Question_Paper\Easy_Paper\XIOMI API's.txt"
OUTPUT_FILE = "debug_output.txt"

def test_keys():
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as out:
        if not os.path.exists(KEY_FILE_PATH):
            out.write(f"File not found: {KEY_FILE_PATH}\n")
            return

        try:
            with open(KEY_FILE_PATH, 'r', encoding='utf-8') as f:
                lines = [line.strip() for line in f.readlines()]
                
            keys = [k for k in lines if k and k.startswith('sk-')]
            
            out.write(f"Found {len(keys)} keys starting with 'sk-'.\n")
            
            if not keys:
                out.write("No valid keys found.\n")
                return

            for i, key in enumerate(keys):
                prefix = key[:20] + "..."
                out.write(f"Key {i+1}: {prefix}\n")
                
                if not key.startswith("sk-or-v1-"):
                    out.write("  WARNING: Does not start with 'sk-or-v1-'. Might not be an OpenRouter key.\n")
                else:
                    out.write("  Format: Valid OpenRouter prefix.\n")

            # Test first key
            test_key = keys[0]
            out.write(f"\nTesting Key 1: {test_key[:20]}...\n")
            
            req = urllib.request.Request("https://openrouter.ai/api/v1/credits")
            req.add_header("Authorization", f"Bearer {test_key}")
            req.add_header("HTTP-Referer", "https://localhost:3000")
            req.add_header("X-Title", "Debugging Script")
            
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            try:
                with urllib.request.urlopen(req, context=ctx) as response:
                    out.write(f"Status: {response.getcode()}\n")
                    out.write(f"Response: {response.read().decode('utf-8')}\n")
            except urllib.error.HTTPError as e:
                out.write(f"HTTP Error: {e.code}\n")
                out.write(f"Response: {e.read().decode('utf-8')}\n")
            except Exception as e:
                out.write(f"Request Error: {e}\n")

        except Exception as e:
            out.write(f"General Error: {e}\n")

if __name__ == "__main__":
    test_keys()
