# Working on a Tamarada install from here

This repo is not an application. It is a place to stand while operating a
**Tamarada** install over its HTTP API — building pages, collections, modules
and SOPs, and reading back what happened.

## How to call it

Always through the wrapper. It carries the auth headers and refuses the routes
that cost money:

```bash
bin/tama GET  /api/accounts/me
bin/tama POST /api/pipeline-pages '{"name":"Weekly digest"}'
```

`TAMARADA_URL` and `TAMARADA_KEY` come from the environment. If `TAMARADA_KEY`
is missing, say so and offer to run `bin/tama login` — it prints a code the
human types into Setup → Agents, and prints back a token to export. Do not look
for a key in the repo, and never write one into a file here.

## Read the contract before calling anything

**`docs/AGENT_API.md` lists every route.** It is generated from the server and
is the only current description of it. Do not guess a path: a guess that
happens to resolve is worse than one that 404s, and the nearest-looking route
to the one you wanted is often the one that charges.

## Money

Most routes are database work and cost nothing. A handful make Tamarada call
Anthropic **on the account's own key** — those are marked `$` in the contract
and `bin/tama` refuses them without `--paid`.

The one to understand rather than just obey: **there is a route that drafts a
SOP with a model, and it charges for it.** You are already a model. Write the
steps yourself and `PUT /api/sops/:name`, which is free and produces the same
thing. Reaching for the drafting route is spending the human's money to do
what you were about to do anyway.

Running a pipeline always costs money, every time, with no exception. Ask
first.

## What a build looks like

Every step here is free. Ending on a readiness check is how you know it worked
without paying to find out:

1. `POST /api/pipeline-pages` — one page is one interactive system.
2. `POST /api/pipeline-pages/:id/collections` — typed fields. Each field's
   description says what it MEANS, not what it is: "how strongly held, 1-5",
   not "a number". That description is the only lasting record of intent, and
   nothing else will ever recover it.
3. `POST /api/tasks` to create the SOP, then `PUT /api/sops/:name` with steps.
4. `POST /api/modules` pointing at that SOP and page.
5. `GET /api/pipeline-pages/:id/readiness` — answers "would this actually
   run": a missing SOP, an empty one, a plug-in that is not installed, a
   credential nobody set. Do not report a build as done until this says `ok`.

## Before writing a SOP

Read `sopContract.js` on the install's own repo if you have it. It is the whole
step vocabulary *and* the limits of it in one file, and the section on what the
vocabulary CANNOT express is the important half — it exists because a pipeline
was once designed that read as though a step would iterate, since every
description said what each step DOES and nothing said what none of them can.

If you do not have that file, ask rather than inventing step types. An invalid
step is refused on write, but a *valid* step that does not do what you assumed
is not.

## Two things that are true here and not in the UI

**Writes land immediately.** In Tamarada's own interface the assistant proposes
and a person applies, and that split is enforced rather than agreed. Calling
the API with a key has no such split: there is no preview and nobody approving.
Say what you are about to change before changing it.

**You may be able to see more than you should.** If the key is the operator's,
it reaches every account on the install, not just one. Scope what you touch to
what was asked for.
