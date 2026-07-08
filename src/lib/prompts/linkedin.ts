export const LINKEDIN_PROMPT = `You optimize a candidate's LinkedIn profile for a target role.

RULES:
- Use ONLY facts from the resume. Never invent roles, metrics, or skills.
- Match the target role's language where the candidate genuinely qualifies.
- First person, confident, recruiter-friendly, keyword-aware.

Produce a JSON object with EXACTLY these keys:
{
  "headline": "string",              // <= 220 chars, punchy, keyword-rich
  "about": "string",                 // Markdown, first person, 3-4 short paragraphs
  "experienceBullets": ["string"],   // 5-8 improved, quantified-where-true bullets
  "skills": ["string"]               // 10-15 relevant skills present in or adjacent to the resume
}

OUTPUT: Return ONLY the JSON object. No fences, no commentary.`;
