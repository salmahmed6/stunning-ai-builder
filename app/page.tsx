import { PromptForm } from "@/components/prompt-form";

/** The request pipeline, spelled out for anyone reading the page. */
const PIPELINE = [
  "Your idea",
  "Selected tools",
  "System prompt",
  "AI model",
  "Blueprint",
];

export default function Home() {
  return (
    <>
      <header className="border-rule bg-paper/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="bg-ink font-display flex size-7 items-center justify-center rounded-sm text-sm font-bold text-white"
            >
              S
            </span>
            <span className="font-display text-ink text-lg font-semibold tracking-tight">
              Stunning
            </span>
          </div>

          <p className="annotation text-ink-soft border-rule border-l pl-4">
            AI Builder
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-14 pb-20 sm:px-6 sm:pt-20">
        <section className="mb-10 sm:mb-14">
          <p className="annotation text-blueprint">AI product architect</p>

          <h1 className="font-display text-ink mt-4 text-[clamp(2.5rem,8vw,4.25rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance">
            Turn your idea into a blueprint.
          </h1>

          <p className="text-ink-soft mt-5 max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
            Describe what you want to build, choose the tools you use, and let AI
            turn your idea into a practical technical blueprint.
          </p>
        </section>

        <PromptForm />
      </main>

      <footer className="border-rule border-t">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <p className="annotation text-ink-soft/70">How a blueprint is made</p>

          <ol className="text-ink-soft mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs">
            {PIPELINE.map((step, index) => (
              <li key={step} className="flex items-center gap-2">
                {index > 0 && (
                  <span aria-hidden="true" className="text-blueprint">
                    &rarr;
                  </span>
                )}
                {step}
              </li>
            ))}
          </ol>

          <p className="text-ink-soft/70 mt-6 text-xs">
            Integrations are contextual selections for the AI. Stunning does not
            connect to Stripe, Shopify, Gmail, Slack or Google Sheets.
          </p>
        </div>
      </footer>
    </>
  );
}
