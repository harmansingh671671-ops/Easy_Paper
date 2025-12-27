import os

env_path = r"C:\Question_Paper\Easy_Paper\question-paper-generator\server\.env"
print(f"Reading: {env_path}")

try:
    with open(env_path, 'rb') as f:
        data = f.read()
        print(f"File size: {len(data)} bytes")
        print(f"First 16 bytes hex: {data[:16].hex()}")
        
        try:
            text = data.decode('utf-8')
            print("Successfully decoded as UTF-8")
        except:
             print("Failed to decode as UTF-8")
             text = data.decode('utf-8', errors='ignore')

    print("--- LINES 1-10 ---")
    lines = text.splitlines()
    for i, line in enumerate(lines[:10]):
        print(f"{i+1}: {line}")
    print("------------------")

    # Simple manual parse search
    for line in lines:
        if line.strip().startswith("GEMINI_API_KEY"):
            print(f"FOUND LINE: {line}")

except Exception as e:
    print(f"Error: {e}")
