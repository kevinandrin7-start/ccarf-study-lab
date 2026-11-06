// Mock exams in the style of the CCAR-F exam.
// Original questions written against the published exam guide (domains, task statements,
// weightings and scenario bank). They are NOT real or leaked exam questions.
//
// Each mock covers 4 of the 6 scenarios and roughly follows the domain weights
// (Agentic 27%, Claude Code 20%, Prompting 20%, Tools/MCP 18%, Context 15%).
// To add a mock, append an object to MOCKS. Question fields:
//   domain, lesson, scenario, q, options[], answer, why[]
//   answer is an index, or an array of indexes for "Choose N" items.
// Ids are generated from the mock id and position (e.g. "mock1-07").

const RAW_MOCKS = [
  {
    id: "mock1",
    title: "Mock 1",
    minutes: 60,
    questions: [
      /* ---------------- Scenario: Customer support agent ---------------- */
      {
        domain: "agentic", lesson: "1.5", scenario: "Customer support agent",
        q: "Company policy says refunds over $500 must be approved by a person. The system prompt states this rule clearly, yet audits show the agent processed several $600–$900 refunds on its own last month. What is the most reliable fix?",
        options: [
          "Add a hook on process_refund that blocks amounts over $500 and routes the case to escalate_to_human",
          "Repeat the $500 rule at the start and end of the system prompt, in capital letters",
          "Add several few-shot examples to the system prompt that show the agent escalating refunds above $500 instead of processing them itself",
          "Run a nightly audit job that reverses refunds over $500 and emails the customer",
        ],
        answer: 0,
        why: [
          "Right. A hook on the outgoing tool call is deterministic: the refund physically can't go through, and the case is redirected to the correct workflow.",
          "Still prompt-based. Prompt instructions are probabilistic and keep a non-zero failure rate, which is not acceptable for a financial rule.",
          "Few-shot examples improve consistency but cannot guarantee compliance. Some large refunds would still slip through.",
          "This detects the violation after the money has moved and creates a bad customer experience. Prevent it instead of cleaning up.",
        ],
      },
      {
        domain: "tools", lesson: "2.2", scenario: "Customer support agent",
        q: "Your lookup_order MCP tool returns the same response, {\"error\": \"Operation failed\"}, for timeouts, badly formatted order numbers, and orders that belong to a different customer. The agent retries bad order numbers again and again, and tells some customers to 'try later' when they don't have permission. What should you change?",
        options: [
          "Raise the agent's retry limit so that temporary failures have more chances to succeed",
          "Return isError with structured metadata: an error category (transient, validation, permission), an isRetryable flag, and a readable description",
          "Tell the agent in the system prompt never to retry a failed tool call",
          "Return an empty result instead of an error for every failure, so the agent can tell the customer politely that no matching order was found and move on",
        ],
        answer: 1,
        why: [
          "More retries make the problem worse: validation and permission errors will never succeed no matter how often you retry.",
          "Right. Structured error categories and a retryable flag let the agent choose the right recovery: retry timeouts, ask the customer to fix the number, and explain permission problems.",
          "This stops useful retries for genuine timeouts. The agent needs to tell error types apart, not follow one blanket rule.",
          "This hides a failure as a valid 'no match' result, which is misleading. Access failures and empty results must stay distinguishable.",
        ],
      },
      {
        domain: "context", lesson: "5.1", scenario: "Customer support agent",
        q: "In long support chats, older turns are summarized to save tokens. After summarization the agent tells a customer 'your refund of around $80 should arrive soon', even though the customer said $87.43 and was promised it by Friday. What is the best fix?",
        options: [
          "Summarize the history more often so each summary is shorter and fresher",
          "Ask customers to repeat their order details whenever the conversation gets long",
          "Extract key transactional facts (amounts, dates, order IDs, promises) into a persistent case-facts block that is sent with every request, outside the summarized history",
          "Turn off summarization entirely and always send the complete raw transcript, so no detail can ever be lost, however long the conversation gets",
        ],
        answer: 2,
        why: [
          "Summarizing more often compresses the numbers even more. Progressive summarization is exactly what blurs exact values and dates.",
          "This shifts the burden onto the customer and hurts the experience. The system already had the facts and lost them.",
          "Right. Exact facts live in a structured block that is never summarized, so they stay precise however long the chat runs.",
          "This works until the context limit, and very long inputs bring 'lost in the middle' problems. A case-facts block solves the real issue.",
        ],
      },
      {
        domain: "tools", lesson: "2.1", scenario: "Customer support agent",
        q: "The agent has two tools: process_refund ('Gives the customer money back') and issue_store_credit ('Gives the customer value back'). Logs show it often issues store credit when customers clearly asked for a refund to their card. What is the best first step?",
        options: [
          "Merge both into a single compensate_customer tool with a required 'method' parameter (refund or credit), so there is only one tool to choose",
          "Add a keyword router that sends any message containing 'refund' straight to process_refund",
          "Rewrite both descriptions to say what each does, its inputs, and when to use it instead of the other",
          "Add a line to the system prompt telling the agent to think carefully about which compensation the customer asked for before choosing a tool",
        ],
        answer: 2,
        why: [
          "Merging is a bigger redesign and just moves the same ambiguity into a parameter. Fix the descriptions first.",
          "A keyword router is brittle and bypasses the model's understanding. 'I don't want a refund, just credit' would be misrouted.",
          "Right. Tool descriptions are the main signal Claude uses to choose tools. Near-identical descriptions cause misrouting; clear boundaries fix it.",
          "A vague instruction doesn't give the model any new information to tell the tools apart.",
        ],
      },
      {
        domain: "context", lesson: "5.2", scenario: "Customer support agent",
        q: "A customer gives their name, 'Maria Lopez'. get_customer returns three accounts with that name in the same city. What should the agent do?",
        options: [
          "Pick the account with the most recent order activity, since statistically that is most likely to be the account the customer is contacting support about",
          "Ask the customer for another identifier, such as their email or an order number",
          "Pick the account that has an open support ticket",
          "Continue with all three accounts and apply any change to each of them",
        ],
        answer: 1,
        why: [
          "A heuristic guess can expose or change the wrong person's account. Never choose between multiple matches by guessing.",
          "Right. Multiple matches call for clarification with an extra identifier, not heuristic selection.",
          "Still a guess. An open ticket does not prove which account belongs to this customer.",
          "Changing three accounts when only one is correct is a serious data and privacy error.",
        ],
      },
      {
        domain: "agentic", lesson: "1.4", scenario: "Customer support agent",
        q: "When the agent escalates, human agents complain they have to start from scratch: they can't see the chat transcript and don't know what was already tried. What should the escalation include?",
        options: [
          "A one-line note: 'Customer needs help with an order issue'",
          "A link to the full conversation logs in the internal logging system, so the human agent can read the entire transcript and understand everything that happened",
          "Nothing extra. The human should ask the customer to explain the problem again so nothing is missed",
          "A structured handoff summary: customer ID, the issue and its root cause, what was already checked or attempted, amounts involved, and a recommended next action",
        ],
        answer: 3,
        why: [
          "Too vague. The human still has to rediscover everything.",
          "Human agents may not have access to those logs, and reading a long transcript is slow. A handoff should be self-contained.",
          "Making the customer repeat themselves is exactly the experience you are trying to avoid.",
          "Right. A self-contained structured summary lets someone without the transcript act immediately.",
        ],
      },
      {
        domain: "agentic", lesson: "1.4", scenario: "Customer support agent",
        q: "A customer writes one message with three problems: a damaged blender, a double charge on last month's bill, and a wrong delivery address on an open order. The agent fixes the blender and ends the conversation. What design change best handles messages like this?",
        options: [
          "Have the agent first split the message into distinct issues, investigate each one (in parallel where possible) using shared customer context, then reply with one combined resolution",
          "Ask customers to open a separate ticket for each problem",
          "Only handle the most urgent issue, then ask if there is anything else",
          "Escalate any message that mentions more than one issue to a human agent, since multi-issue conversations are complex and carry a higher risk of mistakes",
        ],
        answer: 0,
        why: [
          "Right. Decompose multi-concern requests into separate items, investigate each, and synthesize a single resolution.",
          "This pushes work back onto the customer and hurts first-contact resolution.",
          "Handling one issue and hoping the customer asks again is what is failing now.",
          "Multiple issues are not the same as complex issues. Escalating all of them would wreck the 80% resolution target.",
        ],
      },
      {
        domain: "tools", lesson: "2.3", scenario: "Customer support agent",
        q: "Your support agent has access to 19 tools, including internal admin and reporting tools it rarely needs. Tool selection is unreliable: it sometimes calls the wrong tool or a tool from the wrong area. Which TWO changes will most improve tool selection? (Choose 2.)",
        options: [
          "Reduce the agent's tools to the handful its support role actually needs",
          "Set tool_choice to \"any\" on every turn",
          "Make the descriptions of overlapping tools clearly different, with when-to-use guidance",
          "Increase the sampling temperature so the agent explores more tools",
          "Add the instruction 'choose tools carefully' to the system prompt",
        ],
        answer: [0, 2],
        why: [
          "Correct. Too many tools increases decision complexity and degrades selection. Give each agent only what its role needs.",
          "\"any\" forces some tool call on every turn, which breaks normal replies and does nothing to help pick the right tool.",
          "Correct. Clear, differentiated descriptions are the main lever for choosing the right tool.",
          "Higher temperature adds randomness, which makes selection less reliable, not more.",
          "Vague instructions add no information the model can use to tell tools apart.",
        ],
      },

      /* ---------------- Scenario: Code generation with Claude Code ---------------- */
      {
        domain: "claudecode", lesson: "3.1", scenario: "Code generation with Claude Code",
        q: "A senior developer's Claude Code always follows the team's testing conventions, but a new hire's doesn't, even on the same repository. The conventions are written in the senior developer's ~/.claude/CLAUDE.md. What is the right fix?",
        options: [
          "Ask the new hire to copy the senior developer's ~/.claude/CLAUDE.md onto their own machine so both developers have identical instructions loaded",
          "Move the conventions into the project's CLAUDE.md (or .claude/rules/) and commit it to the repository",
          "Have the new hire run /compact before each session",
          "Add the conventions to .mcp.json so they are shared with the MCP servers",
        ],
        answer: 1,
        why: [
          "This works once but drifts over time and has to be repeated for every new person. User-level files are personal.",
          "Right. User-level CLAUDE.md is not shared through version control. Team standards belong in project-level configuration.",
          "/compact shrinks the current context. It doesn't load instructions that were never there.",
          ".mcp.json configures MCP servers, not coding conventions.",
        ],
      },
      {
        domain: "claudecode", lesson: "3.2", scenario: "Code generation with Claude Code",
        q: "Your team's /analyze-deps skill scans the whole codebase and prints hundreds of lines of dependency details. After running it, developers find the main conversation cluttered and Claude loses track of the task they were working on. What should you change?",
        options: [
          "Add allowed-tools to the skill's frontmatter so it can only use read-only tools, which keeps the analysis lightweight and limits what it prints",
          "Add an argument-hint so developers must name a single package, which keeps the analysis small and its output short",
          "Add context: fork to the skill's frontmatter so it runs in an isolated sub-agent",
          "Move the skill's instructions into CLAUDE.md so they are always loaded",
        ],
        answer: 2,
        why: [
          "allowed-tools limits what the skill can do, but its verbose output would still flood the main context.",
          "This prompts for a parameter but doesn't stop the output from polluting the conversation.",
          "Right. context: fork runs the skill in its own context, so verbose output stays out of the main session.",
          "That loads the instructions into every session, adding clutter instead of removing it.",
        ],
      },
      {
        domain: "claudecode", lesson: "3.4", scenario: "Code generation with Claude Code",
        q: "A bug report includes a clear stack trace pointing to one function that crashes when the 'discount' field is null. The fix is a single null check. How should you approach this in Claude Code?",
        options: [
          "Enter plan mode and have Claude explore the codebase before proposing anything",
          "Use direct execution: ask Claude to add the null check and a test for it",
          "Launch an Explore subagent to map every caller of the function first, so the fix doesn't break anything elsewhere in the codebase",
          "Use the interview pattern so Claude asks you about edge cases before coding",
        ],
        answer: 1,
        why: [
          "Plan mode is for large, multi-file or architectural work. Here it adds overhead with no benefit.",
          "Right. A well-scoped, single-function fix with a clear cause is exactly what direct execution is for.",
          "Wide discovery isn't needed when the stack trace already pinpoints the problem.",
          "The interview pattern helps in unfamiliar design spaces, not for a one-line known fix.",
        ],
      },
      {
        domain: "claudecode", lesson: "3.5", scenario: "Code generation with Claude Code",
        q: "You've described in a paragraph how a migration script should reformat phone numbers. Each time, Claude handles some formats differently from what you meant, especially numbers with extensions. What is the most effective way to clarify?",
        options: [
          "Rewrite the paragraph to be longer and more detailed, describing every phone format and how extensions should be handled in each case",
          "Give 2–3 concrete input → expected output examples, including one with an extension",
          "Tell Claude to 'be precise' and 'follow the description exactly'",
          "Switch to plan mode so Claude thinks harder about the formats",
        ],
        answer: 1,
        why: [
          "More prose is still open to interpretation, which is the problem you already have.",
          "Right. Concrete input/output examples are the clearest way to communicate a transformation when prose is read inconsistently.",
          "General exhortations don't add the missing information about what you expect.",
          "Plan mode is for designing large changes. It doesn't fix an unclear specification.",
        ],
      },
      {
        domain: "claudecode", lesson: "3.5", scenario: "Code generation with Claude Code",
        q: "You've found three problems in Claude's new caching layer: the cache key ignores the user's locale, invalidation runs before the write commits, and the retry logic re-reads the stale cache. Fixing any one changes how the others should be fixed. How should you give this feedback?",
        options: [
          "Fix one problem per message, starting with the easiest",
          "Describe all three problems together in one detailed message, explaining how they interact",
          "Start a fresh session for each problem so that each fix gets Claude's full attention with a clean, uncluttered context",
          "Ask Claude to find and fix 'any remaining caching issues' without listing them, so it investigates the whole layer with fresh eyes instead of being anchored",
        ],
        answer: 1,
        why: [
          "Sequential fixes suit independent problems. Here each fix affects the others, so you would end up redoing work.",
          "Right. When issues interact, give them together so the fix can be designed as a whole.",
          "Separate sessions lose the shared context that links the three problems.",
          "You already know the problems. Withholding them makes the result less reliable.",
        ],
      },
      {
        domain: "claudecode", lesson: "3.1", scenario: "Code generation with Claude Code",
        q: "Claude Code follows your API naming rules in some sessions but ignores them in others, in the same repository. You suspect the rules file isn't always loaded. What is the quickest way to check which memory files are loaded in a session?",
        options: [
          "Run /memory to see the memory files Claude Code has loaded",
          "Run /compact and see whether the rules come back",
          "Restart Claude Code with --resume so the previous session, which did follow the rules, is reloaded with its configuration",
          "Delete CLAUDE.md and recreate it",
        ],
        answer: 0,
        why: [
          "Right. /memory shows which memory files are in effect, so you can diagnose inconsistent behaviour.",
          "/compact summarizes context. It doesn't tell you which files were loaded.",
          "Resuming continues an old conversation. It doesn't diagnose configuration.",
          "Destructive and doesn't explain why the rules weren't loading in the first place.",
        ],
      },
      {
        domain: "tools", lesson: "2.5", scenario: "Code generation with Claude Code",
        q: "Before removing a legacy module, you need every file that imports from 'utils/legacyDate'. Which built-in tool should Claude use first?",
        options: [
          "Glob with the pattern **/*legacyDate*",
          "Read every file in the src folder one by one and check each file's import statements",
          "Grep for the import path 'utils/legacyDate' across the codebase",
          "Write a new file listing the modules you think import it",
        ],
        answer: 2,
        why: [
          "Glob matches file names, not file contents. It finds the module itself, not the files that import it.",
          "Reading everything upfront wastes context. Search first, then read only what matters.",
          "Right. Grep searches file contents for patterns, such as import statements.",
          "Guessing isn't analysis. Use search to find the real callers.",
        ],
      },

      /* ---------------- Scenario: Multi-agent research system ---------------- */
      {
        domain: "agentic", lesson: "1.3", scenario: "Multi-agent research system",
        q: "The search subagent returns rich results, but the synthesis subagent's reports are generic and miss most of them. The coordinator spawns synthesis with the prompt 'Synthesize the research findings into a report.' What is the most likely cause?",
        options: [
          "The synthesis subagent needs its own web search tool",
          "Subagents don't inherit the coordinator's context, so the findings must be put in the prompt",
          "The synthesis subagent's max_tokens is too low",
          "Subagents share memory with the coordinator, but only after the coordinator's turn ends, so synthesis was started too early to see the results",
        ],
        answer: 1,
        why: [
          "Giving synthesis search tools would duplicate work and cause cross-role misuse. It already has what it needs if context is passed.",
          "Right. Subagents start with isolated context. Complete findings must be put explicitly in their prompt.",
          "A token limit would truncate a report, not make it ignore results it never received.",
          "Subagents don't share memory at any point. Context must be passed explicitly.",
        ],
      },
      {
        domain: "agentic", lesson: "1.3", scenario: "Multi-agent research system",
        q: "For each research question the coordinator spawns four independent search subagents, one per turn, waiting for each to finish before starting the next. Research takes about four times longer than it should. What is the fix?",
        options: [
          "Emit all four Task tool calls in a single coordinator response so the subagents run in parallel",
          "Merge the four search subagents into one subagent that searches all four topics, which removes the overhead of waiting between subagent turns",
          "Move the searches to the Message Batches API",
          "Cut the number of search subagents to two",
        ],
        answer: 0,
        why: [
          "Right. Multiple Task calls in one response run in parallel. Spreading them across turns makes them sequential.",
          "One agent doing four searches is still sequential and loses the benefit of focused subagents.",
          "Batches can take up to 24 hours and don't support multi-turn tool use. Wrong tool for interactive research.",
          "This reduces coverage to save time, when parallel spawning solves the latency without losing anything.",
        ],
      },
      {
        domain: "agentic", lesson: "1.3", scenario: "Multi-agent research system",
        q: "You've written AgentDefinitions for four subagents and a coordinator prompt telling it to delegate. In testing, the coordinator never spawns a subagent and tries to do everything itself. What is the most likely cause?",
        options: [
          "The subagents' allowedTools don't include \"Task\"",
          "The coordinator's tool_choice is set to \"auto\"",
          "The coordinator's allowedTools don't include \"Task\"",
          "The subagent AgentDefinition descriptions are too long, so the coordinator can't decide which one fits the task",
        ],
        answer: 2,
        why: [
          "Subagents don't need Task. Giving it to them risks recursive delegation.",
          "\"auto\" still allows tool calls. It doesn't block spawning.",
          "Right. The Task tool is how subagents are spawned, and the coordinator must have it in allowedTools.",
          "Description length affects which subagent is chosen, not whether spawning is possible at all.",
        ],
      },
      {
        domain: "context", lesson: "5.3", scenario: "Multi-agent research system",
        q: "The web search subagent hit a timeout on one source and returned an empty list marked as success. The final report said 'no published research exists on this topic', which was false. How should the subagent report this?",
        options: [
          "Stop the whole research workflow whenever any subagent fails",
          "Keep retrying the timed-out source until it responds",
          "Return a structured error with the failure type, the query attempted, any partial results, and possible alternatives, so it's clearly different from 'searched and found nothing'",
          "Keep returning empty results, but tell the coordinator in its prompt to treat any empty result with suspicion and double-check it before writing conclusions",
        ],
        answer: 2,
        why: [
          "Ending everything on one failure is an anti-pattern. Other sources may still give a good report.",
          "Unlimited retries can hang the pipeline. Handle transient errors locally with limits, then propagate.",
          "Right. Access failures must be distinguishable from valid empty results so the coordinator can retry, re-route, or flag a gap.",
          "The coordinator can't tell a failure from a real empty result unless the subagent says so. Silent suppression causes exactly this false report.",
        ],
      },
      {
        domain: "context", lesson: "5.6", scenario: "Multi-agent research system",
        q: "Two credible sources give different market sizes for the same industry: $4.1B (a 2021 report) and $6.8B (a 2024 report). How should the system handle this in the final report?",
        options: [
          "Use the more recent and larger $6.8B figure, since newer data generally supersedes older data in fast-growing markets",
          "Average them to $5.45B",
          "Report both values with sources and dates, noting the gap may reflect growth over time",
          "Leave market size out of the report, because presenting figures that disagree would undermine the credibility of the findings",
        ],
        answer: 2,
        why: [
          "Picking one value arbitrarily hides information and loses attribution.",
          "An average of two different years is a number no source supports.",
          "Right. Keep claim-source mappings and dates, and annotate conflicts instead of resolving them silently.",
          "Dropping the data throws away useful, well-sourced information.",
        ],
      },
      {
        domain: "tools", lesson: "2.3", scenario: "Multi-agent research system",
        q: "The synthesis subagent often needs to quickly confirm a single fact (like a date or a name) while writing. Currently it has no tools, so every check goes back through the coordinator, adding several round trips. What is the best design?",
        options: [
          "Give the synthesis subagent the same full web search tool set as the search subagent, so it can check any fact itself without waiting",
          "Give synthesis a narrow verify_fact tool and route complex research through the coordinator",
          "Give every subagent every tool so none of them is ever blocked",
          "Tell the synthesis subagent to skip fact checks and trust the findings",
        ],
        answer: 1,
        why: [
          "Full search tools lead to cross-specialization misuse: synthesis starts doing research itself.",
          "Right. A scoped cross-role tool handles the high-frequency need without turning synthesis into a second search agent.",
          "Too many tools degrades selection and breaks the separation of roles.",
          "Skipping verification lowers quality to save time.",
        ],
      },
      {
        domain: "agentic", lesson: "1.2", scenario: "Multi-agent research system",
        q: "Every query, even 'What year was the company founded?', goes through all four subagents: search, document analysis, synthesis and report generation. Simple questions are slow and expensive. What should the coordinator do?",
        options: [
          "Analyze each query and invoke only the subagents it actually needs",
          "Remove the document analysis subagent to shorten the pipeline for everyone",
          "Run all four subagents in parallel instead of in sequence, so simple questions finish as fast as the slowest single subagent",
          "Set a cap of two iterations per query",
        ],
        answer: 0,
        why: [
          "Right. A good coordinator picks subagents based on query complexity instead of always running the full pipeline.",
          "That would hurt complex queries that do need document analysis.",
          "The stages depend on each other's output, and it's still doing unneeded work.",
          "Iteration caps don't address routing and can cut complex research short.",
        ],
      },
      {
        domain: "agentic", lesson: "1.7", scenario: "Multi-agent research system",
        q: "After a long shared analysis of 40 sources, you want to try two different report structures (by region vs. by industry) and compare them, without redoing the analysis. What should you use?",
        options: [
          "Run the full research pipeline twice, once per structure",
          "Use fork_session to create two independent branches from the shared analysis",
          "Use --resume on the same named session twice, one after the other, trying one report structure each time",
          "Start a new session and paste in the original question",
        ],
        answer: 1,
        why: [
          "This repeats expensive work you've already done.",
          "Right. Forking creates independent branches from a shared baseline so you can explore alternatives side by side.",
          "Resuming continues one line of work. The second attempt would carry the first one's changes.",
          "A new session loses the 40-source analysis.",
        ],
      },

      /* ---------------- Scenario: Structured data extraction ---------------- */
      {
        domain: "prompting", lesson: "4.3", scenario: "Structured data extraction",
        q: "You ask Claude to 'return the invoice data as JSON'. About 2% of responses fail to parse because of trailing commas or missing quotes, which breaks the downstream system. What is the most reliable fix?",
        options: [
          "Retry the request automatically whenever JSON parsing fails, and include the parser error so the model can correct it",
          "Define an extraction tool with the invoice JSON schema and read the tool_use input",
          "Add a post-processing step that uses regular expressions to repair common syntax mistakes, such as trailing commas and unquoted keys, before parsing",
          "Add 'Return only valid JSON' in bold to the prompt",
        ],
        answer: 1,
        why: [
          "Retries treat the symptom and add cost and latency. Some will still fail.",
          "Right. Tool use with a JSON schema is the most reliable way to get schema-compliant output with no syntax errors.",
          "Regex repair is fragile and will miss new failure patterns.",
          "Still a prompt instruction, so still probabilistic.",
        ],
      },
      {
        domain: "prompting", lesson: "4.3", scenario: "Structured data extraction",
        q: "Some invoices don't have a purchase order number. Your schema marks po_number as required, and reviewers find the model sometimes fills it with a plausible but made-up number. What is the best fix?",
        options: [
          "Make po_number optional (nullable) so the model can return null when it isn't in the document",
          "Add few-shot examples showing correct PO numbers",
          "Set temperature to 0",
          "Add a validation step that rejects any extraction whose PO number fails the format checksum, then retry with the validation error included",
        ],
        answer: 0,
        why: [
          "Right. Required fields push the model to invent values. Nullable fields let it say 'not present'.",
          "Examples of PO numbers don't solve the case where there isn't one.",
          "Lower temperature doesn't remove the pressure created by a required field.",
          "Retrying can't produce information that isn't in the document, and a fabricated number might pass the check.",
        ],
      },
      {
        domain: "prompting", lesson: "4.4", scenario: "Structured data extraction",
        q: "Extractions are always valid JSON, but in some invoices the line items don't add up to the stated total. You want the pipeline to catch and fix these. Which TWO steps help most? (Choose 2.)",
        options: [
          "Extract a calculated_total alongside the stated_total and flag any mismatch",
          "On a mismatch, retry with the original document, the failed extraction, and the specific validation error included in the prompt",
          "Tighten the JSON schema with stricter types for each line item",
          "Switch to a smaller, faster model so retries are cheaper",
          "Drop line items from the schema and keep only the total",
        ],
        answer: [0, 1],
        why: [
          "Correct. Extracting both values makes semantic errors detectable automatically.",
          "Correct. Retry with specific error feedback guides the model to correct its own mistake.",
          "Schemas fix syntax and types, not semantic errors like values that don't add up.",
          "A weaker model is likely to make more errors, not fewer.",
          "This throws away required data instead of fixing quality.",
        ],
      },
      {
        domain: "prompting", lesson: "4.4", scenario: "Structured data extraction",
        q: "When extracting contract rates, the validator keeps failing because the contract only says 'rates as listed in Appendix B', and Appendix B isn't part of the document you sent. Retries with error feedback keep failing. What should you do?",
        options: [
          "Retry with a more forceful prompt that explains the rates are required, and include the previous validation error so the model knows what was wrong",
          "Increase the maximum number of retries",
          "Stop retrying: return null with a reason and route it to a person, or fetch Appendix B",
          "Add few-shot examples of contracts that list their rates, so the model learns where rates normally appear in a contract",
        ],
        answer: 2,
        why: [
          "No prompt can extract information that isn't there. This invites fabrication.",
          "More retries waste money when the information is absent.",
          "Right. Retries fix format or structure errors, not missing information. Recognize the case and handle it.",
          "Examples don't change the fact that this document doesn't contain the rates.",
        ],
      },
      {
        domain: "prompting", lesson: "4.5", scenario: "Structured data extraction",
        q: "Every night you need to extract data from about 40,000 scanned forms. Results are needed by 9 a.m. the next working day, and cost matters. Which approach fits best?",
        options: [
          "The Message Batches API, with a custom_id per form to match results to documents",
          "The synchronous API, sending forms concurrently overnight as fast as rate limits allow, so every result is guaranteed to be ready by morning",
          "The synchronous API with streaming turned on",
          "Split the forms across several API keys to go faster",
        ],
        answer: 0,
        why: [
          "Right. Latency-tolerant overnight work suits the Batches API: about 50% cheaper, with custom_id to correlate results.",
          "Works but costs about twice as much for work that doesn't need immediate answers.",
          "Streaming helps interactive responsiveness, not overnight cost.",
          "Doesn't reduce cost and may break usage policies. Batching is the intended solution.",
        ],
      },
      {
        domain: "context", lesson: "5.5", scenario: "Structured data extraction",
        q: "Your extraction pipeline is 97% accurate overall, and the business wants to stop human review for all high-confidence results. What should you check first?",
        options: [
          "Nothing more: 97% is above the target, so automate",
          "Accuracy broken down by document type and by field",
          "Whether the model can process documents faster",
          "Whether the model's self-reported confidence is above 90% on average across the validation set, since that shows how sure it is",
        ],
        answer: 1,
        why: [
          "An aggregate number can hide poor performance on certain document types or fields.",
          "Right. Validate by segment before reducing review, then keep stratified sampling to catch new error patterns.",
          "Speed is not the question. Accuracy per segment is.",
          "Average self-reported confidence isn't calibrated and can be high even where the model is wrong.",
        ],
      },
      {
        domain: "prompting", lesson: "4.2", scenario: "Structured data extraction",
        q: "Your prompt clearly describes every field, but when a supplier puts the invoice date in the footer instead of the header, the model returns null for it. Different suppliers use very different layouts. What is the most effective improvement?",
        options: [
          "Add a few examples of correct extraction from different layouts, including a footer date",
          "Make invoice_date required so the model can't return null",
          "Make each field description longer and more detailed, listing every place in a document where that field might appear",
          "Ask the model to 'search the whole document carefully'",
        ],
        answer: 0,
        why: [
          "Right. Few-shot examples of varied structures help the model generalize to layouts it hasn't seen, and reduce empty extractions.",
          "Required fields encourage made-up values when a date really is missing.",
          "The descriptions are already clear. The problem is varied layout, which examples handle better.",
          "A vague instruction adds no new information about where dates may appear.",
        ],
      },
    ],
  },

  {
    id: "mock2",
    title: "Mock 2",
    minutes: 60,
    questions: [
      /* ---------------- Scenario: Developer productivity ---------------- */
      {
        domain: "tools", lesson: "2.5", scenario: "Developer productivity",
        q: "Claude tries to change one return statement using Edit, but the anchor text 'return null;' appears six times in the file and the edit fails. What is the most reliable way forward?",
        options: [
          "Retry the same Edit call until it succeeds",
          "Use Bash with sed to replace every 'return null;' in the file",
          "Read the full file, then Write the updated version",
          "Use Glob to find a different file to edit",
        ],
        answer: 2,
        why: [
          "The same non-unique anchor will fail every time.",
          "This changes all six occurrences, not just the one you meant.",
          "Right. When Edit can't find unique text, Read + Write is the reliable fallback.",
          "Glob finds files by name. It doesn't help with this edit.",
        ],
      },
      {
        domain: "tools", lesson: "2.5", scenario: "Developer productivity",
        q: "You want a list of every Playwright spec file in a large monorepo. They all end in .spec.ts but live in many different folders. Which built-in tool fits best?",
        options: [
          "Grep for the word 'describe(' across the repository, since every Playwright spec file contains at least one describe block",
          "Glob with the pattern **/*.spec.ts",
          "Read the root folder and follow each subfolder by hand",
          "Bash to run the whole test suite and read the output",
        ],
        answer: 1,
        why: [
          "Grep searches contents. It would match many non-spec files and miss spec files without that word.",
          "Right. Glob matches file paths by pattern, which is exactly this task.",
          "Slow and fills context. Pattern matching does it in one step.",
          "Running tests is expensive and not a way to list files.",
        ],
      },
      {
        domain: "tools", lesson: "2.4", scenario: "Developer productivity",
        q: "Your team wants everyone's Claude Code to have the same Jira MCP server. Each person has their own Jira API token, and tokens must never be committed. How should you configure it?",
        options: [
          "Add it to the project's .mcp.json, using ${JIRA_TOKEN} for the token",
          "Put the server and a shared token in .mcp.json, since the repository is private",
          "Have each developer add the server to their own user-level ~/.claude.json, so every token stays on that developer's machine",
          "Describe the Jira server in CLAUDE.md so Claude knows how to connect",
        ],
        answer: 0,
        why: [
          "Right. Project-scoped .mcp.json is shared through version control, and environment variable expansion keeps secrets out of it.",
          "A private repository is still the wrong place for secrets, and a shared token loses per-user access control.",
          "User-level config works for personal or experimental servers, but it isn't shared, so the team setup drifts.",
          "CLAUDE.md gives instructions. It doesn't configure MCP servers.",
        ],
      },
      {
        domain: "tools", lesson: "2.4", scenario: "Developer productivity",
        q: "You've connected an MCP server whose search_code tool uses a semantic index and returns call graphs. Claude still mostly uses the built-in Grep, missing the richer results. The tool's description is 'Searches code.' What should you do first?",
        options: [
          "Remove Grep from the allowed tools so the agent has no choice but to use the more capable MCP search tool for every search",
          "Add 'never use Grep' to CLAUDE.md",
          "Expand the MCP tool's description: what it can do, what it returns, and when to prefer it",
          "Rename the tool to grep_plus",
        ],
        answer: 2,
        why: [
          "Grep is still the right tool for simple text searches. Removing it creates new problems.",
          "A blanket ban is heavy-handed and gives the model no reason to choose well.",
          "Right. Detailed descriptions are how the agent learns that a more capable MCP tool exists and when to use it.",
          "A clever name doesn't explain what the tool does or returns.",
        ],
      },
      {
        domain: "agentic", lesson: "1.6", scenario: "Developer productivity",
        q: "You ask the agent to 'add comprehensive tests to this 10-year-old billing service'. Nobody knows which parts are most fragile. Which approach is best?",
        options: [
          "A fixed, predictable pipeline: go through every file in alphabetical order and write unit tests for each function so nothing is skipped",
          "First map the structure, identify the highest-impact and riskiest areas, then follow a prioritized plan that adapts as dependencies are discovered",
          "Write tests for the easiest files first to build coverage quickly",
          "Generate all tests in one pass, then delete the ones that fail",
        ],
        answer: 1,
        why: [
          "Fixed pipelines suit predictable tasks. This task's scope is unknown, so steps must come from what you discover.",
          "Right. Open-ended tasks call for dynamic decomposition: map first, prioritize, adapt.",
          "Easy coverage isn't valuable coverage. High-impact areas come first.",
          "Deleting failing tests may hide real bugs, and a single pass can't account for discovered dependencies.",
        ],
      },
      {
        domain: "agentic", lesson: "1.7", scenario: "Developer productivity",
        q: "Yesterday you ran a named session, 'payments-investigation', that analyzed 30 files. Overnight a teammate changed 3 of those files. Most of the analysis is still valid. What is the best way to continue?",
        options: [
          "Resume the named session and tell Claude which 3 files changed",
          "Resume without mentioning the changes. Claude will notice them",
          "Start a brand-new session and re-explore all 30 files from scratch, so the analysis is guaranteed to reflect the current code",
          "Fork the session so one branch keeps the old analysis and the other re-checks the files that might have changed",
        ],
        answer: 0,
        why: [
          "Right. When prior context is mostly valid, resume and point out the specific changes for targeted re-analysis.",
          "Claude would rely on stale tool results for the changed files.",
          "Wastes the 27 files' worth of valid analysis.",
          "Forking doesn't refresh stale information. You still need to say what changed.",
        ],
      },
      {
        domain: "agentic", lesson: "1.7", scenario: "Developer productivity",
        q: "Since your last session, a major refactor moved and renamed most of the modules Claude had analyzed. You need to continue the investigation. What is most reliable?",
        options: [
          "Resume the old session so Claude keeps all its earlier context",
          "Resume the old session and ask Claude to ignore anything that looks outdated",
          "Start a new session with a summary of the findings that still hold",
          "Fork the old session twice and compare the results",
        ],
        answer: 2,
        why: [
          "Most earlier tool results are now stale and would mislead Claude.",
          "Claude can't reliably tell which stale results are outdated.",
          "Right. When prior tool results are stale, a fresh session with an injected summary beats resuming.",
          "Both forks inherit the same stale context.",
        ],
      },
      {
        domain: "claudecode", lesson: "3.4", scenario: "Developer productivity",
        q: "You're about to plan a library migration. The first step, finding every usage pattern across 200 files, will produce a huge amount of output, and you need plenty of context left for the design discussion. What should you do?",
        options: [
          "Have Claude read all 200 files into the main conversation first, so it has complete, first-hand knowledge of every usage during the design discussion",
          "Use the Explore subagent for discovery so it returns a summary",
          "Run /clear after discovery and start the design from nothing",
          "Skip discovery and design from memory of the library's documentation",
        ],
        answer: 1,
        why: [
          "This exhausts the context window before the important design work starts.",
          "Right. The Explore subagent isolates verbose discovery and keeps the main context for planning.",
          "/clear throws away what you just learned.",
          "Designing a migration without knowing how the code uses the library invites costly rework.",
        ],
      },
      {
        domain: "claudecode", lesson: "3.2", scenario: "Developer productivity",
        q: "Your team's /scaffold-service skill needs a service name to work. Developers often run it without one, and it produces a confusing generic result. What is the simplest fix in the skill's SKILL.md frontmatter?",
        options: [
          "Add context: fork",
          "Add argument-hint for the service name",
          "Add allowed-tools: Write",
          "Move the skill to ~/.claude/skills/ so each developer can customise how it handles a missing name",
        ],
        answer: 1,
        why: [
          "context: fork isolates output. It doesn't prompt for missing input.",
          "Right. argument-hint prompts developers for required parameters when they invoke the skill without them.",
          "Restricting tools doesn't fix the missing argument.",
          "That makes the skill personal, so the team loses it, and the problem remains.",
        ],
      },
      {
        domain: "agentic", lesson: "1.3", scenario: "Developer productivity",
        q: "Your coordinator prompt gives subagents a 14-step procedure for investigating a bug. When a codebase doesn't match the expected layout, subagents follow the steps rigidly and come back with nothing useful. How should you rewrite the coordinator's instructions to subagents?",
        options: [
          "Add more steps and branches that cover the other possible layouts, so subagents always have an exact procedure to follow",
          "Give the goal and quality criteria, and let the subagent decide how to investigate",
          "Remove all instructions and send only the bug title",
          "Make subagents check with the coordinator before every step, so it can correct them when the layout is unexpected",
        ],
        answer: 1,
        why: [
          "You can't foresee every layout, and longer procedures make the agent even more rigid.",
          "Right. Goals and quality criteria let subagents adapt to what they find, unlike step-by-step procedures.",
          "Without context and a goal, the subagent has nothing to work with.",
          "Constant check-ins add latency and remove the point of delegating.",
        ],
      },

      /* ---------------- Scenario: Claude Code in CI/CD ---------------- */
      {
        domain: "claudecode", lesson: "3.6", scenario: "Claude Code in CI/CD",
        q: "Your new CI job runs Claude Code to review pull requests, but the job hangs until it times out. Locally the same command works fine. What is the most likely fix?",
        options: [
          "Increase the CI job's timeout",
          "Run Claude Code with the -p (--print) flag so it runs non-interactively",
          "Add a CLAUDE.md file to the repository",
          "Use --resume so the CI run continues the last local session, which already has the needed permissions and answers",
        ],
        answer: 1,
        why: [
          "It isn't slow. It's waiting for input that will never come.",
          "Right. -p runs Claude Code in non-interactive mode, which is required in automated pipelines.",
          "CLAUDE.md gives project context but doesn't stop interactive mode.",
          "CI has no local session, and resuming doesn't fix the hang.",
        ],
      },
      {
        domain: "claudecode", lesson: "3.6", scenario: "Claude Code in CI/CD",
        q: "You want review findings posted automatically as inline PR comments. Your script struggles to parse Claude's free-text review. What should you do?",
        options: [
          "Ask Claude to put each finding on its own line starting with 'FINDING:'",
          "Use --output-format json with --json-schema",
          "Parse the text with a regular expression",
          "Ask a second Claude call to convert the review to JSON",
        ],
        answer: 1,
        why: [
          "A text convention is still fragile and can break on unusual output.",
          "Right. These CLI flags enforce structured output that a script can turn into inline comments reliably.",
          "Regex parsing of free text breaks easily.",
          "Adds cost and another place for errors when the CLI can enforce structure directly.",
        ],
      },
      {
        domain: "claudecode", lesson: "3.6", scenario: "Claude Code in CI/CD",
        q: "Every new commit to a PR triggers a fresh review, and developers are annoyed that the same 12 comments get posted again each time. What is the best fix?",
        options: [
          "Only run reviews on the first commit of each PR",
          "Include previous findings and ask for only new or unaddressed issues",
          "Have the job delete all of the bot's old PR comments before each new review is posted, so only the latest review is ever visible",
          "Raise the severity threshold so fewer findings are posted",
        ],
        answer: 1,
        why: [
          "New commits can introduce new bugs, so they still need review.",
          "Right. With prior findings in context, Claude can skip duplicates and report only what's new or still open.",
          "This loses review history and still reposts the same findings.",
          "Fewer findings doesn't stop duplicates, and you may hide real issues.",
        ],
      },
      {
        domain: "prompting", lesson: "4.6", scenario: "Claude Code in CI/CD",
        q: "In your pipeline, the same Claude session that writes a fix then reviews its own change. Reviewers notice it rarely finds problems in its own code, even obvious ones. What is the best improvement?",
        options: [
          "Tell the session to 'review critically, as if someone else wrote it'",
          "Review with an independent Claude instance that lacks the generator's context",
          "Turn on extended thinking for the review step, so the same session reasons more deeply and carefully about its own change",
          "Have the same session review the change twice, with the second pass focused only on what the first pass missed",
        ],
        answer: 1,
        why: [
          "The session still carries its own reasoning and is unlikely to question it.",
          "Right. An independent instance without the original reasoning catches issues self-review misses.",
          "More thinking in the same context still anchors on the original reasoning.",
          "Repeating the same biased review doesn't remove the bias.",
        ],
      },
      {
        domain: "prompting", lesson: "4.1", scenario: "Claude Code in CI/CD",
        q: "Your automated reviewer posts many 'style' comments that developers consider wrong or trivial. Developers have started ignoring all its comments, including real bug reports. Which TWO actions best restore trust? (Choose 2.)",
        options: [
          "Write explicit criteria for what to report (for example bugs and security issues) and what to skip (minor style, accepted local patterns)",
          "Temporarily disable the noisy style category while you improve its prompt",
          "Add 'only report findings you are highly confident about'",
          "Tell the reviewer to 'be conservative'",
          "Post findings as one long summary comment instead of inline",
        ],
        answer: [0, 1],
        why: [
          "Correct. Specific categorical criteria improve precision far more than general caution.",
          "Correct. High false-positive categories damage trust in accurate ones. Switching them off while fixing them restores trust.",
          "Confidence-based instructions don't reliably improve precision compared to explicit criteria.",
          "Vague guidance like 'be conservative' doesn't define what to flag.",
          "Changes the format, not the false positives.",
        ],
      },
      {
        domain: "agentic", lesson: "1.6", scenario: "Claude Code in CI/CD",
        q: "Reviews of large PRs (40+ files) come back shallow, and sometimes contradict themselves: one comment says a function is unused, another flags a caller of it. What review structure fixes this?",
        options: [
          "Review all files in one larger prompt with a bigger max_tokens",
          "Per-file passes for local issues, plus a separate cross-file integration pass",
          "Only review the 10 most-changed files",
          "Run the same whole-PR review three times and keep the findings that appear twice",
        ],
        answer: 1,
        why: [
          "One huge pass is what causes attention dilution and contradictions.",
          "Right. Per-file passes plus an integration pass avoid attention dilution and catch cross-file problems.",
          "Bugs in the other 30 files would be missed.",
          "Repeating a diluted review doesn't make it deeper.",
        ],
      },
      {
        domain: "prompting", lesson: "4.5", scenario: "Claude Code in CI/CD",
        q: "To cut costs, a teammate proposes moving all Claude calls in CI, including the review that must pass before a PR can merge, to the Message Batches API. What is the best response?",
        options: [
          "Agree: the 50% saving applies to every workload",
          "Keep the blocking pre-merge review on the synchronous API, and move latency-tolerant jobs like nightly test generation or weekly audits to batches",
          "Move everything to batches for the 50% saving, but add an automatic resubmission whenever a batch result takes longer than 10 minutes to return",
          "Disagree: batches are less accurate than the synchronous API",
        ],
        answer: 1,
        why: [
          "Batches can take up to 24 hours with no latency guarantee. Developers can't wait that long to merge.",
          "Right. Match the API to latency needs: synchronous for blocking checks, batch for overnight or weekly work.",
          "Retries don't create a latency guarantee that batches don't offer.",
          "Batches use the same models. The trade-off is latency, not accuracy.",
        ],
      },
      {
        domain: "claudecode", lesson: "3.6", scenario: "Claude Code in CI/CD",
        q: "Your nightly CI job asks Claude Code to generate tests. Many generated tests duplicate existing ones or test trivial getters, and they ignore your shared fixtures. Which change helps most?",
        options: [
          "Generate twice as many tests in each run and automatically keep only the ones that pass, so low-value and broken tests are filtered out",
          "Provide the existing test files in context and document testing standards, what makes a test valuable, and the available fixtures in CLAUDE.md",
          "Tell Claude to 'write better tests'",
          "Run test generation in plan mode",
        ],
        answer: 1,
        why: [
          "More low-value tests is the opposite of the goal.",
          "Right. Existing tests prevent duplicates, and CLAUDE.md standards and fixtures guide quality in CI runs.",
          "Vague instructions don't say what 'better' means.",
          "Plan mode is for interactive design work, not for fixing missing context in CI.",
        ],
      },

      /* ---------------- Scenario: Customer support agent ---------------- */
      {
        domain: "agentic", lesson: "1.5", scenario: "Customer support agent",
        q: "Your MCP tools return dates in different formats: Unix timestamps from billing, ISO 8601 from orders, and '03/04/25' from the legacy returns system. The agent sometimes miscalculates whether an item is within the 30-day return window. What is the best fix?",
        options: [
          "Add a PostToolUse hook that normalizes all dates to one format",
          "Explain all three formats in the system prompt and ask the model to convert carefully",
          "Ask customers to state their purchase date",
          "Rewrite all three backend systems to use the same date format",
        ],
        answer: 0,
        why: [
          "Right. PostToolUse hooks normalize heterogeneous data deterministically before the agent reasons about it.",
          "Probabilistic. Ambiguous formats like 03/04/25 will still be misread sometimes.",
          "Customers may misremember, and the systems already have the right data.",
          "Possible long-term, but slow and costly. A hook fixes it at the integration point now.",
        ],
      },
      {
        domain: "agentic", lesson: "1.1", scenario: "Customer support agent",
        q: "Your loop treats any response that contains a text block as the final answer. Customers sometimes see 'Let me check that order for you…' and then nothing happens. What is wrong?",
        options: [
          "The model needs a longer max_tokens",
          "The response also contained a tool_use block. The loop should continue whenever stop_reason is \"tool_use\" and end only on \"end_turn\"",
          "The order tool is too slow and timed out",
          "The system prompt should forbid any text before tool calls, so a response with text can safely be treated as the final answer",
        ],
        answer: 1,
        why: [
          "The response wasn't cut off. It ended because it was requesting a tool.",
          "Right. Checking for text content is an anti-pattern. stop_reason is the signal: tool_use means run the tool and continue.",
          "The tool was never called, because the loop stopped first.",
          "Text before tool calls is normal and useful. The loop logic is the bug.",
        ],
      },
      {
        domain: "agentic", lesson: "1.1", scenario: "Customer support agent",
        q: "After running a tool, your code sends a new request containing only a user message with the tool_result. Claude then behaves as if it never asked for the tool and has no idea what the customer wanted. What is the fix?",
        options: [
          "Put the customer's question into the tool_result content",
          "Append Claude's assistant message (with its tool_use block) to the history, then a user message with the matching tool_result, and send the full conversation each time",
          "Store the conversation in a session on Anthropic's servers using a session ID",
          "Repeat the tool call so Claude sees it twice",
        ],
        answer: 1,
        why: [
          "A workaround that still loses earlier context and doesn't follow the message format.",
          "Right. The API is stateless: every request must include the full history, with the tool_use followed by its matching tool_result.",
          "The Messages API doesn't keep conversation state between requests.",
          "Repeating the call doesn't restore the missing history.",
        ],
      },
      {
        domain: "context", lesson: "5.2", scenario: "Customer support agent",
        q: "A customer writes in capital letters, clearly frustrated, about a blender that arrived cracked. They include a photo. Standard policy covers a free replacement. They have not asked for a human. What should the agent do?",
        options: [
          "Escalate immediately, because the customer is upset",
          "Acknowledge the frustration and offer the replacement now",
          "Ask the customer to calm down before continuing",
          "Run a sentiment score on each message and escalate automatically whenever negative sentiment passes a set threshold",
        ],
        answer: 1,
        why: [
          "Frustration is not the same as complexity. This is a straightforward case the agent can resolve.",
          "Right. Acknowledge the frustration and resolve what's within capability, honoring a request for a human if they repeat it.",
          "Dismissive and makes things worse.",
          "Sentiment doesn't track case complexity. This would escalate easy cases.",
        ],
      },
      {
        domain: "context", lesson: "5.2", scenario: "Customer support agent",
        q: "A customer asks the agent to match a competitor's lower price. Your policy covers price adjustments when your own site's price drops, but says nothing about competitors. What should the agent do?",
        options: [
          "Apply the price match, since a similar price-adjustment policy already exists and matching keeps the customer happy",
          "Refuse, since the policy doesn't mention competitors",
          "Escalate to a human, because the policy is silent on this specific request",
          "Offer a smaller discount as a compromise",
        ],
        answer: 2,
        why: [
          "Extending policy by analogy is an exception the agent isn't authorized to make.",
          "Silence isn't a 'no' either. Refusing may be wrong and loses the customer.",
          "Right. Policy gaps and exceptions are a key escalation trigger.",
          "Inventing a discount is also an unauthorized policy decision.",
        ],
      },
      {
        domain: "context", lesson: "5.1", scenario: "Customer support agent",
        q: "Each lookup_order call returns over 40 fields (warehouse codes, internal flags, carrier metadata). In multi-order conversations the context fills up quickly and the agent starts missing details customers mentioned earlier. What is the best fix?",
        options: [
          "Switch to a model with a much larger context window, so all 40+ fields for every order fit comfortably for the whole conversation",
          "Trim each order result to the fields support needs before adding it",
          "Summarize the whole conversation every two turns",
          "Ask customers to handle one order per conversation",
        ],
        answer: 1,
        why: [
          "Postpones the problem, and irrelevant data still dilutes attention.",
          "Right. Verbose tool results consume tokens out of proportion to their value. Keep only what matters.",
          "Frequent summarization loses exact facts like amounts and dates.",
          "Hurts the customer experience and first-contact resolution.",
        ],
      },
      {
        domain: "tools", lesson: "2.2", scenario: "Customer support agent",
        q: "process_refund rejects a request because the order is outside the 90-day refund window. The tool returns a generic error, so the agent retries three times and then tells the customer 'our system is having problems'. What should the tool return instead?",
        options: [
          "A transient error with a suggested wait time, so the agent pauses and tries again once the backend has had time to recover",
          "A non-retryable business error with a customer-friendly reason",
          "An empty success response, so the agent moves on",
          "The full backend stack trace and error code, so the agent has complete technical detail about why the refund failed",
        ],
        answer: 1,
        why: [
          "It isn't transient. Retrying will never succeed.",
          "Right. A non-retryable business error with a clear explanation lets the agent stop retrying and tell the customer the real reason.",
          "Pretending it worked would mislead the customer.",
          "Stack traces don't help the agent choose a recovery or explain anything to the customer.",
        ],
      },

      /* ---------------- Scenario: Structured data extraction ---------------- */
      {
        domain: "prompting", lesson: "4.3", scenario: "Structured data extraction",
        q: "You have three extraction tools: extract_invoice, extract_receipt and extract_contract. Document type is unknown in advance. Sometimes the model replies in plain text instead of calling a tool. Which tool_choice setting fixes this?",
        options: [
          "\"auto\", with the tools described clearly",
          "\"any\"",
          "Force {\"type\": \"tool\", \"name\": \"extract_invoice\"}",
          "Remove tool_choice and add 'always use a tool' to the prompt",
        ],
        answer: 1,
        why: [
          "\"auto\" lets the model return text instead of calling a tool, which is the current problem.",
          "Right. \"any\" guarantees a tool call while letting the model pick the right schema for the document.",
          "Forcing one tool would push receipts and contracts into the invoice schema.",
          "A prompt instruction is still probabilistic.",
        ],
      },
      {
        domain: "prompting", lesson: "4.3", scenario: "Structured data extraction",
        q: "Your pipeline must always run extract_metadata (document type, date, parties) before any enrichment tools, because enrichment depends on it. How do you guarantee it runs first?",
        options: [
          "Set tool_choice to \"any\" on the first request",
          "Force tool_choice {\"type\": \"tool\", \"name\": \"extract_metadata\"} on the first call",
          "List extract_metadata first in the tools array",
          "Tell the model in the system prompt to always call extract_metadata first, and add an example showing the correct order of tool calls",
        ],
        answer: 1,
        why: [
          "\"any\" requires a tool call but the model may pick an enrichment tool.",
          "Right. Forced tool selection guarantees that specific tool runs first.",
          "Tool order in the array doesn't control which one is chosen.",
          "Prompt-based ordering is probabilistic.",
        ],
      },
      {
        domain: "prompting", lesson: "4.3", scenario: "Structured data extraction",
        q: "Your schema's document_category is an enum: invoice, receipt, purchase_order. New document types like credit notes keep being forced into 'invoice', polluting reports. What is the best schema change?",
        options: [
          "Add every document type you can think of to the enum (credit notes, statements, quotes, delivery notes) so nothing has to be forced",
          "Add \"other\" with a detail field, plus \"unclear\"",
          "Change the field to free text with no enum",
          "Make document_category required",
        ],
        answer: 1,
        why: [
          "You'll never list every type, and the forcing problem returns with the next new one.",
          "Right. \"other\" + detail keeps categories extensible, and \"unclear\" stops ambiguous documents being forced into a wrong bucket.",
          "Loses consistent categories that downstream reports depend on.",
          "Required fields make forcing worse, not better.",
        ],
      },
      {
        domain: "context", lesson: "5.5", scenario: "Structured data extraction",
        q: "Reviewers can only check about 10% of extractions. Which documents should be routed to them first?",
        options: [
          "A simple random 10% of all documents, because random sampling gives an unbiased view of overall pipeline quality",
          "Extractions with low field-level confidence, calibrated on a labeled validation set, and documents whose sources are ambiguous or contradictory",
          "The longest documents",
          "Documents from the newest customers",
        ],
        answer: 1,
        why: [
          "Random sampling is useful for measuring error rates, but it wastes limited reviewer time on easy cases.",
          "Right. Calibrated confidence and conflicting sources are the best signals for where reviewer attention matters.",
          "Length isn't a reliable signal of error.",
          "Customer age isn't related to extraction accuracy.",
        ],
      },
      {
        domain: "context", lesson: "5.5", scenario: "Structured data extraction",
        q: "High-confidence extractions are now auto-approved without review. How can you keep measuring their real error rate and spot new kinds of mistakes?",
        options: [
          "Trust the confidence scores; that's why they were auto-approved",
          "Stratified random sampling of high-confidence extractions",
          "Wait for downstream teams to report errors",
          "Re-run every extraction a second time with a different prompt and send any disagreements between the two runs to human review",
        ],
        answer: 1,
        why: [
          "Confidence can drift, and new document patterns may be confidently wrong.",
          "Right. Stratified sampling measures error rates across segments and surfaces novel error patterns.",
          "Errors reach production before you know about them.",
          "Doubles cost, and a consistent mistake would be repeated both times.",
        ],
      },
    ],
  },
];

export const MOCKS = RAW_MOCKS.map((m) => ({
  ...m,
  questions: m.questions.map((q, i) => ({ ...q, id: `${m.id}-${String(i + 1).padStart(2, "0")}` })),
}));

export const MOCK_QUESTIONS = MOCKS.flatMap((m) => m.questions);
