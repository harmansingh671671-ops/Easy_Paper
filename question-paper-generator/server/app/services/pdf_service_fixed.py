import re
import subprocess
from pathlib import Path
from weasyprint import HTML, CSS
from datetime import datetime


class QuestionService:
    def __init__(self):
        self.template = self._get_template()
        self.base_path = Path(__file__).resolve().parent
        self.katex_css = self._get_katex_css()
        self.styles = self.katex_css + self._get_styles()

    def _get_katex_css(self):
        css_path = self.base_path / 'katex.min.css'
        try:
            with open(css_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            return ""

    def _get_template(self):
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
    /* minimal fallback styles */
    .katex-display { margin: 0.5em 0; }
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
        @page { size: A4; margin: 2cm 1.5cm; }
        body { font-family: 'Times New Roman', serif; font-size: 11pt; }
        .content { column-count: 2; column-gap: 25px; }
        """

    def _convert_latex_to_katex_html(self, latex_str, display_mode=False):
        """Call a Node.js helper script to render KaTeX HTML. Returns HTML string."""
        try:
            # Basic sanitization: remove null bytes and trim whitespace
            if latex_str is None:
                return ""
            latex_str = latex_str.replace('\x00', '').strip()

            # Limit length to avoid abusing command-line arguments or DoS
            MAX_LATEX_ARG = 2000
            if len(latex_str) > MAX_LATEX_ARG:
                latex_str = latex_str[:MAX_LATEX_ARG] + "..."
            if not latex_str:
                return ""

            script_path = self.base_path / 'render_katex.js'
            server_dir = self.base_path.parent.parent
            command = ['node', str(script_path), latex_str]
            if display_mode:
                command.append('--display-mode')

            process = subprocess.run(
                command,
                capture_output=True,
                text=True,
                encoding='utf-8',
                check=True,
                cwd=server_dir,
            )
            return process.stdout.strip()
        except FileNotFoundError:
            return f'<span style="color: red;">[Math Error: Node.js not found]</span>'
        except subprocess.CalledProcessError as e:
            err = (e.stderr or '').strip()
            return f'<span style="color: red;">[Math Error: {err or latex_str}]</span>'
        except Exception as e:
            return f'<span style="color: red;">[Math Error: {latex_str}]</span>'

    def _render_math(self, text):
        """Replace inline and block LaTeX delimited by $...$ or $$...$$ with KaTeX HTML."""
        if not text or '$' not in text:
            return text

        pattern = r'(?<!\\)\$\$(.*?)\$\$|(?<!\\)\$(.*?)\$'

        def replace_math(match):
            latex = match.group(1) if match.group(1) is not None else match.group(2)
            if not latex or not latex.strip():
                return match.group(0)
            is_block = match.group(1) is not None
            html = self._convert_latex_to_katex_html(latex, display_mode=is_block)
            if is_block:
                return f'<div class="katex-display">{html}</div>'
            return html

        result = re.sub(pattern, replace_math, text, flags=re.DOTALL)
        result = result.replace(r'\\$', '$')
        return result

    def generate_pdf(self, questions, title="Question Paper"):
        questions_html = ""
        for i, q in enumerate(questions, 1):
            question_text = self._render_math(q.get("question_text", ""))
            q_html = '<div class="question">'
            q_html += '<div class="question-header-line">'
            q_html += f'<span class="question-number">Q{i}.</span>'
            q_html += f'<span class="marks">[{q.get("marks", 1)} mark{"s" if q.get("marks", 1) != 1 else ""}]</span>'
            q_html += '</div>'
            q_html += f'<div class="question-text">{question_text}</div>'
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
            q_html += '</div>'
            questions_html += q_html

        total_marks = sum(q.get('marks', 1) for q in questions)
        html_content = self.template
        html_content = html_content.replace('{{title}}', title)
        html_content = html_content.replace('{{total_marks}}', str(total_marks))
        html_content = html_content.replace('{{total_questions}}', str(len(questions)))
        html_content = html_content.replace('{{date}}', datetime.now().strftime('%d %B %Y'))
        html_content = html_content.replace('{{questions_html}}', questions_html)

        base_url = self.base_path.as_uri()
        pdf_bytes = HTML(string=html_content, base_url=base_url).write_pdf(stylesheets=[CSS(string=self.styles)])
        return pdf_bytes
