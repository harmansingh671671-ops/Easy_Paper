import re
from weasyprint import HTML, CSS
from datetime import datetime
from latex2mathml.converter import convert as latex_to_mathml_convert

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
    <style>
    math {
        font-family: 'Cambria Math', 'STIX Two Math', 'Times New Roman', serif;
        font-size: inherit;
    }
    mfrac {
        display: inline-block;
        vertical-align: -0.5em;
        text-align: center;
    }
    mfrac > * {
        display: block;
    }
    mfrac > :first-child {
        border-bottom: 1px solid currentColor;
        padding-bottom: 0.1em;
    }
    msup, msub {
        display: inline-block;
        vertical-align: baseline;
        position: relative;
    }
    msup > :last-child {
        font-size: 0.7em;
        vertical-align: super;
    }
    msub > :last-child {
        font-size: 0.7em;
        vertical-align: sub;
    }
    msubsup {
        display: inline-block;
        vertical-align: baseline;
        position: relative;
    }
    </style>
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
        @page { 
            size: A4; 
            margin: 2cm 1.5cm; 
        }
        
        body { 
            font-family: 'Times New Roman', serif; 
            font-size: 11pt; 
            line-height: 1.5;
            color: #000;
        }
        
        .paper { 
            width: 100%; 
        }
        
        .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 12px; 
            margin-bottom: 20px; 
        }
        
        .header h1 { 
            margin: 0 0 8px 0; 
            font-size: 20pt; 
            font-weight: bold;
        }
        
        .meta { 
            display: flex; 
            justify-content: space-around; 
            font-size: 10pt; 
            font-weight: normal;
        }
        
        .content { 
            column-count: 2; 
            column-gap: 25px;
            column-rule: 1px solid #ddd;
        }
        
        .question { 
            break-inside: avoid; 
            margin-bottom: 18px;
            page-break-inside: avoid;
        }
        
        .question-header-line { 
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 6px;
        }
        
        .question-number {
            font-weight: bold;
            font-size: 11pt;
        }
        
        .marks { 
            font-weight: normal;
            font-size: 10pt;
            white-space: nowrap;
            margin-left: 10px;
        }
        
        .question-text { 
            margin-bottom: 8px;
            text-align: justify;
        }
        
        .options { 
            margin-left: 25px;
            margin-top: 6px;
        }
        
        .option { 
            margin-bottom: 4px;
            text-align: justify;
        }
        
        .option-label {
            font-weight: bold;
            display: inline-block;
            min-width: 30px;
        }
        """

    def _convert_latex_to_mathml(self, latex_str):
        """Convert single LaTeX string to MathML"""
        try:
            # Preprocessing - handle common symbols
            latex_str = latex_str.strip()
            
            # Replace Greek letters if not already escaped
            replacements = {
                'π': r'\pi',
                'θ': r'\theta',
                'α': r'\alpha',
                'β': r'\beta',
                'γ': r'\gamma',
                'Δ': r'\Delta',
                'δ': r'\delta',
                'ε': r'\epsilon',
                'λ': r'\lambda',
                'μ': r'\mu',
                'σ': r'\sigma',
                'Σ': r'\Sigma',
                'ω': r'\omega',
                'Ω': r'\Omega',
            }
            
            for symbol, latex in replacements.items():
                if symbol in latex_str and latex not in latex_str:
                    latex_str = latex_str.replace(symbol, latex)
            
            # Convert to MathML
            mathml = latex_to_mathml_convert(latex_str)
            return mathml
            
        except Exception as e:
            # If conversion fails, return formatted error or original
            print(f"LaTeX conversion failed for '{latex_str}': {e}")
            return f'<span style="color: red;">[Math Error: {latex_str}]</span>'

    def _render_math(self, text):
        """Process text and convert all LaTeX expressions to MathML"""
        if not text or '$' not in text:
            return text
        
        # Pattern to match $$...$$ (block) and $...$ (inline)
        # Negative lookbehind for escaped \$
        pattern = r'(?<!\\)\$\$(.*?)\$\$|(?<!\\)\$(.*?)\$'
        
        def replace_math(match):
            # Group 1 is block math ($$...$$), Group 2 is inline ($...$)
            latex = match.group(1) if match.group(1) is not None else match.group(2)
            
            if not latex.strip():
                return match.group(0)
            
            return self._convert_latex_to_mathml(latex)
        
        # Replace all math expressions
        result = re.sub(pattern, replace_math, text)
        
        # Handle escaped dollar signs
        result = result.replace(r'\$', '$')
        
        return result

    def generate_pdf(self, questions, title="Question Paper"):
        """Generate PDF from questions list"""
        questions_html = ""
        
        for i, q in enumerate(questions, 1):
            # Process question text
            question_text = self._render_math(q.get("question_text", ""))
            
            # Start question div
            q_html = '<div class="question">'
            
            # Question header with number and marks
            q_html += '<div class="question-header-line">'
            q_html += f'<span class="question-number">Q{i}.</span>'
            q_html += f'<span class="marks">[{q.get("marks", 1)} mark{"s" if q.get("marks", 1) != 1 else ""}]</span>'
            q_html += '</div>'
            
            # Question text
            q_html += f'<div class="question-text">{question_text}</div>'
            
            # Handle MCQ options
            if q.get("question_type") == "MCQ":
                q_html += '<div class="options">'
                
                for opt_letter in ['a', 'b', 'c', 'd']:
                    opt_key = f'option_{opt_letter}'
                    opt_value = q.get(opt_key)
                    
                    if opt_value:
                        rendered_option = self._render_math(opt_value)
                        q_html += f'<div class="option">'
                        q_html += f'<span class="option-label">({opt_letter.upper()})</span> '
                        q_html += rendered_option
                        q_html += '</div>'
                
                q_html += '</div>'
            
            # Close question div
            q_html += '</div>'
            questions_html += q_html
        
        # Calculate total marks
        total_marks = sum(q.get('marks', 1) for q in questions)
        
        # Replace template placeholders
        html_content = self.template
        html_content = html_content.replace('{{title}}', title)
        html_content = html_content.replace('{{total_marks}}', str(total_marks))
        html_content = html_content.replace('{{total_questions}}', str(len(questions)))
        html_content = html_content.replace('{{date}}', datetime.now().strftime('%d %B %Y'))
        html_content = html_content.replace('{{questions_html}}', questions_html)
        
        # Generate PDF
        pdf_bytes = HTML(string=html_content).write_pdf(
            stylesheets=[CSS(string=self.styles)]
        )
        
        return pdf_bytes