// Prompt fragment: analyze the user's chat-style instruction.
export const INSTRUCTION_ANALYSIS_PROMPT = `## Task: User Instruction Analysis

Read the user's free-form instruction (it may be empty). Interpret it together
with the resume and job description. Detect the following and return them in the
"instruction" object:

- tone: the requested writing tone (e.g. "executive", "professional but simple",
  "confident"). Use "professional (default)" if none is stated.
- length: requested length such as "one-page", "two-page", "concise", or
  "unspecified".
- seniority: target seniority implied by the instruction (e.g. "executive",
  "senior", "mid-level"), or "unspecified".
- targetRole: a specific role the user asked to tailor for (e.g. "CIO"), or "".
- emphasis: array of areas to emphasize (e.g. ["AI", "digital transformation",
  "project management"]).
- outputFormat: one of "docx", "pdf", "both", "text", "markdown", or
  "unspecified" based on any format request ("Word document" => "docx").
- interpretation: one or two sentences restating what the user wants in plain
  language.
- conflicts: array of any parts of the instruction that would require
  fabrication or otherwise conflict with the truthfulness guardrails. Empty
  array if none.`;
