import PyPDF2
import os

pdf_path = r"C:\Question_Paper\Easy_Paper\AI logic.pdf"

if not os.path.exists(pdf_path):
    print(f"Error: File not found at {pdf_path}")
    exit(1)

try:
    with open(pdf_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        output_text = ""
        for i, page in enumerate(reader.pages):
            output_text += f"--- Page {i+1} ---\n"
            output_text += page.extract_text() + "\n"
        
        with open("pdf_decoded.txt", "w", encoding="utf-8") as out:
            out.write(output_text)
        print("Done writing to pdf_decoded.txt")
except Exception as e:
    print(f"Error reading PDF: {e}")
