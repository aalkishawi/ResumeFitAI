// ---------------------------------------------------------------------------
// Prompt version. Bump this whenever a prompt changes in a way that should
// invalidate cached AI results. The response cache key includes this number,
// so incrementing it makes every prior cache entry a miss (no stale outputs).
// ---------------------------------------------------------------------------

export const PROMPT_VERSION = 2;
