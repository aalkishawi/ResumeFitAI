// Prompt fragment: analyze the job description.
export const JD_ANALYSIS_PROMPT = `## Task: Job Description Analysis

Analyze the job description and return the "jd" object:

- jobTitle: the exact job title.
- seniority: seniority level (e.g. "Senior", "Director", "Executive").
- requiredSkills: skills explicitly required.
- preferredSkills: skills that are preferred / nice-to-have.
- tools: concrete tools, technologies, platforms, and languages named.
- methodologies: methodologies/frameworks (e.g. Agile, Scrum, ITIL, Six Sigma).
- certifications: certifications or licenses mentioned.
- responsibilities: the key responsibilities of the role.
- domainKeywords: domain/industry keywords (e.g. "cybersecurity", "fintech").
- highPriorityKeywords: keywords that are repeated or clearly emphasized as
  most important for passing ATS and recruiter screening.
- qualificationThemes: the 3-6 most important qualification themes the ideal
  candidate must demonstrate.`;
