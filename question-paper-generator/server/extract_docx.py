import zipfile
import re
import sys

def extract_text(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read('word/document.xml').decode('utf-8')
            text = re.sub('<[^>]+>', '\n', xml_content) # Replace tags with newlines for some structure
            # Clean up multiple newlines
            text = re.sub('\n+', '\n', text)
            print(text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_text(r"c:\Question_Paper\Easy_Paper\API OP.docx")
