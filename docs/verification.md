# Verification record

Verified locally on October 26, 2026.

## Automated checks

`npm test`: 20 passing tests covering all 357 contiguous questions and their asset paths, the exact initial 80 completions and seven stars, random non-repeating traversal through both 277 remaining and all 357 reset questions, session isolation, reveal completion, 30 unique mock-test questions, two-hour deadlines, grading including unanswered questions, backup validation, corrupt-storage protection, escaping and view rendering.

`python scripts/audit_assets.py <source.pdf>`: all 189 non-footer PDF image objects assigned to extracted assets; no source image orphaned.

## Browser checks

- Desktop dashboard renders the seeded 80 / 357 progress and seven stars.
- A separate verification session starts at zero without changing the initial session.
- Incorrect choice displays retry feedback; revealing completes the question.
- Starring and unstarring an answered question preserves its visible feedback.
- Advancing selects a different unfinished question; reloading retains that question.
- A correct choice displays success and completes the question.
- Mock test starts at 02:00:00 with 30 answer-sheet positions.
- A selected test answer and decreasing timer survive reload.
- Submission warns about unanswered questions; one correct and 29 unanswered produces 1 / 30, and the result survives reload.
- Responsive dashboard checked at 390 × 844; navigation wraps so every section is available without horizontal scrolling.

The two-hour real-time wait was not performed. Deadline arithmetic is tested and expiration is checked on timer ticks, restored pages, visibility changes, and test interactions. No official-exam equivalence or pass threshold is asserted.
