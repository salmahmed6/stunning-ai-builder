# Tech Radar: Model Context Protocol (MCP)

## 1. What is MCP?

The Model Context Protocol is an open standard for connecting AI models to
external tools and data. Anthropic introduced it in late 2024 and it has since
been adopted well beyond them, including by OpenAI and by most major agent
frameworks and IDEs.

The problem it solves is a combinatorial one. Before MCP, wiring *N* models to
*M* tools meant writing *N × M* bespoke integrations — every product invented its
own way to describe "here is a tool, here is what it does, here is how to call
it". MCP defines that once. A **server** exposes capabilities (tools it can run,
resources it can read, prompts it can offer), a **client** inside the AI
application discovers them at runtime, and the model decides when to call them.
Anyone can write a server for their service, and it works with any compliant
client.

The useful analogy is a USB-C port for AI applications: one connector shape, many
devices behind it. The important shift is that the model stops merely *knowing
about* a tool and starts being able to *invoke* it, with the results flowing back
into the conversation.

## 2. How could Stunning use MCP?

Stunning does not use MCP today, and does not need it. In the current version the
five integrations are **pure context**: names interpolated into the system prompt
so the model knows which building blocks it may assume when it drafts a
blueprint. Nothing is called, nothing is authenticated, and the system prompt
explicitly tells the model not to pretend otherwise.

**Current version:**

```
User
  |
  v
Selected integrations
  |
  v
System prompt
  |
  v
AI  ->  a blueprint describing how Stripe and Slack could be used
```

**Potential future MCP version:**

```
User
  |
  v
AI
  |
  v
MCP tools
  |
  v
External services (Stripe, Slack, Gmail, Google Sheets, Shopify)
  |
  v
AI  ->  a blueprint grounded in what is actually there
```

The difference is the difference between advice and action. Concretely, a future
Stunning could:

- **Ground the blueprint in reality.** With a Stripe MCP server connected
  read-only, the agent could see that the user already has subscription products
  configured and write the billing section around what exists rather than
  guessing.
- **Deliver the output where the work happens.** Post the finished blueprint to a
  Slack channel, email it via Gmail, or drop the feature breakdown into a Google
  Sheet as a backlog — instead of the user copying Markdown by hand.
- **Check feasibility.** Query a Shopify store's structure before proposing an
  architecture that assumes capabilities the merchant's plan does not have.

The natural first step would be read-only servers that improve the quality of the
generated blueprint, well before anything that writes.

## 3. What are MCP's limitations?

**Security is the headline concern.** Giving a model the ability to call tools
means prompt injection stops being a content problem and becomes an execution
problem. A malicious string inside a fetched document can attempt to trigger a
tool call the user never asked for. Related failure modes — confused-deputy
issues, tool-poisoning where a server changes a tool description after approval,
and token theft from a server holding long-lived credentials — are active areas
of concern, and early implementations shipped with real vulnerabilities.

**Permissions and authorization need genuine design.** "Connect Gmail" is not a
single decision. Read a thread, send as the user, and delete a message deserve
different consent, and users approving tool calls repeatedly tend to click
through them. Scoping, short-lived credentials and meaningful approval UX are
work, not configuration.

**External services are unreliable in ways prompts are not.** Tool calls add
network latency, rate limits, partial failures and timeouts to a flow that
currently has exactly one dependency. Every added server is another thing that
can be down while the user waits.

**It is substantially more complex than prompt context.** The current
implementation is a template literal and one API call — reviewable in a minute
and debuggable by reading a string. An agent loop with tool discovery,
multi-turn tool use, retries and partial failure is a different class of system
to build, test and reason about.

**Operational cost grows.** Servers to run or trust, credentials to rotate,
version skew as the spec evolves, audit logs to keep, and non-deterministic
behaviour that is genuinely harder to test than a fixed prompt.

## 4. Would I use it today?

**For the current assessment, no.** The task explicitly requires integrations to
be contextual only, so implementing MCP would be unnecessary over-engineering. It
would add an agent loop, credential handling and an entire security surface to a
feature whose whole job is producing one block of text — and it would contradict
a stated requirement rather than exceed it. The system prompt is the correct tool
for the problem as specified.

**For a future version of Stunning where the AI needs to actually perform actions
across external services, MCP would be worth evaluating.** At that point the
alternative is writing bespoke integrations per service, which is precisely the
*N × M* problem MCP exists to solve, and the standard has enough adoption that
betting on it is reasonable rather than speculative.

If I were making that call for real, I would start narrow: one read-only server,
explicit per-action consent, strict timeouts, and a fallback to the current
prompt-only path whenever a tool call fails — so the feature degrades to what it
does today instead of breaking.
