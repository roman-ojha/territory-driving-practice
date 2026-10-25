"""Verify all source illustrations are represented by an extracted question asset."""
import json
import re
import sys
from pathlib import Path
import pdfplumber

root = Path(__file__).resolve().parents[1]
raw = (root/'data/questions.js').read_text(encoding='utf-8')
questions = json.loads(raw.removeprefix('export const questions = ').rstrip(';\n'))
assigned = 0
with pdfplumber.open(sys.argv[1]) as pdf:
    for number, page in enumerate(pdf.pages, 1):
        lines = page.extract_text_lines(return_chars=False)
        heads = [(int(m[1]), line['top']) for line in lines if (m := re.match(r'^(\d+)\.\s*[A-Z]+\d+\s*[-–]', line['text']))]
        for image in page.images:
            if image['bottom'] >= 750:
                continue
            owners = [qid for index,(qid,top) in enumerate(heads) if image['top']>=top and image['bottom']<=(heads[index+1][1] if index+1<len(heads) else 750)]
            assert len(owners)==1, (number,image['name'],owners)
            q = questions[owners[0]-1]
            assert q['page']==number and q['images'], q['id']
            assert all((root/p).exists() for p in q['images'])
            assigned += 1
print(f'PASS: all {assigned} non-footer PDF image objects assigned to extracted assets.')
