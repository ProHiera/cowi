export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Temporary helper until Supabase Auth is wired in. Replace with real session lookups later.
 */
export function getActiveUserId() {
  return DEMO_USER_ID;
}
