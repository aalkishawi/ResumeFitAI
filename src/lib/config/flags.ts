// ---------------------------------------------------------------------------
// Feature flags. Toggle commercialization surfaces without code changes. All
// read from env; sensible defaults keep the app fully usable out of the box.
// ---------------------------------------------------------------------------

function on(key: string, def: boolean): boolean {
  const v = process.env[key];
  if (v === undefined || v.trim() === "") return def;
  return v !== "false" && v !== "0";
}

export const featureFlags = {
  freePlan: on("FREE_PLAN_ENABLED", true),
  credits: on("CREDIT_SYSTEM_ENABLED", true),
  subscriptions: on("SUBSCRIPTION_SYSTEM_ENABLED", true),
  teamPlan: on("TEAM_PLAN_ENABLED", true),
  whiteLabel: on("WHITE_LABEL_ENABLED", false),
};

export type FeatureFlags = typeof featureFlags;

/**
 * Test-mode self-upgrade (no payment) for local/dev testing. On by default
 * outside production; set ENABLE_TEST_UPGRADE=false to disable, or =true to
 * allow it in production (not recommended).
 */
export const testUpgradeEnabled =
  process.env.NODE_ENV !== "production"
    ? process.env.ENABLE_TEST_UPGRADE !== "false"
    : process.env.ENABLE_TEST_UPGRADE === "true";
