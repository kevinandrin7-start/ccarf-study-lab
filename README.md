# CCAR-F Study Lab

An iOS-style study app for the **Claude Certified Architect – Foundations (CCAR-F)** exam.

**Live app:** https://kevinandrin7-start.github.io/ccarf-study-lab/

- **Learn:** 30 short lessons across the five domains of Anthropic's published exam guide, written in plain language. Each has a simple explanation, an everyday analogy, key points, a real example, a one-line "remember" and a quick check.
- **Practice:** exam-style scenario questions, with an explanation for every option and a link back to the lesson.
- **Exam:** timed mock exams (15 questions in 30 minutes, or all questions in 60 minutes) with a 72% pass mark, matching the real 720/1000.
- **Progress:** lessons done, accuracy by topic, exam history, and a light/dark setting.

| Domain | Weight |
|---|---|
| Agentic Architecture & Orchestration | 27% |
| Claude Code Configuration & Workflows | 20% |
| Prompt Engineering & Structured Output | 20% |
| Tool Design & MCP Integration | 18% |
| Context Management & Reliability | 15% |

The questions are original practice items, not official exam questions.

## Editing

- `src/lessons.js`: domains, lessons and exam facts
- `src/questions.js`: practice questions
- `src/App.jsx`: the interface

Rebuild with `npm install` and then `npm run build`. This writes `out/index.html`; copy it over `index.html`.
