"""Extract the user-supplied January 2021 question bank without rewriting it."""
import json
import re
import sys
from pathlib import Path
import pdfplumber

root = Path(__file__).resolve().parents[1]
out = root / 'assets' / 'questions'
out.mkdir(parents=True, exist_ok=True)
questions = []
audit = []
with pdfplumber.open(sys.argv[1]) as pdf:
    for page_number, page in enumerate(pdf.pages, 1):
        lines = page.extract_text_lines(return_chars=False)
        starts = [(i, re.match(r'^(\d+)\.\s*([A-Z]+\d+)\s*[-–]\s*(.*)', line['text'])) for i, line in enumerate(lines)]
        starts = [(i, m) for i, m in starts if m]
        for n, (i, match) in enumerate(starts):
            end = starts[n+1][0] if n+1 < len(starts) else len(lines)
            group = [l for l in lines[i:end] if l['top'] < 750]
            q = dict(id=int(match[1]), code=match[2], question=match[3], options=[], answer=None, page=page_number, images=[])
            option = None
            for line in group[1:]:
                text = line['text']
                m = re.match(r'^([o\uf0b7•])\s*\(([a-d])\)\s*(.*)', text)
                if m:
                    option = len(q['options'])
                    q['options'].append(m[3])
                    if m[1] != 'o':
                        assert q['answer'] is None, q
                        q['answer'] = option
                elif option is None:
                    q['question'] += ' ' + text
                else:
                    q['options'][option] += ' ' + text
            top = lines[i]['top']
            bottom = lines[end]['top'] if end < len(lines) else 750
            imgs = [im for im in page.images if im['top'] >= top and im['bottom'] <= min(bottom, 750)]
            # Render the diagram region directly from the PDF, including any vector annotations.
            if imgs:
                box = (max(0,min(im['x0'] for im in imgs)-2), min(im['top'] for im in imgs)-2, min(page.width,max(im['x1'] for im in imgs)+2), max(im['bottom'] for im in imgs)+2)
                filename = f'q{q["id"]:03}.png'
                page.crop(box).to_image(resolution=180).save(out / filename)
                q['images'].append(f'assets/questions/{filename}')
            assert len(q['options']) == 3 and q['answer'] in range(3), q
            questions.append(q)
        audit.append(dict(page=page_number, questions=len(starts), diagrams=sum(1 for im in page.images if im['bottom'] < 750)))
assert [q['id'] for q in questions] == list(range(1,358))
(root / 'data').mkdir(exist_ok=True)
(root / 'data/questions.js').write_text('export const questions = ' + json.dumps(questions, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
(root / 'data/extraction-audit.json').write_text(json.dumps(audit, indent=2), encoding='utf-8')
print(f'Extracted {len(questions)} questions; {sum(bool(q["images"]) for q in questions)} illustrated questions.')
