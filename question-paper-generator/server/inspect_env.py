import os

env_path = r"C:\Question_Paper\Easy_Paper\question-paper-generator\server\.env"
output_path = "env_content.txt"

try:
    with open(env_path, 'rb') as f:
        content = f.read()
        
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"File Size: {len(content)} bytes\n")
        f.write("Raw Content (repr):\n")
        f.write(repr(content))
        f.write("\n\nDecoded Lines:\n")
        try:
            decoded = content.decode('utf-8')
            for i, line in enumerate(decoded.splitlines()):
                f.write(f"{i+1}: {repr(line)}\n")
        except Exception as e:
            f.write(f"Decode Error: {e}")

    print("Done writing env_content.txt")

except Exception as e:
    print(f"Error: {e}")
