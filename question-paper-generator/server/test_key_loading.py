import os
import sys
from dotenv import load_dotenv

env_path = r"C:\Question_Paper\Easy_Paper\question-paper-generator\server\.env"
print(f"Checking .env at: {env_path}")
if os.path.exists(env_path):
    print("File exists.")
else:
    print("File DOES NOT exist.")

# specific encoding sometimes helps
loaded = load_dotenv(dotenv_path=env_path, override=True, encoding='utf-8')
print(f"load_dotenv returned: {loaded}")

print("Checking os.environ for GEMINI...")
found = False
for k, v in os.environ.items():
    if "GEMINI" in k:
        print(f"ENV: {k} = {v[:10]}...")
        found = True

if not found:
    print("No GEMINI vars found in os.environ.")

# Manual fallback read test
if not found:
    print("Attempting manual parsing...")
    vals = {}
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                k, v = line.strip().split('=', 1)
                vals[k] = v
    print(f"Manual parse found GEMINI_API_KEY: {'GEMINI_API_KEY' in vals}")

# Now try KeyManager
try:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from app.core.key_manager import KeyManager
    km = KeyManager()
    print(f"KeyManager keys: {len(km.keys)}")
except Exception as e:
    print(f"KeyManager init failed: {e}")
