// CCAR-F study notes, one lesson per domain.
// Text in `backticks` renders as code. Facts reflect the Claude API as of November 2026.

export const STUDY_GUIDE = {
  models: {
    summary: "Know which model fits which job, what each one can take in and put out, and how to look these facts up instead of memorising them.",
    objectives: [
      "Pick a model tier from task difficulty, volume, latency and cost",
      "State context window and output limits for current models",
      "Send images and PDFs correctly and know the size limits",
      "Explain adaptive thinking and the effort setting",
      "Look up model capabilities at runtime with the Models API",
    ],
    table: {
      caption: "Current Claude models (Anthropic API list prices per million tokens)",
      head: ["Model", "Model ID", "Context", "Input / Output", "Best for"],
      rows: [
        ["Claude Haiku 5.5", "`claude-haiku-5-5`", "1M", "$0.10 / $0.50*", "High-volume, latency-sensitive work: classification, extraction, routing, sub-agents"],
        ["Claude Sonnet 5.5", "`claude-sonnet-5-5`", "1M", "$2 / $10", "Everyday coding, agents and enterprise workloads at speed"],
        ["Claude Opus 5.5", "`claude-opus-5-5`", "1M", "$4 / $20", "Complex reasoning, long-horizon agents, hard coding (the default choice for demanding work)"],
        ["Claude Fable 5.1", "`claude-fable-5-1`", "1M", "$10 / $50", "The most demanding reasoning and long agentic tasks; most capable widely released model"],
        ["Claude Haiku 4.5 (older)", "`claude-haiku-4-5`", "200K", "$1 / $5", "Legacy workloads; note the smaller context window"],
      ],
      note: "*Haiku 5.5 price applies to prompts up to 100K tokens ($0.50 / $2.50 beyond). Opus 5.5, Sonnet 5.5 and Fable 5.1 support up to 128K output tokens. Prices on Amazon Bedrock and Vertex AI are set by those platforms.",
    },
    sections: [
      {
        title: "Choosing a tier",
        points: [
          "Start with the smallest model that meets the quality bar, measured on your own eval set. Don't assume the biggest model is needed.",
          "Haiku fits short, well-specified, high-volume tasks. Sonnet balances speed and capability. Opus handles complex reasoning and long agent runs. Fable is for the hardest problems where cost matters less than capability.",
          "Before building a multi-model cascade, test the stronger model at a lower effort level. One model also means one prompt cache, because caches are per model.",
          "Judge cost per completed task, not per request. A cheap call that needs retries or extra turns may cost more overall.",
        ],
      },
      {
        title: "Context windows and output limits",
        points: [
          "The context window is the total tokens the model can read in one request: system prompt, tools, conversation history and documents.",
          "`max_tokens` caps the output only. Raising it does not enlarge the context window.",
          "Current models have 1M-token windows; Haiku 4.5 has 200K. Don't hard-code either: call the Models API (`GET /v1/models/{id}`) and read `max_input_tokens` and `max_tokens`.",
          "Use `POST /v1/messages/count_tokens` to measure a prompt before sending it.",
        ],
      },
      {
        title: "Vision and documents",
        points: [
          "Images go in `image` content blocks (base64, URL or a Files API `file_id`). PDFs go in `document` blocks.",
          "Put images and documents before the text instructions in the same user turn.",
          "PDF limits: 32 MB per request and 600 pages (100 pages on 200K-context models).",
          "The Files API lets you upload once and reference a file by `file_id` across many requests.",
          "Turn on `citations` on document blocks to get answers that point back to the exact passage or page.",
        ],
      },
      {
        title: "Thinking and effort",
        points: [
          "Current models use adaptive thinking: the model decides when and how much to reason. Set `thinking: {type: \"adaptive\"}` or leave it out.",
          "Control depth and token spend with `output_config.effort`: `low`, `medium`, `high`, `xhigh`, `max`.",
          "Default effort is `medium` on Opus 5.5 and Haiku 5.5, and `high` on most other models. Set it explicitly after a migration.",
          "`budget_tokens` (the old fixed thinking budget) is rejected on current models. On Opus 5.5 and Fable 5.1, thinking cannot be turned off; lower effort instead.",
          "By default the thinking text is omitted from responses. Use `display: \"summarized\"` to show a readable summary.",
        ],
      },
    ],
    traps: [
      "Thinking a bigger `max_tokens` gives the model more context to read.",
      "Hard-coding one context size for every model.",
      "Sending a scanned PDF through OCR first, losing layout and images.",
      "Forgetting that a migration can change defaults such as effort.",
    ],
  },

  prompting: {
    summary: "Write prompts that are clear, structured and easy for Claude to follow, and enforce output formats with the API rather than with hope.",
    objectives: [
      "Structure prompts with XML tags and refer to them by name",
      "Use the system prompt for roles and persistent rules",
      "Lay out long-context prompts so answers stay grounded",
      "Get reliable JSON with structured outputs",
      "Know when manual chain-of-thought is no longer needed",
    ],
    sections: [
      {
        title: "Be clear and direct",
        points: [
          "Explain the task, the audience, what a good result looks like and why. Context about the goal often beats long lists of rules.",
          "Give instructions as numbered steps when order matters.",
          "Say what to do, not just what to avoid. 'Write in plain prose paragraphs' works better than 'don't use markdown'.",
          "Prompts written for older models are often too prescriptive. Heavy emphasis (ALL CAPS, 'CRITICAL') can make current models over-apply a rule.",
        ],
      },
      {
        title: "Structure with XML tags",
        points: [
          "Wrap each input in its own descriptive tag, such as `<contract>`, `<policy>` and `<question>`.",
          "Refer to tags in your instructions: 'Quote only from the text in <contract>'.",
          "Nest tags for hierarchy, and ask for output in tags (for example `<summary>`) when you need to extract part of a response.",
        ],
      },
      {
        title: "Examples (multishot prompting)",
        points: [
          "Three to five varied examples show format and tone better than a description.",
          "Wrap them in `<example>` tags so Claude treats them as samples, not as the input to process.",
          "Make examples diverse, so Claude doesn't copy one example's quirks.",
        ],
      },
      {
        title: "Roles and the system prompt",
        points: [
          "Put role, tone and persistent rules in the top-level `system` parameter.",
          "A specific role ('a senior securities lawyer reviewing an M&A contract') improves domain focus more than a generic one.",
          "To add operator instructions mid-conversation without breaking the prompt cache, current models accept a `{role: \"system\"}` message in the `messages` array.",
        ],
      },
      {
        title: "Long-context prompting",
        points: [
          "Put long documents near the top, each in its own tags with metadata such as source and date.",
          "Put the instructions and the question at the end. This ordering gives better answers on long inputs.",
          "Ask Claude to quote the relevant passages first, then answer from those quotes.",
        ],
      },
      {
        title: "Output formats",
        points: [
          "For machine-readable output, use structured outputs: `output_config: {format: {...}}` with a JSON schema, or `messages.parse()` in the SDK.",
          "Assistant prefill (starting Claude's reply for it) returns a 400 error on current models. Structured outputs replace the old '{' prefill trick.",
          "The older `output_format` parameter is deprecated in favour of `output_config.format`.",
        ],
      },
      {
        title: "Reasoning and chaining",
        points: [
          "Current models think internally with adaptive thinking. Remove old 'think step by step in <thinking> tags' scaffolding and tune `effort` instead.",
          "Break complex jobs into a chain of focused prompts, passing each output to the next step. Each step is easier to test and debug.",
          "To reduce hallucinations, allow Claude to say it doesn't know, ground answers in quotes or citations, and verify claims against sources.",
        ],
      },
    ],
    traps: [
      "Putting the question before a 300-page document.",
      "Using prefill to force JSON on a current model.",
      "Typing 'SYSTEM:' into a user message and expecting it to act as a system prompt.",
      "Keeping manual chain-of-thought instructions after moving to an adaptive-thinking model.",
    ],
  },

  tools: {
    summary: "Design tools Claude can choose correctly, run the tool loop properly, and handle errors and parallel calls the way the API expects.",
    objectives: [
      "Write tool definitions with strong descriptions and typed schemas",
      "Run the request, tool_use, tool_result loop",
      "Return parallel results and errors correctly",
      "Choose a tool_choice setting that the model supports",
      "Tell client tools, server tools and MCP apart",
    ],
    sections: [
      {
        title: "Defining a tool",
        points: [
          "A tool has a `name`, a `description` and an `input_schema` (JSON Schema).",
          "The description matters most: say what the tool does, what it returns, when to use it, when not to, and any limits. Aim for several sentences.",
          "Use typed, described parameters with `required` fields rather than one free-text 'query' string.",
          "Set `strict: true` on the tool (with `additionalProperties: false` and `required`) to guarantee inputs match the schema.",
          "Parse tool inputs with a JSON parser, never by string matching, since escaping can vary by model.",
        ],
      },
      {
        title: "The tool loop",
        points: [
          "1) Send the request with `tools`. 2) If `stop_reason` is `tool_use`, run each requested tool. 3) Send back a user message of `tool_result` blocks, each with the matching `tool_use_id`. 4) Repeat until `stop_reason` is `end_turn`.",
          "Append the full assistant `content` to the history each turn, not just its text.",
          "The SDK Tool Runner (`client.beta.messages.tool_runner`) runs this loop for tools you define, with hooks for approvals and logging.",
        ],
      },
      {
        title: "Parallel calls and errors",
        points: [
          "Claude may request several tools in one response. Run them (concurrently if you can) and return all the results in a single user message.",
          "Splitting parallel results across messages discourages Claude from making parallel calls.",
          "Every `tool_use` must get a `tool_result`. For a failure, return `is_error: true` with a specific message, such as 'Partner API timed out after 10s; safe to retry'.",
          "Never return invented success data for a failed call.",
        ],
      },
      {
        title: "tool_choice",
        points: [
          "`auto` (default): Claude decides. `none`: no tools. `any` and `tool`: force a call.",
          "Forced `any` and `tool` return a 400 on Claude Fable 5.1, Opus 5.5 and Sonnet 5.5. Use `auto` plus a clear instruction and `strict: true`, or structured outputs if the call only existed to get JSON.",
          "`disable_parallel_tool_use` still works with `auto` to allow at most one call.",
        ],
      },
      {
        title: "Server tools, MCP and large toolsets",
        points: [
          "Server tools (web search, web fetch, code execution) run on Anthropic's infrastructure; their results arrive in the same response. A long run can end with `stop_reason: pause_turn`, which you continue by resending.",
          "Client tools run in your code; you execute them and send results back.",
          "The MCP connector needs both `mcp_servers` and a matching `mcp_toolset` entry in `tools`.",
          "For very large toolsets, mark tools `defer_loading: true` and add a tool-search tool so Claude loads only what it needs.",
        ],
      },
    ],
    traps: [
      "A one-line tool description such as 'Gets data.'",
      "Sending parallel tool results in separate messages.",
      "Dropping the tool_result for a failed call.",
      "Switching from `tool` to `any` to dodge a 400 (both are rejected on the same models).",
    ],
  },

  api: {
    summary: "Know the Messages API request shape, the parameters that control output, how responses end, and when to stream or batch.",
    objectives: [
      "Build a valid Messages API request",
      "Read every stop_reason and handle it",
      "Explain what replaced temperature, top_p and top_k",
      "Decide when to stream and when to use batches",
      "Handle rate limits and errors",
    ],
    table: {
      caption: "stop_reason values",
      head: ["Value", "Meaning", "What to do"],
      rows: [
        ["`end_turn`", "Claude finished naturally", "Use the response"],
        ["`max_tokens`", "Hit the output cap", "Raise `max_tokens` or continue; the output may be cut mid-sentence"],
        ["`stop_sequence`", "Hit one of your `stop_sequences`", "Check `stop_sequence` to see which one"],
        ["`tool_use`", "Claude wants to call a tool", "Run it and return a `tool_result`"],
        ["`pause_turn`", "A long server-tool turn paused", "Send the response back to continue"],
        ["`refusal`", "A safety classifier declined", "Read `stop_details` (category, explanation) and handle it"],
      ],
    },
    sections: [
      {
        title: "Request shape",
        points: [
          "`POST /v1/messages` with `model`, `max_tokens` and `messages`. Optional: `system`, `tools`, `tool_choice`, `stop_sequences`, `metadata`, `output_config`, `thinking`.",
          "`messages` alternate user and assistant turns and start with a user turn. Content can be a string or a list of blocks (text, image, document, tool_use, tool_result).",
          "The API is stateless: send the full conversation history each time (or use features such as caching to make that cheap).",
          "`usage` in the response reports input, output and cache tokens.",
        ],
      },
      {
        title: "Sampling parameters and effort",
        points: [
          "Classic meaning, still worth knowing: `temperature` sets randomness (low for analysis, higher for creative work); `top_p` samples from the smallest set of tokens covering probability p; `top_k` samples from the k most likely tokens.",
          "On current models these are removed and return a 400. From API version 2026-10-21, sending them is rejected on every model.",
          "Consistency now comes from clear prompts and structured outputs; depth and cost from `output_config.effort`.",
        ],
      },
      {
        title: "Streaming",
        points: [
          "Set `stream: true` (or use the SDK's `messages.stream`) to receive server-sent events: `message_start`, `content_block_start`, `content_block_delta`, `content_block_stop`, `message_delta`, `message_stop`.",
          "Stream when outputs are long or `max_tokens` is high, to avoid HTTP timeouts. The SDKs require streaming for very large `max_tokens`.",
          "Use the SDK's final-message helper (`finalMessage()` / `get_final_message()`) when you only need the complete response.",
          "Streaming also improves perceived latency in chat UIs.",
        ],
      },
      {
        title: "Batches and other endpoints",
        points: [
          "Message Batches process requests asynchronously at about 50% of the standard price. Poll until processing ends, then match results by `custom_id`, because order is not guaranteed.",
          "Each batch result is `succeeded`, `errored`, `canceled` or `expired`.",
          "Fast mode (research preview, some Opus models) raises output speed at premium pricing; it does not reduce cost.",
        ],
      },
      {
        title: "Errors and limits",
        points: [
          "400 means an invalid request (fix it, don't retry). 401/403 are auth problems. 429 is a rate limit: back off and honour `retry-after`. 529 means overloaded; 5xx errors are worth retrying.",
          "The official SDKs retry 408, 409, 429 and 5xx errors twice by default with backoff.",
          "Catch specific error types, so retryable and non-retryable failures are handled differently.",
        ],
      },
    ],
    traps: [
      "Reading `content[0].text` without checking `stop_reason` first.",
      "Copying old code that sets `temperature` onto a current model.",
      "Assuming batch results come back in request order.",
      "Making very long requests without streaming.",
    ],
  },

  architecture: {
    summary: "Pick the simplest architecture that works, ground answers in your data, and keep long-running systems fast and affordable.",
    objectives: [
      "Choose between a single call, a workflow and an agent",
      "Design a RAG pipeline with citations",
      "Make prompt caching actually hit",
      "Manage context in long-running agents",
      "Place guardrails and human checkpoints",
    ],
    sections: [
      {
        title: "Single call, workflow or agent",
        points: [
          "Single call: classification, summarisation, extraction, Q&A.",
          "Workflow: fixed, known steps orchestrated by your code (prompt chaining, routing, parallel sections, evaluator loops).",
          "Agent: open-ended tasks where the model decides its own steps with tools. Use one only when the task is complex, valuable, within Claude's ability, and errors can be caught.",
          "Start simple and add complexity only when measurements show it helps.",
          "Managed Agents runs the agent loop and hosts a sandbox for you; the API with tool use lets you host everything yourself.",
        ],
      },
      {
        title: "Retrieval-augmented generation (RAG)",
        points: [
          "Use RAG for large or frequently changing knowledge that needs sources. Fine-tuning suits style and behaviour better than changing facts.",
          "Pipeline: chunk documents, embed and index them, retrieve the top passages per query, optionally rerank, then pass them to Claude.",
          "Contextual retrieval (adding a short context line to each chunk before embedding) improves retrieval accuracy.",
          "Pass retrieved passages as `document` blocks with `citations` enabled, and tell Claude to answer only from them and say when the answer isn't there.",
          "With 1M-token windows, small corpora can simply be placed in context, ideally with caching.",
        ],
      },
      {
        title: "Prompt caching",
        points: [
          "Caching matches an exact prefix, in the order tools, then system, then messages. Any change invalidates everything after it.",
          "Put stable content (tool definitions, system prompt, reference documents) first, and volatile content (timestamps, user questions) after the last `cache_control` breakpoint.",
          "Up to 4 breakpoints per request. There is a minimum cacheable size, so very short prefixes won't cache.",
          "Check `usage.cache_read_input_tokens`. If it stays at 0, something in the prefix is changing, such as a timestamp, unsorted JSON or a varying tool list.",
          "Caches are per model, so switching models mid-conversation loses the cache.",
        ],
      },
      {
        title: "Context management for long runs",
        points: [
          "Context editing clears old tool results or thinking blocks before the model sees them.",
          "Server-side compaction (beta) summarises earlier history as the window fills. Append the full `response.content`, including compaction blocks, back into messages each turn.",
          "The memory tool lets an agent save and read notes outside the context window across sessions.",
          "Never delete messages at random: it can break tool_use and tool_result pairs.",
        ],
      },
      {
        title: "Guardrails and reliability",
        points: [
          "Validate inputs and outputs in code; use structured outputs for anything a program will parse.",
          "Put irreversible or high-value actions behind human approval or hard limits enforced in code.",
          "Build an eval set from real cases before changing prompts or models, and measure every change against it.",
          "Plan for refusals, rate limits and timeouts with fallbacks and retries.",
        ],
      },
    ],
    traps: [
      "Building an autonomous agent for a fixed three-step process.",
      "Putting a timestamp at the start of a cached system prompt.",
      "Fine-tuning weekly to keep facts current.",
      "Giving one model call write access to a system of record with no checkpoint.",
    ],
  },

  safety: {
    summary: "Understand how Claude is trained to be safe, handle refusals in production, defend against prompt injection, and meet data-governance requirements.",
    objectives: [
      "Explain Constitutional AI in plain terms",
      "Handle the refusal stop reason and fallbacks",
      "Design layered defences against prompt injection",
      "Check data-retention eligibility per model and feature",
      "Keep humans in the loop for high-impact actions",
    ],
    sections: [
      {
        title: "Constitutional AI",
        points: [
          "A training method in which the model learns from an explicit set of written principles, using AI feedback to critique and revise its own outputs.",
          "It aims for a model that is helpful, honest and harmless, with less reliance on humans labelling harmful content.",
          "It shapes behaviour during training. It is not a runtime filter or an API flag.",
        ],
      },
      {
        title: "Refusals in production",
        points: [
          "A refusal arrives as HTTP 200 with `stop_reason: \"refusal\"`. Always check `stop_reason` before reading `content`.",
          "`stop_details` (only present on refusals) gives a `category`, such as `cyber` or `bio`, and an `explanation`.",
          "Current Opus, Sonnet and Fable models support server-side `fallbacks`, which reroute a refused request by category. Use them or show the user a clear message.",
          "Retrying the identical request usually repeats the refusal.",
        ],
      },
      {
        title: "Prompt injection and jailbreaks",
        points: [
          "Treat emails, web pages, documents and tool results as untrusted data, never as instructions.",
          "Keep operator instructions in the system prompt (or mid-conversation system messages), separate from user and tool content.",
          "Apply least privilege: give an agent only the tools and permissions it needs.",
          "Put irreversible or financial actions behind human approval or limits in code, which no prompt can override.",
          "Add input screening (a lightweight model can classify risky inputs) and monitor outputs.",
        ],
      },
      {
        title: "Data privacy and governance",
        points: [
          "Zero data retention (ZDR) eligibility varies by model and feature; check it before designing.",
          "Claude Fable 5.1 requires 30-day data retention unless Anthropic expressly authorises otherwise, so ZDR organisations get a 400.",
          "Some beta features are not ZDR-eligible.",
          "`inference_geo` (for example `\"us\"`) controls where inference runs on supported models.",
          "Prompt text cannot change data handling. Retention is set by account terms and configuration.",
        ],
      },
      {
        title: "Responsible deployment",
        points: [
          "Follow Anthropic's usage policies, and disclose AI involvement where users would expect to know.",
          "Red-team the system and keep evaluating it after launch.",
          "Log decisions and keep a human review path for high-impact outcomes such as credit, hiring or healthcare.",
          "Reduce hallucinations with grounding, citations and permission to say 'I don't know'.",
        ],
      },
    ],
    traps: [
      "Calling Constitutional AI a keyword filter.",
      "Treating every HTTP 200 as a usable answer.",
      "Relying on a 'never be tricked' line in the prompt as the only injection defence.",
      "Assuming ZDR covers every model automatically.",
    ],
  },
};

export const EXAM_TIPS = [
  "Read the last sentence of the scenario first so you know what it is asking: the best fix, the first thing to check, or the most important control.",
  "Look for the constraint that decides the answer, such as cost, latency, accuracy, safety or a fixed process.",
  "Prefer the simplest option that fully meets the requirement. Exams reward 'measure first' and 'least complex' answers.",
  "Eliminate options that break an API rule, such as prefill, forced tool_choice on current models, or dropping a tool_result.",
  "Be wary of options that rely only on prompt wording for security or data handling.",
];
