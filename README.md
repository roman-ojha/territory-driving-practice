# Territory — NT driving practice

A buildless, responsive driving knowledge practice app. It runs on GitHub Pages with no backend, subscription, API key, or installation for visitors.

## Start locally

Run `npm start`, then open `http://127.0.0.1:4173`. Node.js is needed only for the development server and tests. Use HTTP rather than opening `index.html` directly because the app uses JavaScript modules.

## Publish free on GitHub Pages

1. Create an empty **public** GitHub repository. Free GitHub accounts support Pages on public repositories.
2. Push this existing repository, retaining its commit history:

   ```sh
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

3. Open the repository's **Settings → Pages**.
4. Set **Source** to **Deploy from a branch**, choose **main** and **/ (root)**, then save.
5. Open the URL GitHub displays after deployment. All app paths are relative, so repository subpaths work.

Keep `index.html`, both CSS files, `js/`, `data/questions.js`, and `assets/` together. `.nojekyll` disables unnecessary Jekyll processing. No build step is required.

Official instructions: [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) and [Configuring the publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Practice features

- **Initial session:** “My driving journey” starts with questions 1–80 completed. Questions 5, 16, 23, 38, 44, 54, and 67 start starred. These defaults apply only when there is no saved state.
- **Random practice:** draws from questions not completed in the active session. A correct answer or revealing the answer completes the question. Incorrect answers permit retry. Skipping leaves a question unfinished and eligible for later practice.
- **Previous questions:** Previous and Next move through questions visited during this page visit, retaining your choices and feedback. Each named session has its own temporary history. Reloading clears this history; saved completion is unaffected.
- **Sessions:** create, name, rename, switch, and reset independent sessions. Resetting affects only that session's completion. Selecting a completed number on the map opens a review without putting it back in the practice queue.
- **Question map:** all 357 numbered cells, green completion, gold starred indicators, and filters for completed, remaining, or starred questions.
- **Starred review:** a shuffled review queue independent of session completion. Stars belong only to the active session; new sessions start with no stars. Finishing review keeps that session's stars for future revision. Existing shared stars from older versions migrate to the original (first-created) session only, including when importing an older backup.
- **Mock tests:** 30 unique random questions from the full bank and a two-hour deadline. Answers can be changed before submission. The deadline and answers survive reloads. Expired tests submit on the next timer tick, focus, or page opening. All attempts retain the chosen answers and a review of the correct answers.
- **Share a session:** choose **My sessions → Share**, then scan the QR code or copy the link. On the receiving device, review the snapshot and choose **Import as a new session**. This appends a separate copy without replacing any existing sessions or tests. Links include the name, completed-question methods and stars, but not answer dates, test history or temporary navigation. Sharing is a one-time snapshot, not automatic sync. Anyone with the link can read it; the payload is in the URL fragment and is not sent in the hosting request. QR generation runs locally using the bundled MIT-licensed `qrcode-generator` library. Localhost sharing targets this repository’s GitHub Pages URL; publish the update before using it on another device. If you fork this project, change `PUBLIC_SITE` in `js/share.js`.
- **Backup:** export/import sessions, stars, completed tests, and a test in progress from My sessions.

## Data and privacy

Progress is stored in `localStorage` under `territory.practice.v1`. It persists on the same browser and origin. It is not sent to GitHub, synced across devices, or tied to an account. Local preview and the deployed site have separate storage; use a backup to transfer progress. Private browsing or clearing site data can remove progress. Storage failures are shown rather than silently overwriting unreadable saved data.

Open tabs receive updates from one another. Simultaneous edits still use last-write-wins browser storage; practise in one tab at a time to avoid overwriting changes.

## Source fidelity

The supplied **Class C Knowledge Test**, Motor Vehicle Registry, January 2021, contains 357 questions on 121 pages. Text is extracted without editorial corrections; PDF line wrapping is normalized to spaces. All three answer choices remain in source order. The filled bullet in the PDF identifies the answer key. The 189 illustrated questions use rendered regions from that PDF, preserving its original artwork, including multi-image diagrams.

This is a personal study resource based on that supplied edition. The custom 30-question / two-hour mock test is the requested practice format, not a claim about today's official test rules or pass threshold. Source content and artwork remain attributable to their original publisher.

See [source notes](docs/source-notes.md) for extraction and verification details.

## Development

`npm test` runs dependency-free Node tests for the bank, sessions, random selection, scoring, backup validation, storage failures, and views. Python with `pdfplumber` and its rendering dependency is needed only to regenerate the question bank:

```sh
python scripts/extract_pdf.py /path/to/class-c-knowledge-test.pdf
```

The UI is split by responsibility: `model.js` contains state operations, `storage.js` persistence, view modules generate escaped HTML, and `app.js` coordinates interactions. No remote fonts, scripts, or analytics are loaded. The QR generator is vendored locally in `js/vendor/` with its license; no dependency installation is needed.

## Commit dates

The initial 40 commits are deliberately assigned retrospective author and committer timestamps across September 30–October 26, 2026, at the project owner's request. They are logical source and asset commits created during this build; the dates do not represent when the work actually occurred. GitHub contribution display also depends on GitHub's account/email and branch rules.
