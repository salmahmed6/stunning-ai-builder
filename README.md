# Stunning AI Builder

A small AI-powered landing page for a fictional product called **Stunning**.

You describe what you want to build, tick the tools you already use, and the app
asks an AI model to turn that into a practical technical blueprint. The selected
tools are injected into the **system prompt**, so changing the selection changes
the answer you get back.

## Features

- Single-page SaaS landing page with a large prompt input
- Five selectable dummy integrations: Stripe, Shopify, Gmail, Slack, Google Sheets
- Selected integrations are injected into the AI **system prompt** (not the user message)
- Server-side OpenAI call — the API key never reaches the browser
- Input validation on both the client and the API route
- Loading state, skeleton placeholder, and duplicate-submission protection
- Friendly error messages that never leak keys or stack traces
- Markdown rendering of the blueprint, including tables
- Copy-to-clipboard for the generated Markdown
- Responsive from 390px up, with visible keyboard focus and reduced-motion support

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS v4 |
| Icons | lucide-react |
| Markdown | react-markdown + remark-gfm |
| AI | OpenAI official JavaScript SDK |

No database, no auth, no Docker, no queues. It is one Next.js app.

## Getting Started

Install dependencies:

```bash
npm install
```

Create a file called `.env.local` in the project root:

```bash
OPENAI_API_KEY=sk-your-real-key-here
OPENAI_MODEL=gpt-4o-mini
```

Run the dev server:

```bash
npm run dev
```

Open <http://localhost:3000>.

Other useful commands:

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
npx tsc --noEmit  # type check
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | Your OpenAI secret key. Server-side only — it is read inside the API route and is never sent to the browser. Without it the app still builds and runs, and the UI shows a clear "not configured yet" message. |
| `OPENAI_MODEL` | No | Which chat model to call, e.g. `gpt-4o-mini`. Defaults to `gpt-4o-mini` if unset. |

`.env.example` documents both. Never prefix either with `NEXT_PUBLIC_`.

## Architecture

```
Frontend (components/prompt-form.tsx)
        |
        v
POST /api/generate  (app/api/generate/route.ts)   <- validates the body
        |
        v
lib/ai.ts  ->  system prompt (with selected integrations) + user prompt
        |
        v
OpenAI Chat Completions
        |
        v
Markdown blueprint
        |
        v
Frontend (components/ai-response.tsx)
```

Request body:

```json
{
  "prompt": "I want to build a SaaS platform for restaurants...",
  "integrations": ["Stripe", "Slack"]
}
```

Success response:

```json
{
  "blueprint": "## Product overview ...",
  "model": "gpt-4o-mini",
  "integrations": ["Stripe", "Slack"]
}
```

Errors always come back as `{ "error": "a sentence you can show a user" }` with a
sensible status code (400 for bad input, 429 when rate limited, 502/503 when the
AI service is unavailable, 500 for anything unexpected).

### Where the integrations are injected

The important part of the whole exercise lives in `buildSystemPrompt()` in
`lib/ai.ts`. The selected integrations are interpolated into the **system**
message; the user's text is passed through untouched as the **user** message:

```ts
messages: [
  { role: "system", content: buildSystemPrompt(integrations) },
  { role: "user", content: prompt },
]
```

They are deliberately not appended to the user's message, because they describe
capabilities available to the assistant rather than part of what the user asked
for.

## Important Design Decision

**The integrations are dummy context.** Selecting Stripe does not connect to
Stripe. Nothing is authenticated, no tokens are stored, and no external service
other than OpenAI is contacted. The five names exist purely to change what the
model is told it may assume, and the system prompt explicitly instructs the model
not to pretend they are already connected. The footer says the same thing to the
user.

## Production Considerations

The biggest risk is **uncontrolled AI usage and cost**: the endpoint is public,
unauthenticated, and every call spends money. A prompt length cap and
duplicate-submission guard are in place, but before this went live it would need
authentication, server-side rate limiting, per-user quotas, spend monitoring and
budget alerts.

See `DECISIONS.md` for what was improved, what was intentionally left out and why,
and `TECH.md` for a look at the Model Context Protocol and whether it belongs here.
