# Decisions

> The brief: *"You have 60 minutes to improve it assuming the feature goes to
> production tomorrow."* This is what I chose to spend that hour on, what I
> deliberately did not build, and what would worry me most on launch day.

## 1. What did I improve?

**Validation on both sides of the wire.** The client disables the button on an
empty prompt and caps the textarea at 2000 characters, but the API route
re-validates everything independently: the body must be JSON, the prompt must be
a non-empty string within the length limit, and integrations must be an array
containing only the five allowed values. Client-side checks are a convenience;
the route assumes the client is hostile. Duplicate integrations are also
de-duplicated server-side so a repeated value cannot pad the system prompt.

**The API key stays on the server.** `OPENAI_API_KEY` is read inside the route
handler only, never prefixed with `NEXT_PUBLIC_`, and never returned in a
response. The OpenAI client is constructed per request rather than at module
load, so a missing key produces a clean 503 instead of crashing the build.

**Errors that are useful without being revealing.** Every failure path returns a
plain sentence a user can act on ("The AI service is not configured yet",
"Keep your description under 2000 characters"). The real cause is logged
server-side with `console.error`. No stack traces, no upstream error bodies, no
key fragments reach the browser. A missing key, a 401, a 429 and an unexpected
throw each map to a distinct status code.

**Honest loading and duplicate-request prevention.** Submitting disables the
button and the whole fieldset, swaps the label to a spinner, and shows a skeleton
sheet so the wait feels accounted for. The submit handler returns early unless
`canSubmit` is true, so a double-click, a rapid Enter press or a click on a
stale button cannot fire two paid API calls.

**A clear, accessible integration selector.** Each tool is a real
`<button aria-pressed>` inside a `<fieldset>` with a `<legend>`, so it is
keyboard-operable and announced correctly. Selection is signalled three ways —
border, background and a check badge — rather than colour alone, and a live
count sits next to the submit button.

**Responsive and accessible by default.** The layout works from 390px up; the
integration grid reflows 2 → 3 → 5 columns. Focus is visible everywhere,
`prefers-reduced-motion` is respected, the textarea is properly labelled, and
errors are announced via `role="alert"`.

**A single source of truth for the integrations.** `lib/integrations.ts` exports
the list, the derived `Integration` type and the length limit, and both the React
selector and the server-side validator import from it. The UI and the allow-list
cannot drift apart.

## 2. What did I intentionally leave out?

All of the following were deliberate omissions, not oversights. The brief asked
for a polished two-hour MVP and explicitly said not to over-engineer, and every
item here would have added architecture without making the core flow better:

- **Authentication and user accounts** — nothing in the flow is user-specific.
- **A database and Prisma** — nothing needs to persist between requests.
- **Saved or shareable projects** — would require the database and auth above.
- **Real Stripe / Shopify / Gmail / Slack / Google Sheets integrations** — the
  brief is explicit that these are contextual only. Building real OAuth flows
  would contradict the requirement, not exceed it.
- **Billing and usage plans** — no accounts to bill.
- **Team collaboration** — out of scope for a single-page demo.
- **Analytics and telemetry** — nothing to measure yet, and it invites a privacy
  conversation the assessment does not need.
- **Docker, Redis, queues, background jobs, microservices** — one synchronous
  request to one API does not justify any of them.
- **A provider abstraction layer** — one provider is used, so an interface with
  a single implementation would be speculative indirection.
- **Streaming responses** — genuinely nice for a 20-second wait, but it
  complicates error handling and the skeleton covers the gap acceptably. This is
  the omission I would revisit first.
- **Automated tests** — I verified the API contract and the UI flow manually
  (validation branches, the loading and error states, and that changing the
  selection changes the system prompt). A real production push would start with
  a unit test on `buildSystemPrompt` and a route-handler test, since those are
  the two pieces where a silent regression would be expensive.

## 3. What is the biggest production risk?

**AI API abuse and uncontrolled cost.**

`/api/generate` is a public, unauthenticated endpoint where every call spends
real money against a shared key. Nothing stops a script from posting 2000-character
prompts in a loop. The plausible outcomes are a surprise invoice, an exhausted
quota that takes the feature down for legitimate users, or the key being rate
limited by OpenAI. The prompt cap, `max_tokens` ceiling and duplicate-submission
guard bound the cost of a *single* honest request; they do nothing about volume.

It is worth being clear that this is a business risk more than a security one —
no user data is at stake — but it is the failure most likely to actually happen
on day one.

Before shipping, I would want:

- **Authentication**, so requests are attributable and abuse is stoppable
- **Server-side rate limiting** per IP and per account, enforced at the edge
- **Usage quotas** with a hard daily ceiling per user and a global kill switch
- **Request size limits** enforced at the proxy as well as in the route
- **Monitoring** of request volume, token spend, latency and error rate
- **Budget alerts** on the OpenAI account, not just internal dashboards
- **Abuse detection** for repetitive or automated traffic patterns

The order matters: authentication first, because rate limiting by IP alone is
trivially defeated and quotas need somebody to attach to.
