"""
Build a graduation-submission-ready Word document from
`Graduation_Documentation_Improved.md`.

The script intentionally implements just enough Markdown handling to render the
document we wrote — it is not a general-purpose Markdown→DOCX converter. It
recognizes:

  * `# H1`, `## H2`, `### H3`, `#### H4` headings (with chapter pagination
    rules).
  * Bullet lists (`- item`) and ordered lists (`1. item`).
  * Bold (`**...**`) and italic (`*...*`) inline formatting.
  * Pipe-delimited GitHub-style tables — converted to native Word tables.
  * `---` horizontal rules — converted to a thin blank-line separator.
  * Plain paragraphs.

Top-level chapter headings (`# CHAPTER ...`) start on a new page so the
document paginates cleanly the way an academic submission expects.
"""
from __future__ import annotations

import os
import re
import sys
from dataclasses import dataclass

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from docx.shared import Cm, Pt, RGBColor

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(ROOT, 'Graduation_Documentation_Improved.md')
OUT = os.path.join(ROOT, 'Graduation_Documentation_Improved.docx')


# ---------------------------------------------------------------------------
# Style helpers
# ---------------------------------------------------------------------------

def _set_font(run, *, name='Calibri', size=11, bold=False, italic=False, color=None):
    run.font.name = name
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color is not None:
        run.font.color.rgb = RGBColor(*color)


def _style_doc(doc: Document) -> None:
    """Tweak default styles so the body, headings, and lists look polished."""
    normal = doc.styles['Normal']
    normal.font.name = 'Calibri'
    normal.font.size = Pt(11)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.3

    # Headings — graded sizes + a brand teal accent for chapter titles.
    h1 = doc.styles['Heading 1']
    h1.font.name = 'Calibri'
    h1.font.size = Pt(22)
    h1.font.bold = True
    h1.font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)  # teal-700
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(12)

    h2 = doc.styles['Heading 2']
    h2.font.name = 'Calibri'
    h2.font.size = Pt(16)
    h2.font.bold = True
    h2.font.color.rgb = RGBColor(0x11, 0x82, 0x7A)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(8)

    h3 = doc.styles['Heading 3']
    h3.font.name = 'Calibri'
    h3.font.size = Pt(13)
    h3.font.bold = True
    h3.font.color.rgb = RGBColor(0x1E, 0x40, 0x4F)  # slate-700
    h3.paragraph_format.space_before = Pt(10)
    h3.paragraph_format.space_after = Pt(6)

    h4 = doc.styles['Heading 4']
    h4.font.name = 'Calibri'
    h4.font.size = Pt(12)
    h4.font.bold = True
    h4.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    h4.paragraph_format.space_before = Pt(8)
    h4.paragraph_format.space_after = Pt(4)


def _apply_inline(par, text: str) -> None:
    """
    Render a single paragraph with inline `**bold**` and `*italic*` runs.

    The pattern alternates literal text with formatted spans. We split with a
    capturing group so the delimiters survive the split, then walk the result
    in pairs.
    """
    pattern = re.compile(r'(\*\*[^*]+\*\*|\*[^*\n]+\*)')
    parts = pattern.split(text)
    for part in parts:
        if not part:
            continue
        if part.startswith('**') and part.endswith('**'):
            run = par.add_run(part[2:-2])
            run.bold = True
        elif part.startswith('*') and part.endswith('*'):
            run = par.add_run(part[1:-1])
            run.italic = True
        else:
            par.add_run(part)


def _add_page_break(doc: Document) -> None:
    par = doc.add_paragraph()
    par.add_run().add_break(WD_BREAK.PAGE)


def _set_cell_shading(cell, hex_color: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tc_pr.append(shd)


# ---------------------------------------------------------------------------
# Markdown -> DOCX
# ---------------------------------------------------------------------------

@dataclass
class TableBuffer:
    header: list[str]
    rows: list[list[str]]


HR_RE = re.compile(r'^\s*---+\s*$')
TABLE_ROW_RE = re.compile(r'^\s*\|.*\|\s*$')
TABLE_DIVIDER_RE = re.compile(r'^\s*\|?\s*[:\-\s|]+\s*\|?\s*$')


def _split_table_row(line: str) -> list[str]:
    line = line.strip()
    if line.startswith('|'):
        line = line[1:]
    if line.endswith('|'):
        line = line[:-1]
    return [c.strip() for c in line.split('|')]


def _flush_table(doc: Document, tb: TableBuffer | None) -> None:
    if not tb or not tb.rows:
        return
    # Replace literal HTML <br/> tokens with newlines so multi-line cells render.
    def cleanup(cell: str) -> str:
        return cell.replace('<br/>', '\n').replace('<br>', '\n')

    cols = len(tb.header)
    table = doc.add_table(rows=len(tb.rows) + 1, cols=cols)
    table.style = 'Light Grid Accent 1'

    # Header
    header_cells = table.rows[0].cells
    for i, h in enumerate(tb.header[:cols]):
        cell = header_cells[i]
        cell.text = ''
        par = cell.paragraphs[0]
        run = par.add_run(cleanup(h))
        run.bold = True
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        _set_cell_shading(cell, '0F766E')

    # Body
    for r, row in enumerate(tb.rows, start=1):
        cells = table.rows[r].cells
        for c in range(cols):
            text = cleanup(row[c]) if c < len(row) else ''
            cells[c].text = ''
            for j, line in enumerate(text.split('\n')):
                if j == 0:
                    par = cells[c].paragraphs[0]
                else:
                    par = cells[c].add_paragraph()
                _apply_inline(par, line)

    # spacer paragraph after the table so following content has breathing room
    doc.add_paragraph()


def _flush_list(doc: Document, items: list[tuple[str, str]]) -> None:
    """items is a list of (style, text) tuples — style is 'List Bullet' or 'List Number'."""
    for style, text in items:
        par = doc.add_paragraph(style=style)
        _apply_inline(par, text)


def render(md_text: str, doc: Document) -> None:
    lines = md_text.split('\n')
    table_buf: TableBuffer | None = None
    list_buf: list[tuple[str, str]] = []
    in_h1 = False  # set after first chapter heading so we know to page-break

    def flush_lists():
        nonlocal list_buf
        if list_buf:
            _flush_list(doc, list_buf)
            list_buf = []

    def flush_table():
        nonlocal table_buf
        _flush_table(doc, table_buf)
        table_buf = None

    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        rstrip = line.rstrip()

        # Table detection — header line followed by divider.
        if TABLE_ROW_RE.match(rstrip) and i + 1 < n and TABLE_DIVIDER_RE.match(lines[i + 1]):
            flush_lists()
            header = _split_table_row(rstrip)
            rows: list[list[str]] = []
            i += 2
            while i < n and TABLE_ROW_RE.match(lines[i]):
                rows.append(_split_table_row(lines[i]))
                i += 1
            table_buf = TableBuffer(header=header, rows=rows)
            flush_table()
            continue

        # Outside a table — flush any pending one.
        if table_buf is not None:
            flush_table()

        if not rstrip.strip():
            flush_lists()
            i += 1
            continue

        # Horizontal rule → spacer
        if HR_RE.match(rstrip):
            flush_lists()
            doc.add_paragraph()
            i += 1
            continue

        # Headings
        if rstrip.startswith('#### '):
            flush_lists()
            par = doc.add_paragraph(style='Heading 4')
            _apply_inline(par, rstrip[5:].strip())
            i += 1
            continue
        if rstrip.startswith('### '):
            flush_lists()
            par = doc.add_paragraph(style='Heading 3')
            _apply_inline(par, rstrip[4:].strip())
            i += 1
            continue
        if rstrip.startswith('## '):
            flush_lists()
            par = doc.add_paragraph(style='Heading 2')
            _apply_inline(par, rstrip[3:].strip())
            i += 1
            continue
        if rstrip.startswith('# '):
            flush_lists()
            # Page break before each chapter except the very first heading
            # (which is the document title).
            if in_h1:
                _add_page_break(doc)
            in_h1 = True
            par = doc.add_paragraph(style='Heading 1')
            _apply_inline(par, rstrip[2:].strip())
            i += 1
            continue

        # Bullet list
        if rstrip.lstrip().startswith('- '):
            list_buf.append(('List Bullet', rstrip.lstrip()[2:].strip()))
            i += 1
            continue

        # Ordered list (`1. ...`, `2. ...` etc.)
        m = re.match(r'^\s*\d+\.\s+(.*)$', rstrip)
        if m:
            list_buf.append(('List Number', m.group(1)))
            i += 1
            continue

        # Plain paragraph (collect contiguous non-blank lines)
        flush_lists()
        para_lines = [rstrip]
        i += 1
        while i < n and lines[i].strip() and not lines[i].lstrip().startswith(('#', '-', '|')) \
                and not re.match(r'^\s*\d+\.\s', lines[i]) and not HR_RE.match(lines[i]):
            para_lines.append(lines[i].rstrip())
            i += 1
        par = doc.add_paragraph()
        _apply_inline(par, ' '.join(para_lines))

    flush_lists()
    if table_buf is not None:
        flush_table()


# ---------------------------------------------------------------------------
# Cover + footer
# ---------------------------------------------------------------------------

def add_cover(doc: Document) -> None:
    # Project title centered, vertically positioned a few blank lines down.
    for _ in range(6):
        doc.add_paragraph()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('Online Pharmacy Platform')
    _set_font(run, size=32, bold=True, color=(0x0F, 0x76, 0x6E))

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('with Integrated AI Assistant')
    _set_font(run, size=22, bold=True, color=(0x0F, 0x76, 0x6E))

    doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('Graduation Project Documentation')
    _set_font(run, size=16, italic=True, color=(0x33, 0x41, 0x55))

    for _ in range(8):
        doc.add_paragraph()

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('Supervised by')
    _set_font(run, size=12, color=(0x33, 0x41, 0x55))

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('Dr. Safaa Magdy')
    _set_font(run, size=14, bold=True, color=(0x0F, 0x76, 0x6E))

    _add_page_break(doc)


def add_page_numbers(doc: Document) -> None:
    """Add a centered "Page X" field to the footer of the default section."""
    section = doc.sections[0]
    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    run = p.add_run('Page ')
    fld_begin = OxmlElement('w:fldChar')
    fld_begin.set(qn('w:fldCharType'), 'begin')

    instr = OxmlElement('w:instrText')
    instr.set(qn('xml:space'), 'preserve')
    instr.text = 'PAGE'

    fld_sep = OxmlElement('w:fldChar')
    fld_sep.set(qn('w:fldCharType'), 'separate')

    fld_end = OxmlElement('w:fldChar')
    fld_end.set(qn('w:fldCharType'), 'end')

    run._r.append(fld_begin)
    run._r.append(instr)
    run._r.append(fld_sep)
    run._r.append(fld_end)


def main() -> int:
    if not os.path.exists(SRC):
        print(f'ERROR: missing source markdown {SRC!r}', file=sys.stderr)
        return 1

    with open(SRC, 'r', encoding='utf-8') as fh:
        md = fh.read()

    doc = Document()
    section = doc.sections[0]
    section.top_margin = Cm(2.2)
    section.bottom_margin = Cm(2.2)
    section.left_margin = Cm(2.4)
    section.right_margin = Cm(2.4)

    _style_doc(doc)
    add_cover(doc)
    render(md, doc)
    add_page_numbers(doc)

    doc.save(OUT)
    size_kb = os.path.getsize(OUT) / 1024
    print(f'Wrote {OUT} ({size_kb:.1f} KB)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
