import { NextResponse } from "next/server";
import { AiError, generateBlueprint } from "@/lib/ai";
import {
  isIntegration,
  MAX_PROMPT_LENGTH,
  type GenerateFailure,
  type GenerateSuccess,
  type Integration,
} from "@/lib/integrations";

type ValidatedRequest = {
  prompt: string;
  integrations: Integration[];
};

/** Narrow an unknown JSON body into a trusted shape, or explain what's wrong. */
function validate(
  body: unknown,
): { ok: true; data: ValidatedRequest } | { ok: false; message: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body must be a JSON object." };
  }

  const { prompt, integrations } = body as Record<string, unknown>;

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return { ok: false, message: "Describe what you want to build first." };
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return {
      ok: false,
      message: `Keep your description under ${MAX_PROMPT_LENGTH} characters.`,
    };
  }

  // Integrations are optional: zero or more is valid.
  const rawIntegrations = integrations ?? [];

  if (!Array.isArray(rawIntegrations)) {
    return { ok: false, message: "Integrations must be a list." };
  }

  if (!rawIntegrations.every(isIntegration)) {
    return { ok: false, message: "One of the selected integrations is not supported." };
  }

  // De-duplicate so a repeated value cannot bloat the system prompt.
  const unique = [...new Set(rawIntegrations)];

  return { ok: true, data: { prompt: prompt.trim(), integrations: unique } };
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<GenerateFailure>(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const result = validate(body);

  if (!result.ok) {
    return NextResponse.json<GenerateFailure>(
      { error: result.message },
      { status: 400 },
    );
  }

  const { prompt, integrations } = result.data;

  try {
    const { blueprint, model } = await generateBlueprint({ prompt, integrations });

    return NextResponse.json<GenerateSuccess>({ blueprint, model, integrations });
  } catch (error) {
    if (error instanceof AiError) {
      return NextResponse.json<GenerateFailure>(
        { error: error.message },
        { status: error.status },
      );
    }

    // Anything unexpected stays on the server; the client gets a generic message.
    console.error("[stunning] Unexpected error in /api/generate:", error);

    return NextResponse.json<GenerateFailure>(
      { error: "Something went wrong on our side. Please try again." },
      { status: 500 },
    );
  }
}
