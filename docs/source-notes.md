# Question-bank provenance

- Input: user-provided `class-c-knowledge-test.pdf`.
- Publisher shown in the PDF: Northern Territory Government, Motor Vehicle Registry.
- Edition shown: January 2021.
- Pages: 121. Numbered questions: 1–357.
- Illustrated questions: 189. Image regions are rendered at 180 dpi; no diagrams are redrawn or generated.
- Extraction uses each numbered question header to define the region, preserves option order, and converts the filled source bullet into the answer index. PDF headers, footers, and answer-indicating bullets are not included in the learner's question text.
- Line breaks within a question/answer become spaces; punctuation, spelling, wording, identifiers and numbering otherwise remain as extracted from the PDF.
- `data/extraction-audit.json` records question and diagram counts per source page.

Regeneration asserts contiguous IDs and exactly three answers with one answer key per question. The asset audit checks that every non-footer raster image belongs to an extracted question region and that every illustrated question has a corresponding file. Visual spot checks cover source page 1 and multi-diagram/crossing/roundabout assets. The source remains the authority for edition-specific content.

The preset 80 completed questions were supplied by the user. They are recorded as `imported`, without inventing answer selections or dates. Seven user-specified confusion questions seed the global starred list.
