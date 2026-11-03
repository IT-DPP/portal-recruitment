/**
 * Feature Flag utilities for controlling public-facing modules
 * across Local Development, Staging, and Production environments.
 *
 * By default (when env vars are unset in local dev), flags are enabled (`true`)
 * so local development and testing remain unobstructed.
 * In Staging/Production, set `FEATURE_CANDIDATE_PORTAL=false` and `FEATURE_PUBLIC_JOBS=false`
 * to hide public candidate features until security hardening is fully signed off.
 */

function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "false" || normalized === "0" || normalized === "off" || normalized === "no") {
    return false;
  }
  if (normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes") {
    return true;
  }
  return defaultValue;
}

export function isCandidatePortalEnabled(): boolean {
  return parseBooleanFlag(process.env.FEATURE_CANDIDATE_PORTAL, true);
}

export function isPublicJobsEnabled(): boolean {
  return parseBooleanFlag(process.env.FEATURE_PUBLIC_JOBS, true);
}

