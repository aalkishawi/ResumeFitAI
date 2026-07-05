// Prompt fragment: parse and analyze the resume.
export const RESUME_ANALYSIS_PROMPT = `## Task: Resume Analysis

Parse the resume into sections and analyze it against the JD. Return the
"resume" object:

- contact: the candidate's contact block as a single string (name, email,
  phone, location, links) exactly as found. Do not invent details.
- summary: the existing professional summary text, or "" if none exists.
- skills: array of skills currently listed.
- experience: array of strings, each summarizing one role (company, title,
  dates as written) plus its bullets.
- projects: array of project entries, or [].
- education: array of education entries.
- certifications: array of certifications the candidate actually holds.
- strengths: current strengths relative to the JD.
- missingKeywords: important JD keywords not represented in the resume.
- irrelevantContent: content that is not relevant to this JD and could be
  de-emphasized.
- vagueBullets: existing bullet points that are vague and should be strengthened
  (quote or paraphrase them).
- instructionAlignment: parts of the resume that align strongly with the user's
  instruction.`;
