"""PDF generation using ReportLab for simplicity and reliability."""
import io
import re
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT


class PDFService:
    """Generate PDFs using ReportLab instead of WeasyPrint."""

    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Define custom paragraph styles."""
        # 1. Add QuestionText Style
        self.styles.add(ParagraphStyle(
            name='QuestionText',
            parent=self.styles['Normal'],
            fontSize=11,
            leading=14,
            alignment=TA_JUSTIFY,
            spaceAfter=6,
        ))
        
        # 2. Add OptionText Style
        self.styles.add(ParagraphStyle(
            name='OptionText',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=12,
            alignment=TA_LEFT,
            spaceAfter=4,
            leftIndent=20,
        ))
        
        # 3. FIXED: Update existing 'Title' style instead of adding it again
        title_style = self.styles['Title']
        title_style.fontSize = 18
        title_style.textColor = colors.HexColor('#000000')
        title_style.alignment = TA_CENTER
        title_style.spaceAfter = 12

    def _sanitize_text(self, text):
        """Remove or escape special characters for ReportLab."""
        if not text:
            return ""
        # Strip HTML-like tags if any from KaTeX rendering
        text = re.sub(r'<[^>]+>', '', text)
        # Escape special XML chars for ReportLab
        text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        return text

    def generate_pdf(self, questions, title="Question Paper"):
        """Generate PDF from questions list using ReportLab."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5*cm,
            leftMargin=1.5*cm,
            topMargin=2*cm,
            bottomMargin=2*cm,
            title=title,
        )
        
        story = []
        
        # Title
        story.append(Paragraph(self._sanitize_text(title), self.styles['Title']))
        
        # Metadata
        total_marks = sum(q.get('marks', 1) for q in questions)
        meta_text = (
            f"<b>Total Marks:</b> {total_marks} | "
            f"<b>Questions:</b> {len(questions)} | "
            f"<b>Date:</b> {datetime.now().strftime('%d %B %Y')}"
        )
        story.append(Paragraph(meta_text, self.styles['Normal']))
        story.append(Spacer(1, 0.5*cm))
        
        # Questions
        for i, q in enumerate(questions, 1):
            question_text = self._sanitize_text(q.get("question_text", ""))
            marks = q.get("marks", 1)
            mark_label = "mark" if marks == 1 else "marks"
            
            # Question header: Q1. [1 mark]
            header_text = f"<b>Q{i}.</b> <i>[{marks} {mark_label}]</i>"
            story.append(Paragraph(header_text, self.styles['Normal']))
            
            # Question text
            if question_text:
                story.append(Paragraph(question_text, self.styles['QuestionText']))
            
            # MCQ options
            if q.get("question_type") == "MCQ":
                options = [
                    ('a', q.get("option_a")),
                    ('b', q.get("option_b")),
                    ('c', q.get("option_c")),
                    ('d', q.get("option_d"))
                ]
                for opt_letter, opt_value in options:
                    if opt_value:
                        opt_text = self._sanitize_text(opt_value)
                        story.append(Paragraph(
                            f"({opt_letter.upper()}) {opt_text}",
                            self.styles['OptionText']
                        ))
            
            # Space between questions
            story.append(Spacer(1, 0.3*cm))
        
        # Build PDF
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
