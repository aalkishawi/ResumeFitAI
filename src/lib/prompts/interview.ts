// Prompt fragment: interview talking points + the estimated "after" score.
export const INTERVIEW_PROMPT = `## Task: Interview Talking Points & Post-Tailoring Score

Return "interviewTalkingPoints": an array of { topic, point, sampleQuestion }
grounded in the tailored resume and the JD. Each should help the candidate
connect their REAL experience to what the role needs. 4-7 items.

Return "scoreAfter": the estimated match score AFTER tailoring, using the same
shape and fields as scoreBefore (overall, skills, experience, tools,
keywordAlignment, seniorityAlignment, explanation, wellRepresented,
missingKeywords, underusedKeywords, instructionImpact). The improvement should
reflect ONLY better presentation of existing content — not fabricated
qualifications — so remaining genuine gaps should keep the score realistic.`;
