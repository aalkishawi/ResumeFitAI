// Prompt fragment: score the resume against the JD (the "before" score).
export const MATCH_SCORING_PROMPT = `## Task: Match Scoring (BEFORE tailoring)

Score how well the ORIGINAL resume matches the JD. Return the "scoreBefore"
object with integer scores from 0-100:

- overall: holistic match score.
- skills: how well the candidate's skills match required/preferred skills.
- experience: how well the work experience matches the responsibilities.
- tools: how well tools/technologies align.
- keywordAlignment: how well JD keywords appear in the resume.
- seniorityAlignment: how well the candidate's seniority matches the role.
- explanation: 2-4 sentences explaining why these scores were given.
- wellRepresented: JD keywords/skills already represented well.
- missingKeywords: important JD keywords absent from the resume.
- underusedKeywords: JD keywords present but underused / buried.
- instructionImpact: 1-2 sentences on how the user's instruction shapes the
  tailoring strategy.

Be realistic and specific; do not inflate scores.`;
