"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Integration } from "@/lib/integrations";

type Props = {
  blueprint: string;
  model: string;
  integrations: Integration[];
  generatedAt: Date;
};

/** One field of the drawing "title block" that heads the sheet. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-rule border-t px-4 py-2.5 sm:border-t-0 sm:border-l sm:first:border-l-0">
      <dt className="annotation text-ink-soft/70">{label}</dt>
      <dd className="mt-1 truncate font-mono text-xs text-ink" title={value}>
        {value}
      </dd>
    </div>
  );
}

export function AiResponse({
  blueprint,
  model,
  integrations,
  generatedAt,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(blueprint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the text is still selectable on screen.
    }
  }

  return (
    <section aria-labelledby="blueprint-heading" className="mt-10">
      <div className="sheet border-rule bg-sheet border shadow-sm">
        <header className="border-rule flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-6">
          <div>
            <p className="annotation text-blueprint">Sheet 02</p>
            <h2
              id="blueprint-heading"
              className="font-display text-2xl font-semibold tracking-tight text-ink"
            >
              Your Blueprint
            </h2>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="border-rule text-ink-soft hover:border-blueprint hover:text-blueprint inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition"
          >
            {copied ? (
              <Check className="size-3.5" strokeWidth={2.5} />
            ) : (
              <Copy className="size-3.5" strokeWidth={2} />
            )}
            {copied ? "Copied" : "Copy Markdown"}
          </button>
        </header>

        {/* Title block: the drawing's metadata, as on a real technical sheet. */}
        <dl className="bg-paper/60 border-rule grid grid-cols-1 border-b sm:grid-cols-3">
          <Field
            label="Integrations"
            value={
              integrations.length > 0 ? integrations.join(", ") : "None selected"
            }
          />
          <Field label="Model" value={model} />
          <Field
            label="Issued"
            value={generatedAt.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
        </dl>

        <div className="blueprint-body px-4 py-6 sm:px-6 sm:py-8">
          {/* remark-gfm adds tables and strikethrough, which models commonly emit. */}
          <Markdown remarkPlugins={[remarkGfm]}>{blueprint}</Markdown>
        </div>
      </div>
    </section>
  );
}
