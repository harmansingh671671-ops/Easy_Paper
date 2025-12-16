from weasyprint import HTML, CSS
from datetime import datetime
import tempfile
import os

class PDFService:
    def __init__(self):
        self.template = self._get_template()
        self.styles = self._get_styles()
    
    def _get_template(self):
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML"></script>
    <script type="text/x-mathjax-config">
        MathJax.Hub.Config({
            tex2jax: {inlineMath: [['$','$']], displayMath: [['$$','$$']]}
        });
    </script>
</head>
<body>
    <div class="paper">
        <div class="header">
            <h1>{{title}}</h1>
            <div class="meta">
                <span>Total Marks: {{total_marks}}</span>
                <span>Questions: {{total_questions}}</span>
                <span>Date: {{date}}</span>
            </div>
        </div>
        
        <div class="content">
            {{questions_html}}
        </div>
    </div>
</body>
</html>
        """
    
    def _get_styles(self):
        return """
        @page { size: A4; margin: 2cm; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
        .paper { width: 100%; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0 0 10px 0; font-size: 18pt; }
        .meta { display: flex; justify-content: space-around; font-size: 10pt; }
        .content { column-count: 2; column-gap: 30px; }
        .question { break-inside: avoid; margin-bottom: 20px; }
        .question-header { font-weight: bold; margin-bottom: 5px; }
        .question-text { margin-bottom: 10px; }
        .options { margin-left: 20px; }
        .option { margin-bottom: 5px; }
        """
    
    def generate_pdf(self, questions, title="Question Paper"):
        questions_html = ""
        
        for i, q in enumerate(questions, 1):
            q_html = f'<div class="question">'
            q_html += f'<div class="question-header">Q{i}. [{q["marks"]} marks]</div>'
            q_html += f'<div class="question-text">{q["question_text"]}</div>'
            
            if q["question_type"] == "MCQ":
                q_html += '<div class="options">'
                for opt in ['a', 'b', 'c', 'd']:
                    opt_val = q.get(f'option_{opt}')
                    if opt_val:
                        q_html += f'<div class="option">({opt.upper()}) {opt_val}</div>'
                q_html += '</div>'
            
            q_html += '</div>'
            questions_html += q_html
        
        html_content = self.template.replace('{{title}}', title)
        html_content = html_content.replace('{{total_marks}}', str(sum(q['marks'] for q in questions)))
        html_content = html_content.replace('{{total_questions}}', str(len(questions)))
        html_content = html_content.replace('{{date}}', datetime.now().strftime('%d-%m-%Y'))
        html_content = html_content.replace('{{questions_html}}', questions_html)
        
        pdf_bytes = HTML(string=html_content).write_pdf(stylesheets=[CSS(string=self.styles)])
        return pdf_bytes