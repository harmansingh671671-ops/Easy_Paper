import os

env_path = r"C:\Question_Paper\Easy_Paper\question-paper-generator\server\.env"
new_lines = []
updated = False

if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for line in lines:
        if line.strip().startswith("GEMINI_MODEL="):
            new_lines.append("GEMINI_MODEL=gemini-1.5-flash\n")
            updated = True
        else:
            new_lines.append(line)
            
    if not updated:
        # If variable didn't exist, append it
        new_lines.append("\nGEMINI_MODEL=gemini-1.5-flash\n")

    with open(env_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"Updated {env_path} to use gemini-1.5-flash")
else:
    print(f"Error: {env_path} not found")
