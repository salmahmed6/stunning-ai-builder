import OpenAI from "openai";
import type { Integration } from "./integrations";

/** Fallback if OPENAI_MODEL is not set. Cheap and fast, suitable for a demo. */
const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * Error type the API route knows how to translate into a safe HTTP response.
 * `message` is always user-facing and never contains keys, URLs or stack traces.
 */
export class AiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AiError";
    this.status = status;
  }
}

/**
 * ============================================================================
 * CORE REQUIREMENT — INTEGRATIONS ARE INJECTED INTO THE *SYSTEM* PROMPT
 * ============================================================================
 * The integrations the user ticked in the UI are interpolated into the system
 * message below. They are deliberately NOT appended to the user's own message:
 * they describe capabilities available to the assistant, which is context about
 * the assistant's role, not part of what the user asked for.
 *
 * Changing the selection therefore changes the system prompt, which changes the
 * model's answer.
 *
 * Exported so it can be inspected/tested independently of the network call.
 */
export function buildSystemPrompt(integrations: Integration[]): string {
  const integrationList =
    integrations.length > 0
      ? integrations.map((integration) => `- ${integration}`).join("\n")
      : "- (none selected)";

  return `You are Stunning, an AI product architect.

Your job is to help users turn product ideas into practical technical blueprints.

The user has selected the following integrations:

${integrationList}

These integrations are available as contextual capabilities for the proposed product.
Use them meaningfully when relevant. If no integrations were selected, do not invent any.

For each requested product, provide:
1. Product overview
2. Core features
3. Suggested architecture
4. Recommended technology choices
5. How the selected integrations could be used
6. Important implementation considerations

Do not pretend that these integrations are already connected.
They are contextual selections only.

Format the answer as Markdown using "##" headings for each of the six sections.
Keep the answer practical and concise.`;
}

type GenerateArgs = {
  prompt: string;
  integrations: Integration[];
};

/**
 * Sends the blueprint request to OpenAI. Runs on the server only, so the API key
 * never reaches the browser.
 */
export async function generateBlueprint({
  prompt,
  integrations,
}: GenerateArgs): Promise<{ blueprint: string; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new AiError(
      "The AI service is not configured yet. Add OPENAI_API_KEY to .env.local and restart the server.",
      503,
    );
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  // Created per request (not at module load) so a missing key never breaks the build.
  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      max_tokens: 1600,
      messages: [
        // The selected integrations live here, in the SYSTEM message.
        { role: "system", content: buildSystemPrompt(integrations) },
        // The user's own words are passed through untouched.
        { role: "user", content: prompt },
      ],
    });

    const blueprint = completion.choices[0]?.message?.content?.trim();

    if (!blueprint) {
      throw new AiError(
        "The AI returned an empty blueprint. Try rephrasing your idea.",
        502,
      );
    }

    return { blueprint, model };
  } catch (error) {
    if (error instanceof AiError) throw error;

    // Log the real cause for the operator; return something safe to the user.
    console.error("[stunning] OpenAI request failed:", error);

    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new AiError(
          "The AI service rejected our credentials. Check the configured API key.",
          502,
        );
      }
      if (error.status === 429) {
        throw new AiError(
          "The AI service is rate limited or out of quota right now. Try again in a moment.",
          429,
        );
      }
    }

    throw new AiError(
      "We could not reach the AI service. Please try again.",
      502,
    );
  }
}
