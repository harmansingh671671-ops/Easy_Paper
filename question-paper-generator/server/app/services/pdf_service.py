"""PDF generation using ReportLab for simplicity and reliability."""

import io
import re
import math
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm, inch
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Image, Table, TableStyle, KeepTogether
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT

# Matplotlib for Latex Rendering
import matplotlib
matplotlib.use('Agg') # Non-interactive backend
import matplotlib.pyplot as plt


class PDFService:
    """Generate PDFs using ReportLab instead of WeasyPrint."""

    def __init__(self):
        self.style_sheet = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Define custom paragraph styles."""
        self.style_sheet.add(ParagraphStyle(
            name='QuestionText',
            parent=self.style_sheet['Normal'],
            fontSize=11,
            leading=15,
            alignment=TA_JUSTIFY,
            spaceAfter=0, # Handling spacing via table
        ))
        
        self.style_sheet.add(ParagraphStyle(
            name='OptionText',
            parent=self.style_sheet['Normal'],
            fontSize=10,
            leading=13,
            alignment=TA_LEFT,
        ))
        
        self.style_sheet.add(ParagraphStyle(
            name='InstructionText',
            parent=self.style_sheet['Normal'],
            fontSize=10,
            leading=12,
            alignment=TA_LEFT,
        ))

    def _sanitize_text(self, text):
        """Remove or escape special characters for ReportLab."""
        if not text:
            return ""
        text = re.sub(r'<[^>]+>', '', text)
        text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        return text

    def _render_latex_to_image(self, latex_str, fontsize=16):
        """Render a LaTeX string to a PNG image in memory and return buffer + dimensions."""
        try:
            fig = plt.figure(figsize=(3, 1))
            fig.text(0.5, 0.5, f"${latex_str}$", fontsize=fontsize, ha='center', va='center')
            buffer = io.BytesIO()
            fig.savefig(buffer, dpi=300, format='png', bbox_inches='tight', pad_inches=0.05, transparent=True)
            plt.close(fig)
            buffer.seek(0)
            
            from reportlab.lib.utils import ImageReader
            img = ImageReader(buffer)
            width, height = img.getSize()
            buffer.seek(0)
            return buffer, width, height
        except Exception as e:
            print(f"Error rendering latex '{latex_str}': {e}")
            plt.close('all')
            return None, 0, 0

    def _process_text_with_math(self, text):
        """Detects LaTeX math patterns and replaces them with inline images."""
        if not text:
            return ""
        
        parts = re.split(r'(\$[^$]+\$)', text)
        processed_parts = []
        
        for part in parts:
            if part.startswith('$') and part.endswith('$') and len(part) > 2:
                latex_content = part[1:-1]
                img_buffer, px_width, px_height = self._render_latex_to_image(latex_content, fontsize=18)
                
                if img_buffer and px_height > 0:
                    import tempfile
                    import os
                    import hashlib
                    
                    hash_name = hashlib.md5(latex_content.encode('utf-8')).hexdigest()
                    temp_dir = tempfile.gettempdir()
                    img_path = os.path.join(temp_dir, f"eq_{hash_name}_v2.png")
                    
                    if not os.path.exists(img_path):
                        with open(img_path, "wb") as f:
                            f.write(img_buffer.getvalue())
                    
                    conversion_factor = 72 / 300.0
                    scale = 0.55
                    final_height = px_height * conversion_factor * scale
                    final_width = px_width * conversion_factor * scale
                    valign = -(final_height / 3.0) 
                    
                    processed_parts.append(f'<img src="{img_path}" width="{final_width}" height="{final_height}" valign="{valign}"/>')
                else:
                    processed_parts.append(self._sanitize_text(part))
            else:
                processed_parts.append(self._sanitize_text(part))
        return "".join(processed_parts)

    def generate_pdf(self, questions, title="Question Paper", duration=None, instructions=None, total_marks_override=None):
        """Generate PDF using BaseDocTemplate for advanced layout."""
        buffer = io.BytesIO()
        
        # Constants
        LEFT_MARGIN = 1.0 * cm 
        RIGHT_MARGIN = 1.0 * cm
        TOP_MARGIN = 1.0 * cm
        BOTTOM_MARGIN = 1.0 * cm
        BORDER_PADDING = 5 # points
        
        page_width, page_height = A4
        
        # 1. Determine Layout Mode
        is_all_mcq = len(questions) > 0 and all(q.get('question_type') == 'MCQ' for q in questions)
        
        # 2. Setup Doc Template
        doc = BaseDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=LEFT_MARGIN,
            rightMargin=RIGHT_MARGIN,
            topMargin=TOP_MARGIN,
            bottomMargin=BOTTOM_MARGIN
        )

        # 3. Canvas Drawing Callback
        def on_page(canvas, doc, is_first_page=False):
            canvas.saveState()
            
            # --- A. Borders ---
            bx = 1.0 * cm
            by = 1.0 * cm
            bw = page_width - 2*bx
            bh = page_height - 2*by
            
            # Thicker lines
            canvas.setLineWidth(2) 
            canvas.setStrokeColor(colors.black)
            canvas.rect(bx, by, bw, bh)
            
            # --- B. Header (First Page Only) ---
            # Used for calculating frame start
            header_bottom_y = page_height - TOP_MARGIN - 2.5*cm 
            
            if is_first_page:
                text_top = page_height - TOP_MARGIN - 0.5*cm
                
                # Title: Centered, Larger (20pt)
                canvas.setFont("Helvetica-Bold", 20)
                title_y = text_top - 20
                canvas.drawCentredString(page_width / 2.0, title_y, title)
                
                # Marks and Time: Smaller (10pt), Right Aligned
                # "Bottom below component at the same height as the bottom of the title"
                # Title Baseline = title_y
                canvas.setFont("Helvetica", 10)
                
                calculated_marks = sum(q.get('marks', 1) for q in questions)
                final_marks = total_marks_override if total_marks_override is not None else calculated_marks
                
                marks_str = f"Max Marks: {final_marks}"
                time_str = f"Time: {duration} min" if duration else ""
                
                right_x = page_width - RIGHT_MARGIN - 15
                
                # Align bottom line (Time) with Title Baseline
                if time_str:
                    canvas.drawRightString(right_x, title_y, time_str)
                    # Marks above Time
                    canvas.drawRightString(right_x, title_y + 12, marks_str)
                else:
                    canvas.drawRightString(right_x, title_y, marks_str)

                # --- C. Horizontal Line (L1) ---
                # "5 px below the bottom of the title"
                # "horizontal line with 5 px distance with left and right side border" -> Gap
                
                # 1 px approx 0.35 mm. 5px is small constant.
                PAD_5PX = 5 
                
                l1_y = title_y - 8 - PAD_5PX # Baseline descent (~8) + 5px gap
                
                # Line from (bx + 5px) to (bx + bw - 5px)
                canvas.line(bx + PAD_5PX, l1_y, bx + bw - PAD_5PX, l1_y)
                
                header_bottom_y = l1_y 
            
            # --- D. Vertical Line (L2) for 2-Column Mode ---
            if is_all_mcq:
                PAD_5PX = 5
                mid_x = page_width / 2.0
                
                # Top Y for L2
                if is_first_page:
                    # "ends at 5px below L1" (implied L1 Y)
                    l2_top = header_bottom_y - PAD_5PX
                else:
                    # "top border on other pages" -> starts FROM top border?
                    # Usually implies inside border.
                    l2_top = page_height - by - PAD_5PX # 5px padding from top border purely for aesthetics? 
                    # Or attached? "top border on other pages". Let's attach or small gap?
                    # Consistent with "5px above bottom", let's do 5px below top.
                    l2_top = page_height - by
                
                # Bottom Y for L2
                # "5px above the bottom border"
                l2_bottom = by + PAD_5PX
                
                canvas.line(mid_x, l2_bottom, mid_x, l2_top)
            
            canvas.restoreState()

        # Wrapper functions for Template
        def on_first_page(canvas, doc):
            on_page(canvas, doc, is_first_page=True)
            
        def on_later_pages(canvas, doc):
            on_page(canvas, doc, is_first_page=False)

        # 4. Define Templates
        # Calculate available height for frames
        # First page has header content.
        # We assume header takes about 3cm space from top margin? 
        # Actually `header_bottom_y` gives us the line Y. 
        # But frames need fixed rects. We need to estimate or use a flowable Spacer?
        # A Spacer is safer to push content down on Page 1.
        
        # Frame Margins (Inside the border)
        frame_padding = 10 
        frame_x = LEFT_MARGIN + frame_padding
        frame_y = BOTTOM_MARGIN + frame_padding
        frame_w = page_width - LEFT_MARGIN - RIGHT_MARGIN - 2*frame_padding
        frame_h = page_height - TOP_MARGIN - BOTTOM_MARGIN - 2*frame_padding
        
        frames = []
        if is_all_mcq:
            # 2 Columns
            col_gap = 20
            col_w = (frame_w - col_gap) / 2.0
            
            # Left Frame
            f1 = Frame(frame_x, frame_y, col_w, frame_h, id='col1', showBoundary=0)
            # Right Frame
            f2 = Frame(frame_x + col_w + col_gap, frame_y, col_w, frame_h, id='col2', showBoundary=0)
            frames = [f1, f2]
        else:
            # 1 Column
            f1 = Frame(frame_x, frame_y, frame_w, frame_h, id='col1', showBoundary=0)
            frames = [f1]

        doc.addPageTemplates([
            PageTemplate(id='FirstPage', frames=frames, onPage=on_first_page),
            PageTemplate(id='LaterPages', frames=frames, onPage=on_later_pages),
        ])

        # 5. Build Story
        story = []
        
        # Push content down on First Page to avoid overlapping the Canvas Header
        # Header is roughly at TOP_MARGIN + 3cm? 
        # L1 is drawn at `title_baseline - 8`. Title is near top margin.
        # Let's say header takes 2.5cm.
        story.append(Spacer(1, 2.5 * cm))
        
        # Instructions
        if instructions:
            story.append(Paragraph("<b>Instructions:</b>", self.style_sheet['Normal']))
            for line in instructions.split('\n'):
                if line.strip():
                    p_text = self._process_text_with_math(line.strip())
                    story.append(Paragraph("• " + p_text, self.style_sheet['InstructionText']))
            story.append(Spacer(1, 0.5 * cm))

        # Loop Questions
        for i, q in enumerate(questions, 1):
            q_text_processed = self._process_text_with_math(q.get("question_text", ""))
            marks = q.get("marks", 1)
            marks_str = f"({marks})" # "simply as (5)"
            
            # Question Header Table: [ "Q1. <Text>", "(Marks)" ]
            # We want Q number in the same line.
            # So the left cell should be "Q1. <Text>".
            
            full_q_text = f"<b>Q{i}.</b> {q_text_processed}"
            
            # Frame width estimation to set column widths
            # If 2 col, width is ~9cm. 
            # We want Marks column to be small, fixed width? 
            # Or percentage?
            
            # Table logic
            # Left col: 90%, Right col: 10%
            
            q_para = Paragraph(full_q_text, self.style_sheet['QuestionText'])
            m_para = Paragraph(f"<b>{marks_str}</b>", ParagraphStyle('Marks', parent=self.style_sheet['Normal'], alignment=TA_RIGHT))
            
            # We need absolute col widths for Table
            if is_all_mcq:
                # Half page width approx
                avail_width = (page_width - LEFT_MARGIN - RIGHT_MARGIN - 20) / 2.0 - 10
            else:
                avail_width = page_width - LEFT_MARGIN - RIGHT_MARGIN - 20
                
            col_widths = [avail_width * 0.9, avail_width * 0.1]
            
            q_table = Table(
                [[q_para, m_para]], 
                colWidths=col_widths,
                style=TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                    ('RIGHTPADDING', (0,0), (-1,-1), 0),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 0),
                    ('TOPPADDING', (0,0), (-1,-1), 0),
                ])
            )
            
            # Group Question + Options to avoid splitting
            content_block = [q_table]
            
            # Options
            if q.get('question_type') == 'MCQ':
                opts = [
                    ('a', q.get("option_a")),
                    ('b', q.get("option_b")),
                    ('c', q.get("option_c")),
                    ('d', q.get("option_d"))
                ]
                # Filter empty
                opts = [o for o in opts if o[1]]
                
                # Render Options
                opt_flowables = []
                for label, text in opts:
                    p_text = self._process_text_with_math(text)
                    opt_flowables.append(Paragraph(f"<b>({label})</b> {p_text}", self.style_sheet['OptionText']))
                
                # Layout Strategy
                if is_all_mcq:
                    # Case 1: Square pattern (2x2)
                    # [[A, B], [C, D]]
                    if len(opt_flowables) == 4:
                        rows = [
                            [opt_flowables[0], opt_flowables[1]],
                            [opt_flowables[2], opt_flowables[3]]
                        ]
                    else:
                        # Fallback for odd numbers
                        rows = [[x] for x in opt_flowables]
                    
                    opt_table = Table(
                        rows,
                        colWidths=[avail_width*0.45, avail_width*0.45],
                        style=TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')])
                    )
                    content_block.append(opt_table)
                else:
                    # Case 2: Horizontal line if possible, else square
                    # Try horizontal logic? 
                    # ReportLab doesn't auto-wrap horizontal tables well.
                    # We can use a 1-row table.
                    # blind attempt: 1 row, 4 cols.
                    if len(opt_flowables) == 4:
                         # Try horizontal
                        opt_table = Table(
                            [[opt_flowables[0], opt_flowables[1], opt_flowables[2], opt_flowables[3]]],
                            colWidths=[avail_width*0.25]*4,
                             style=TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')])
                        )
                        content_block.append(opt_table)
                    else:
                        # Fallback list
                        for o in opt_flowables:
                            content_block.append(o)
                            
            content_block.append(Spacer(1, 0.4*cm))
            
            story.append(KeepTogether(content_block))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        plt.close('all')
        return pdf_bytes
