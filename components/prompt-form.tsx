"use client";

import { useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { AiResponse } from "@/components/ai-response";
import { IntegrationSelector } from "@/components/integration-selector";
import {
  MAX_PROMPT_LENGTH,
  type GenerateSuccess,
  type Integration,
} from "@/lib/integrations";

type Result = GenerateSuccess & { generatedAt: Date };

/**
 * Owns the whole generate flow: prompt text, selected integrations, the request
 * itself, and whatever comes back (a blueprint or a friendly error).
 */
export function PromptForm() {
  const [prompt, setPrompt] = useState("");
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const trimmedPrompt = prompt.trim();
  const isEmpty = trimmedPrompt.length === 0;
  const isTooLong = prompt.length > MAX_PROMPT_LENGTH;
  const canSubmit = !isEmpty && !isTooLong && !isLoading;

  function toggleIntegration(integration: Integration) {
    setIntegrations((current) =>
      current.includes(integration)
        ? current.filter((item) => item !== integration)
        : [...current, integration],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Guard against duplicate submissions (double click, Enter while pending).
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmedPrompt, integrations }),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data &&
          typeof data === "object" &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "We could not generate a blueprint. Please try again.";

        setError(message);
        setResult(null);
        return;
      }

      setResult({ ...(data as GenerateSuccess), generatedAt: new Date() });

      // Bring the fresh sheet into view once it has rendered.
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      setError(
        "We could not reach the server. Check your connection and try again.",
      );
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <div className="sheet border-rule bg-sheet border p-4 shadow-sm sm:p-6">
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor="prompt" className="annotation text-ink-soft">
              Sheet 01 <span className="text-rule">/</span> the brief
            </label>
            <span
              className={[
                "font-mono text-xs tabular-nums",
                isTooLong ? "text-redline" : "text-ink-soft/70",
              ].join(" ")}
            >
              {prompt.length}/{MAX_PROMPT_LENGTH}
            </span>
          </div>

          <textarea
            id="prompt"
            name="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            maxLength={MAX_PROMPT_LENGTH}
            rows={6}
            required
            disabled={isLoading}
            aria-describedby="prompt-hint"
            placeholder="Describe what you want to build..."
            className="border-rule bg-paper/40 text-ink placeholder:text-ink-soft/60 focus:border-blueprint mt-3 w-full resize-y rounded-md border px-4 py-3 text-[0.9375rem] leading-relaxed transition outline-none disabled:opacity-60"
          />

          <p id="prompt-hint" className="text-ink-soft/80 mt-2 text-xs">
            The more context you give — users, scale, constraints — the sharper
            the blueprint.
          </p>

          <div className="border-rule mt-6 border-t pt-6">
            <IntegrationSelector
              selected={integrations}
              onToggle={toggleIntegration}
              disabled={isLoading}
            />
            <p className="text-ink-soft/80 mt-3 text-xs">
              Selected tools are passed to the AI as context. Nothing is
              connected to a real account.
            </p>
          </div>

          <div className="border-rule mt-6 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="annotation text-ink-soft/80" aria-live="polite">
              {integrations.length === 0
                ? "No tools selected"
                : `${integrations.length} tool${
                    integrations.length === 1 ? "" : "s"
                  } selected`}
            </p>

            <button
              type="submit"
              disabled={!canSubmit}
              className="bg-ink hover:bg-blueprint-deep inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ink"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Generating blueprint...
                </>
              ) : (
                <>
                  Generate blueprint
                  <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div ref={resultRef} className="scroll-mt-24">
        {error && (
          <div
            role="alert"
            className="border-redline/40 bg-redline/5 mt-6 flex items-start gap-3 rounded-md border p-4"
          >
            <AlertTriangle
              className="text-redline mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="text-ink text-sm font-medium">
                Blueprint not generated
              </p>
              <p className="text-ink-soft mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}

        {isLoading && <BlueprintSkeleton />}

        {!isLoading && result && (
          <AiResponse
            blueprint={result.blueprint}
            model={result.model}
            integrations={result.integrations}
            generatedAt={result.generatedAt}
          />
        )}
      </div>
    </>
  );
}

/** Placeholder sheet shown while the model is drafting. */
function BlueprintSkeleton() {
  return (
    <div
      className="sheet border-rule bg-sheet mt-10 border p-6 shadow-sm"
      aria-hidden="true"
    >
      <p className="annotation text-blueprint">Sheet 02 / drafting</p>
      <div className="mt-5 space-y-3">
        {["w-1/3", "w-full", "w-11/12", "w-2/3", "w-1/4", "w-5/6", "w-3/4"].map(
          (width, index) => (
            <div
              key={index}
              className={`bg-rule/60 h-3 animate-pulse rounded-sm ${width}`}
              style={{ animationDelay: `${index * 90}ms` }}
            />
          ),
        )}
      </div>
    </div>
  );
}
