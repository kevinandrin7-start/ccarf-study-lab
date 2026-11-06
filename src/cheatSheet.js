// Cheat sheet content. To add more, append a section to CHEAT_SHEET.
// Section fields:
//   title     heading shown on the card
//   style     "rules" (numbered list), "warnings" (red cards), "notes" (plain list)
//             or "table" (items are { concept, rule, diagnostic?, task? }; `task` is a lesson id
//             like "1.4" and shows as a tappable chip)
//   lesson    optional lesson id to link to, e.g. "1.1"
//   items     list of { text, means? }. `text` is the line to memorise; `means` is an optional
//             one-line explanation. Text in `backticks` renders as code.

export const CHEAT_SHEET = [
  {
    id: "golden-rules",
    title: "The 5 Golden Rules",
    subtitle: "The Architect's Cheat Sheet: the agent loop",
    style: "rules",
    lesson: "1.1",
    items: [
      { text: "`end_turn` is the ONLY valid loop exit.", means: "Stop the loop only when stop_reason is end_turn." },
      { text: "`tool_use` means execute and continue.", means: "Run the requested tool, send the result back, and call Claude again." },
      { text: "Always append assistant first, then user.", means: "Add Claude's reply (with its tool_use blocks) to the history, then a user message with the tool_result blocks." },
      { text: "`tool_use_id` must perfectly match.", means: "Each tool_result must carry the exact id of the tool_use it answers." },
      { text: "The API is stateless; send the full history.", means: "Claude remembers nothing between calls, so every request includes the whole conversation." },
    ],
  },
  {
    id: "anti-patterns",
    title: "The 3 Anti-Patterns to Spot on Exams",
    subtitle: "If an answer option does one of these, it's probably wrong",
    style: "warnings",
    lesson: "1.1",
    items: [
      { text: "Parsing words → Causes crashes.", means: "Deciding the loop is done by reading Claude's text for words like 'done'." },
      { text: "Iteration cap → Cuts off early.", means: "Stopping after a fixed number of loops instead of on end_turn." },
      { text: "Text content check → Drops tools silently.", means: "Treating any reply that contains text as final, which skips tool calls in the same reply." },
    ],
  },
  {
    id: "domain1-architecture",
    title: "Domain 1 Architecture Cheat Sheet",
    subtitle: "Concept · the hard rule · exam diagnostic (why it matters)",
    style: "table",
    lesson: "1.2",
    items: [
      { concept: "Topology", rule: "All communication routes through the coordinator.", diagnostic: "Enables absolute observability." },
      { concept: "Task Tool", rule: "Coordinator needs it; Subagents don't.", diagnostic: "Prevents recursive delegation loops." },
      { concept: "Parallel Spawning", rule: "Multiple Task calls in ONE response.", diagnostic: "Fixes 3x latency issues." },
      { concept: "Context Isolation", rule: "Subagents inherit zero history.", diagnostic: "Always explicitly inject context." },
      { concept: "Siloed Outputs", rule: "Usually caused by overly narrow decomposition.", diagnostic: "Pipeline is missing a synthesis/aggregation step." },
    ],
  },
  {
    id: "quick-reference",
    title: "Quick Reference Card",
    subtitle: "Concept · key exam fact · task statement",
    style: "table",
    items: [
      { concept: "Prompt Instructions", rule: "Probabilistic. Non-zero failure.", task: "1.4" },
      { concept: "PostToolUse Hook", rule: "Normalization window. Runs before model sees result.", task: "1.5" },
      { concept: "PreToolUse Hook", rule: "Can block call entirely.", task: "1.5" },
      { concept: "Prerequisite Gate", rule: "Blocks Tool B until Tool A verified. Programmatic.", task: "1.4" },
      { concept: "Handoff Summary", rule: "Self-contained context without conversation transcript.", task: "1.4" },
      { concept: "Prompt Chaining", rule: "Fixed steps. Known upfront. Predictable tasks.", task: "1.6" },
      { concept: "Dynamic Decomposition", rule: "Steps from discoveries. Open-ended tasks.", task: "1.6" },
    ],
  },
  {
    id: "distractor-patterns",
    title: "Distractor Patterns to Reject",
    subtitle: "Answer options that sound right but aren't",
    style: "warnings",
    items: [
      { text: "Add stronger prompt instructions → Always wrong for guaranteed enforcement.", means: "Prompts are probabilistic. If something must always happen, use a hook or a prerequisite gate in code." },
      { text: "Add few-shot examples → Correct for consistency, NOT for compliance.", means: "Examples make output format steadier, but they can't force the model to follow a rule every time." },
      { text: "Pre-define all steps → Wrong for open-ended tasks with unknown scope.", means: "When you can't know the steps upfront, let the agent decompose dynamically from what it discovers." },
    ],
  },
];
