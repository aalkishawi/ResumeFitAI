// Prompt fragment: validation layer comparing tailored output to the original.
export const TRUTHFULNESS_VALIDATION_PROMPT = `## Task: Truthfulness Validation

Act as a strict fact-checker. Compare EVERY claim in the tailored resume you
just produced against the ORIGINAL resume. Return "unsupportedClaims": an array
of { claim, reason, ethicalAlternative } for anything that is not clearly
grounded in the original resume — new tools, new metrics, inflated titles,
implied certifications, etc.

- If the tailored resume is fully supported, return an empty array.
- Prefer to FIX issues before they reach the tailored resume; only list a claim
  here if you intentionally kept borderline phrasing the user should review.
- ethicalAlternative: a truthful way to express the intent without fabrication.

This validation is the final authority. Never let an unsupported claim remain in
"tailoredResume"; move it here instead and phrase the resume truthfully.`;
