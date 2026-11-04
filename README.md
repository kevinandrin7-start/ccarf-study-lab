# CCAR-F Study Lab

A study guide and mock exam app for the **Claude Certified Architect – Foundations (CCAR-F)** exam.

- **Study guide**: one lesson for each of the six domains, with objectives, notes, reference tables and common traps
- **Practice**: quiz mode with instant feedback, plus a flashcard mode
- **Mock exam**: 30, 45 or 60 minutes, a 75% pass mark, randomised questions, flag-for-review and a breakdown by domain
- **Progress**: accuracy, weak areas and exam history, saved in your browser

The questions are original practice items written against the study domains. They are not official exam content. Model and API facts reflect the Claude API as of November 2026.

## Run it

`index.html` is self-contained. Open it in a browser or serve it from GitHub Pages. React and the fonts load from public CDNs.

## Edit it

The source is in `src/`. `questions.js` holds the question bank, `studyGuide.js` the lessons, and `App.jsx` the UI. To rebuild after editing:

```bash
npm install
npm run build
```

Then paste `dist/tw.css` into the second `<style>` block of `index.html` and `dist/app.js` into the final `<script>` block.
