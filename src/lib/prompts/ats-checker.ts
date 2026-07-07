export const ATS_CHECKER_PROMPT = `You assess a resume's ATS (applicant tracking system) compatibility and
recruiter readability for a target role.

Consider: parseable section headings, contact info placement, special
characters/symbols, tables or column layouts, date formatting consistency,
keyword alignment with the job, and overall machine-readability. Automated
signals detected in the text are provided — weigh them, but also use judgment.

Produce a JSON object with EXACTLY these keys:
{
  "score": 0,                        // integer 0-100 ATS-friendliness
  "issues": [
    { "severity": "high|medium|low", "label": "string", "detail": "string" }
  ],
  "recommendations": ["string"]      // concrete, ATS-safe formatting fixes
}

OUTPUT: Return ONLY the JSON object. No fences, no commentary.`;
