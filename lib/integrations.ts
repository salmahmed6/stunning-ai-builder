/**
 * Single source of truth for the dummy integrations.
 *
 * These are NOT real connections to Stripe/Shopify/Gmail/Slack/Google Sheets.
 * They are contextual selections that get injected into the AI system prompt.
 *
 * Shared by the client (to render the selector) and the server (to validate input),
 * so the two can never drift apart.
 */
export const INTEGRATIONS = [
  "Stripe",
  "Shopify",
  "Gmail",
  "Slack",
  "Google Sheets",
] as const;

export type Integration = (typeof INTEGRATIONS)[number];

/** Keeps request bodies (and token spend) bounded. */
export const MAX_PROMPT_LENGTH = 2000;

export function isIntegration(value: unknown): value is Integration {
  return (
    typeof value === "string" &&
    (INTEGRATIONS as readonly string[]).includes(value)
  );
}

/** Response shape returned by POST /api/generate on success. */
export type GenerateSuccess = {
  blueprint: string;
  model: string;
  integrations: Integration[];
};

/** Response shape returned by POST /api/generate on failure. */
export type GenerateFailure = {
  error: string;
};
