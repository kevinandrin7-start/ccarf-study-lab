// Practice questions in the style of the CCAR-F exam: a scenario, four options, one best answer.
// Original practice items, not official exam questions. `lesson` links each to its lesson.

export const QUESTIONS = [
  /* ---------- Agentic Architecture & Orchestration ---------- */
  {
    id: "q1", domain: "agentic", lesson: "1.1", scenario: "Customer support agent",
    q: "Your support agent sometimes stops halfway through a task, and sometimes keeps calling tools after it has already answered. The loop currently stops when Claude's text contains the word 'done'. What should you change?",
    options: [
      "Stop when stop_reason is end_turn, and keep looping while it is tool_use",
      "Search for more words, such as 'finished' and 'complete'",
      "Always stop after exactly 5 loops",
      "Ask Claude to end every message with 'DONE'",
    ],
    answer: 0,
    why: [
      "Right. stop_reason is the reliable signal: tool_use means run the tool and continue, end_turn means finished.",
      "More keywords is still guessing from text, which is unreliable.",
      "A fixed count cuts long tasks short and wastes calls on short ones. Caps are only a safety net.",
      "This still relies on text, and the model may not always follow it.",
    ],
  },
  {
    id: "q2", domain: "agentic", lesson: "1.2", scenario: "Multi-agent research system",
    q: "A research coordinator is asked about 'AI's effect on creative industries'. Every report covers only visual art and misses music, writing and film. Each helper agent does its own slice well. What is the most likely cause?",
    options: [
      "The search helper's tool is broken",
      "The coordinator split the topic too narrowly, so whole areas were never assigned",
      "The writing helper's summary is too short",
      "The model is too small for research",
    ],
    answer: 1,
    why: [
      "The helpers' work is fine for what they were given, so a broken tool doesn't explain the missing topics.",
      "Right. If the coordinator's breakdown leaves areas out, no helper ever looks at them.",
      "A short summary can't explain topics that were never researched at all.",
      "The pattern points to how the work was divided, not model size.",
    ],
  },
  {
    id: "q3", domain: "agentic", lesson: "1.3", scenario: "Multi-agent research system",
    q: "Your synthesis helper writes reports that ignore findings from the search helper, even though the coordinator saw those findings. What is the fix?",
    options: [
      "Give the synthesis helper web search so it can find them again",
      "Tell the synthesis helper to 'remember earlier results'",
      "Have the coordinator include the search findings, with sources, directly in the synthesis helper's prompt",
      "Run the synthesis helper first",
    ],
    answer: 2,
    why: [
      "This repeats work and gives the helper a tool outside its role.",
      "Helpers don't inherit the coordinator's conversation. There is nothing for it to remember.",
      "Right. Helpers only know what's in their instructions, so pass the context explicitly.",
      "Order doesn't help if the findings are never passed along.",
    ],
  },
  {
    id: "q4", domain: "agentic", lesson: "1.4", scenario: "Customer support agent",
    q: "Logs show your agent processed refunds without verifying the customer's identity in 8% of cases, despite a clear instruction in the system prompt. What is the most reliable fix?",
    options: [
      "Put the instruction in capital letters and repeat it three times",
      "Add a code check that blocks process_refund until get_customer has returned a verified ID",
      "Add more examples of verification to the prompt",
      "Lower the refund limit",
    ],
    answer: 1,
    why: [
      "Stronger wording may help a bit, but prompts are never 100% reliable.",
      "Right. A programmatic gate enforces the order every single time.",
      "Examples improve the odds but still don't guarantee compliance.",
      "This changes the risk size, not whether verification happens.",
    ],
  },
  {
    id: "q5", domain: "agentic", lesson: "1.5", scenario: "Customer support agent",
    q: "Your backend tools return dates in three different formats, and Claude sometimes compares them wrongly. Where is the best place to fix this?",
    options: [
      "A PostToolUse hook that converts every date to one format before Claude sees it",
      "A system prompt line explaining all three formats",
      "A PreToolUse hook that blocks tools returning odd dates",
      "Ask customers to type dates the same way",
    ],
    answer: 0,
    why: [
      "Right. Post-tool hooks clean up results reliably, every time.",
      "This relies on Claude interpreting correctly every time, which is what's failing.",
      "Pre-tool hooks run before the call, so they can't see the returned data, and blocking tools breaks the agent.",
      "The dates come from your backend, not from customers.",
    ],
  },
  {
    id: "q6", domain: "agentic", lesson: "1.6", scenario: "Claude Code in CI/CD",
    q: "Automated reviews of a 14-file pull request are shallow and inconsistent: detailed on some files, nearly empty on others. What is the best restructure?",
    options: [
      "Send all 14 files in one bigger prompt with 'be thorough'",
      "Only review the files with the most changes",
      "Review each file in its own pass, then run one integration pass across files",
      "Switch to the Batches API",
    ],
    answer: 2,
    why: [
      "One huge pass is what's causing the uneven attention.",
      "Skipping files means missing bugs in them.",
      "Right. Focused per-file passes plus a cross-file pass give deep, consistent coverage.",
      "Batches change cost and speed, not review quality, and are too slow for pull request checks.",
    ],
  },

  /* ---------- Tool Design & MCP Integration ---------- */
  {
    id: "q7", domain: "tools", lesson: "2.1", scenario: "Customer support agent",
    q: "Your agent often calls get_customer when it should call lookup_order. Both descriptions say 'Retrieves information'. What should you do first?",
    options: [
      "Merge the two tools into one",
      "Rewrite both descriptions to say what each accepts, returns, and when to use it",
      "Add a routing classifier in front of the agent",
      "Remove lookup_order",
    ],
    answer: 1,
    why: [
      "Merging may be useful later, but it's a bigger change than needed.",
      "Right. Descriptions are the main thing Claude uses to choose. Fix them first: low effort, high impact.",
      "This adds complexity without fixing the real cause.",
      "Removing a needed tool breaks order lookups.",
    ],
  },
  {
    id: "q8", domain: "tools", lesson: "2.2", scenario: "Customer support agent",
    q: "When a refund exceeds policy, your MCP tool returns 'Operation failed'. Claude keeps retrying it. What should the tool return?",
    options: [
      "Nothing, so Claude moves on",
      "A success message so the conversation continues",
      "isError: true with a 'business' error category, isRetryable: false, and a customer-friendly explanation",
      "A longer 'Operation failed' message",
    ],
    answer: 2,
    why: [
      "Every tool call needs a result. Silence leaves Claude confused.",
      "Faking success tells the customer something false.",
      "Right. A clear category and retry flag tell Claude to stop retrying and explain to the customer.",
      "Length doesn't help. Claude needs the type of failure and whether to retry.",
    ],
  },
  {
    id: "q9", domain: "tools", lesson: "2.2", scenario: "Multi-agent research system",
    q: "A search tool returns an empty list both when nothing matches and when the database is down. What problem does this cause?",
    options: [
      "None; both mean no data",
      "Claude can't tell a real 'no results' apart from a failure, so it may report 'nothing found' when the search never ran",
      "The tool becomes slower",
      "It uses more tokens",
    ],
    answer: 1,
    why: [
      "They mean very different things: one is an answer, the other is a failure.",
      "Right. Access failures should be errors; valid empty results should be successes.",
      "Speed isn't the issue.",
      "Token use isn't the issue.",
    ],
  },
  {
    id: "q10", domain: "tools", lesson: "2.3", scenario: "Multi-agent research system",
    q: "Your synthesis helper has 18 tools, including web search and file editing, and often calls tools it doesn't need. What's the best fix?",
    options: [
      "Give it only the few tools its job needs",
      "Add 'only use relevant tools' to its prompt",
      "Give it even more tools so it has options",
      "Use a bigger model",
    ],
    answer: 0,
    why: [
      "Right. Fewer, role-matched tools improve selection. Around 4 to 5 per agent works well.",
      "A prompt nudge doesn't fix the confusing toolset.",
      "More tools makes selection worse.",
      "A bigger model doesn't fix a badly scoped toolset.",
    ],
  },
  {
    id: "q11", domain: "tools", lesson: "2.4", scenario: "Developer productivity",
    q: "Your team wants everyone's Claude Code to connect to the company's GitHub MCP server, without committing anyone's personal token. How?",
    options: [
      "Each person adds it to ~/.claude.json with their token",
      "Put it in .mcp.json with the token typed in",
      "Put it in the project's .mcp.json using ${GITHUB_TOKEN}, and each person sets the environment variable",
      "Paste the token in CLAUDE.md",
    ],
    answer: 2,
    why: [
      "This works, but every person must set it up separately, so it isn't shared.",
      "This commits a secret to version control.",
      "Right. Shared config, with secrets kept out through environment variable expansion.",
      "Never put secrets in memory files.",
    ],
  },
  {
    id: "q12", domain: "tools", lesson: "2.5", scenario: "Developer productivity",
    q: "You join a new codebase and must find every place that calls processPayment(). Which approach is best?",
    options: [
      "Read every file one by one",
      "Use Grep to search file contents for processPayment, then Read only the matching files",
      "Use Glob for **/*processPayment*",
      "Ask Claude to guess from the folder names",
    ],
    answer: 1,
    why: [
      "This wastes time and context on irrelevant files.",
      "Right. Grep finds content; then Read just what matters.",
      "Glob matches file names, not the code inside files.",
      "Guessing misses calls.",
    ],
  },

  /* ---------- Claude Code Configuration ---------- */
  {
    id: "q13", domain: "claudecode", lesson: "3.1", scenario: "Code generation with Claude Code",
    q: "A new developer says Claude Code ignores your team's coding rules on their machine. On your machine it follows them. What is the most likely cause?",
    options: [
      "The rules are in your user-level ~/.claude/CLAUDE.md, which isn't shared",
      "Their internet is slow",
      "They need a newer laptop",
      "CLAUDE.md only works for the first person who creates it",
    ],
    answer: 0,
    why: [
      "Right. User-level memory stays on your machine. Team rules belong in the project CLAUDE.md.",
      "Connection speed doesn't affect which memory files load.",
      "Hardware isn't related.",
      "A project CLAUDE.md works for everyone who has the repo.",
    ],
  },
  {
    id: "q14", domain: "claudecode", lesson: "3.1", scenario: "Code generation with Claude Code",
    q: "Claude Code seems to ignore an instruction you think is in CLAUDE.md. What's the best first diagnostic step?",
    options: [
      "Reinstall Claude Code",
      "Run /memory to see which memory files are actually loaded",
      "Rewrite the instruction in capital letters",
      "Delete CLAUDE.md",
    ],
    answer: 1,
    why: [
      "Reinstalling is slow and rarely the cause.",
      "Right. /memory shows exactly which files are loaded, so you can see if yours is missing.",
      "If the file isn't loaded, wording won't matter.",
      "Deleting removes all your rules.",
    ],
  },
  {
    id: "q15", domain: "claudecode", lesson: "3.3", scenario: "Code generation with Claude Code",
    q: "Test files live next to the code they test, across dozens of folders. You want one testing style guide applied only when Claude edits a test file. What should you use?",
    options: [
      "A CLAUDE.md in every folder",
      "Put the guide in the root CLAUDE.md",
      "A file in .claude/rules/ with paths: [\"**/*.test.*\"] in its frontmatter",
      "A slash command developers must remember to run",
    ],
    answer: 2,
    why: [
      "Dozens of copies are hard to maintain.",
      "This loads the guide for every task, wasting context and risking confusion.",
      "Right. Path-scoped rules load only when matching files are edited, wherever they live.",
      "People forget. Rules should apply automatically.",
    ],
  },
  {
    id: "q16", domain: "claudecode", lesson: "3.4", scenario: "Code generation with Claude Code",
    q: "You need to move a monolith to microservices. It will touch dozens of files and there are several possible designs. How should you start?",
    options: [
      "Direct execution, and fix problems as they come up",
      "Plan mode, to explore and agree on an approach before changing code",
      "Ask Claude to do it all in one message without planning",
      "Split it into 50 tiny unrelated prompts",
    ],
    answer: 1,
    why: [
      "Large, multi-option changes done directly often need costly rework.",
      "Right. Plan mode suits big, architectural, multi-file work.",
      "This is direct execution under another name.",
      "Unrelated prompts lose the overall design.",
    ],
  },
  {
    id: "q17", domain: "claudecode", lesson: "3.6", scenario: "Claude Code in CI/CD",
    q: "Your CI pipeline runs claude \"Review this PR\" and the job hangs until it times out. What's the fix?",
    options: [
      "Add the -p flag so Claude Code runs non-interactively",
      "Give the job more memory",
      "Add a longer timeout",
      "Put the instruction in CLAUDE.md",
    ],
    answer: 0,
    why: [
      "Right. Without -p (print mode), Claude Code waits for interactive input.",
      "Memory isn't the problem.",
      "It would just hang longer.",
      "CLAUDE.md adds context but doesn't change interactive mode.",
    ],
  },
  {
    id: "q18", domain: "claudecode", lesson: "3.2", scenario: "Developer productivity",
    q: "Your team wants a /review command with the same checklist for everyone, kept in version control. Where should it go?",
    options: [
      "~/.claude/commands/review.md on each laptop",
      ".claude/commands/review.md in the project repository",
      "In the system prompt of each developer's terminal",
      "In a shared chat channel",
    ],
    answer: 1,
    why: [
      "Personal commands aren't shared or versioned with the project.",
      "Right. Project commands are committed and available to everyone who clones the repo.",
      "There's no such shared place, and it wouldn't be a slash command.",
      "Chat messages aren't loaded by Claude Code.",
    ],
  },

  /* ---------- Prompt Engineering & Structured Output ---------- */
  {
    id: "q19", domain: "prompting", lesson: "4.1", scenario: "Claude Code in CI/CD",
    q: "Developers stopped trusting your automated reviewer because it flags many harmless things. The prompt says 'Be conservative and only report important issues.' What is the best change?",
    options: [
      "Add 'be VERY conservative'",
      "Spell out exactly which issues to report (bugs, security) and which to skip (style, naming)",
      "Ask for confidence scores and hide anything below 50%",
      "Review fewer files",
    ],
    answer: 1,
    why: [
      "Vague instructions stay vague, however strongly they're worded.",
      "Right. Specific, categorical criteria cut false positives.",
      "Self-reported confidence is poorly calibrated, so filtering on it is unreliable.",
      "Fewer files means missed bugs, not better precision.",
    ],
  },
  {
    id: "q20", domain: "prompting", lesson: "4.2", scenario: "Structured data extraction",
    q: "Your extractor handles standard invoices well but keeps misreading invoices with handwritten corrections. What's the most effective improvement?",
    options: [
      "Add 2 to 4 examples of corrected invoices, with the right output and why",
      "Add 20 examples of standard invoices",
      "Tell it to 'pay attention to handwriting'",
      "Remove handwritten invoices from the dataset",
    ],
    answer: 0,
    why: [
      "Right. Targeted few-shot examples teach the tricky cases.",
      "More easy examples don't teach the hard case.",
      "A vague instruction doesn't show what correct looks like.",
      "The business still needs those invoices processed.",
    ],
  },
  {
    id: "q21", domain: "prompting", lesson: "4.3", scenario: "Structured data extraction",
    q: "About 15% of contracts have no renewal date, but your extractor always returns one, often invented. The schema marks renewal_date as required. What fixes this?",
    options: [
      "Make renewal_date nullable so 'not present' is a valid answer",
      "Remove the schema",
      "Add 'never make things up' to the prompt",
      "Default missing dates to January 1",
    ],
    answer: 0,
    why: [
      "Right. A required field pushes the model to fill it. Allowing null gives an honest option.",
      "Removing the schema brings back format errors.",
      "Instructions help less than a schema that allows the truthful answer.",
      "A default date is still a made-up value.",
    ],
  },
  {
    id: "q22", domain: "prompting", lesson: "4.4", scenario: "Structured data extraction",
    q: "Validation finds that the extracted line items don't add up to the stated total. What is the best retry?",
    options: [
      "Send the same request again",
      "Send the original document, the failed extraction, and the specific mismatch",
      "Send only the error message",
      "Keep retrying until the numbers match",
    ],
    answer: 1,
    why: [
      "An identical request tends to give the same result.",
      "Right. Specific feedback with full context lets Claude find and fix the error.",
      "Without the document, Claude can't check what's actually there.",
      "If the source itself is inconsistent, retries will never match. Route it to a person.",
    ],
  },
  {
    id: "q23", domain: "prompting", lesson: "4.5", scenario: "Claude Code in CI/CD",
    q: "Your team runs two jobs: a pre-merge check that developers wait on, and a weekly code-quality report. Someone suggests moving both to the Batches API to save money. What should you do?",
    options: [
      "Move both, since 50% savings is worth it",
      "Move only the weekly report; keep the pre-merge check on normal requests",
      "Move only the pre-merge check",
      "Move neither",
    ],
    answer: 1,
    why: [
      "Batches can take up to 24 hours, which would block developers.",
      "Right. Batches suit work nobody waits on. Blocking checks need fast responses.",
      "This is backwards: the waiting job is the one that can't be slow.",
      "The weekly report is a perfect fit for batch savings.",
    ],
  },
  {
    id: "q24", domain: "prompting", lesson: "4.6", scenario: "Code generation with Claude Code",
    q: "Code written by Claude is reviewed by asking the same session 'please review what you wrote'. It rarely finds problems that humans later catch. What should change?",
    options: [
      "Ask it to review three times",
      "Use a separate, fresh Claude instance as the reviewer",
      "Turn reviews off",
      "Ask it to be harsher",
    ],
    answer: 1,
    why: [
      "The same session tends to repeat its own reasoning.",
      "Right. An independent reviewer isn't anchored to the original choices.",
      "That throws away a useful safety check.",
      "Tone doesn't remove the blind spot.",
    ],
  },

  /* ---------- Context Management & Reliability ---------- */
  {
    id: "q25", domain: "context", lesson: "5.1", scenario: "Customer support agent",
    q: "In long support chats, your agent starts mixing up the customer's order numbers and refund amounts after many turns. What helps most?",
    options: [
      "Summarise the whole conversation every 5 turns",
      "Keep a 'case facts' block (IDs, amounts, dates) included at the top of every request",
      "Shorten the system prompt",
      "End chats after 10 turns",
    ],
    answer: 1,
    why: [
      "Summaries tend to blur exact numbers and IDs.",
      "Right. A persistent, exact facts block keeps key details clear.",
      "The system prompt isn't the cause.",
      "Cutting chats short hurts customers.",
    ],
  },
  {
    id: "q26", domain: "context", lesson: "5.2", scenario: "Customer support agent",
    q: "A customer writes: 'This is the third time. I just want to talk to a human.' The agent believes it could solve the issue. What should it do?",
    options: [
      "Try one more solution first, since it's confident",
      "Hand off to a human immediately, with a summary of the case",
      "Check the customer's sentiment score first",
      "Ask why they want a human",
    ],
    answer: 1,
    why: [
      "Ignoring a direct request damages trust, and the agent's confidence is not a reliable guide.",
      "Right. Explicit requests for a human are honoured right away.",
      "Sentiment isn't the right trigger. The customer has asked directly.",
      "Questioning the request delays the handoff the customer asked for.",
    ],
  },
  {
    id: "q27", domain: "context", lesson: "5.2", scenario: "Customer support agent",
    q: "A lookup by name returns three customers called 'Alex Kim'. What should the agent do?",
    options: [
      "Pick the most recent customer",
      "Ask the customer for another detail, such as email or order number, to identify the right account",
      "Escalate to a human immediately",
      "Merge the three accounts",
    ],
    answer: 1,
    why: [
      "Guessing risks exposing or changing the wrong person's account.",
      "Right. When several records match, ask for an identifier.",
      "This is easy to resolve, so a human isn't needed.",
      "Merging accounts is destructive and wrong.",
    ],
  },
  {
    id: "q28", domain: "context", lesson: "5.3", scenario: "Multi-agent research system",
    q: "One search helper times out. Right now it returns an empty result marked as success, and the final report confidently says 'no news coverage found'. What should happen instead?",
    options: [
      "Stop the whole research workflow",
      "The helper returns a structured error (type, what it tried, any partial results), and the report notes the gap",
      "Hide the section from the report",
      "Retry forever until it works",
    ],
    answer: 1,
    why: [
      "One failed helper shouldn't stop everything.",
      "Right. Clear error context lets the coordinator recover, and readers see what's less certain.",
      "Hiding gaps misleads readers.",
      "Endless retries waste time. Retry a little locally, then report.",
    ],
  },
  {
    id: "q29", domain: "context", lesson: "5.5", scenario: "Structured data extraction",
    q: "Extraction accuracy is 97% overall, so the team wants to stop human review. What should you check first?",
    options: [
      "Nothing; 97% is excellent",
      "Accuracy by document type and by field, using a stratified sample",
      "Whether the model is the newest",
      "How fast extraction runs",
    ],
    answer: 1,
    why: [
      "A high average can hide one document type that fails badly.",
      "Right. Breaking accuracy down shows where human review is still needed.",
      "Model version doesn't tell you where errors are.",
      "Speed isn't accuracy.",
    ],
  },
  {
    id: "q30", domain: "context", lesson: "5.6", scenario: "Multi-agent research system",
    q: "Two trusted sources give different market sizes: $4B (2024) and $6B (2026). How should the final research report handle this?",
    options: [
      "Use the bigger number",
      "Average them to $5B",
      "Show both figures with their sources and dates",
      "Leave the market size out",
    ],
    answer: 2,
    why: [
      "Picking one hides real disagreement.",
      "An average matches neither source and has no provenance.",
      "Right. Annotate conflicts with sources; the dates explain much of the difference.",
      "Dropping the figure removes useful information.",
    ],
  },
];
