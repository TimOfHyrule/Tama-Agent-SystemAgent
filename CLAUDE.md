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

## Two memories, read both

They are in different places, and that is deliberate rather than accidental.

**Company knowledge — in Tamarada.** Run `bin/mem` before anything else. It
prints the facts, what is in flight, and past decisions with their reasons. It
is a collection, so the human can read and edit the same thing as a table in
the product. Write to it with `bin/mem add <fact|now|decision> "..."` — no
commit needed, it is saved the moment the command returns. Read
`docs/COMPANY_MEMORY.md` before writing, including the list of what must never
go in at all.

**Operating knowledge — in this repo, `memory/`.** `git pull` first. See the
next section.

The split is not tidiness. Company knowledge must never become public, and in
git that is a one-way door: deleting a file later leaves it in the history, in
every clone, forever. Operating knowledge is the opposite — technical,
publishable, and the thing you need on hand *precisely when Tamarada is not
answering*, which is exactly when a Tamarada-backed memory would be no help.

The rule for what belongs also differs. `memory/` holds only what Tamarada
cannot be asked, because it CAN be asked. Almost nothing about a company can be
looked up anywhere, so the company side is governed by how long a thing stays
true instead.

**Never put in either:** credentials, personal data about identifiable people,
anything under someone else's confidentiality, or the full text of a document
that has a canonical home elsewhere. All of it enters a model's context each
session; the `memory/` half is additionally permanent in git history and copied
by every clone. Write the pointer, not the content.

If `bin/mem` marks a note `[OLD]` or `[EXPIRED]` and you cannot confirm it still
holds, say so and ask — do not carry it forward as fact. If Tamarada is
unreachable, say that you have no company memory this session rather than
answering from guesses.

## Start by reading memory/

`memory/` is what previous sessions learned. You have none of it otherwise, and
on this platform relearning something usually means another failed run, which
spends real money.

Read `memory/README.md` first — it says what belongs there — then the topic
files. They are short on purpose.

**Write to it when any of these happens, using `bin/memo <topic> "..."`:**

- Something did not work, and the reason was not obvious. → `dead-ends`
- A choice was made between real alternatives. Record the REASON; the choice
  itself is usually visible in the data afterwards, the reason never is. →
  `decisions`
- **The human corrected you.** This is the highest-value entry there is:
  nothing in the system remembers it, and the next session will suggest exactly
  the same thing. → `decisions`
- You worked out how this install likes things done. → `conventions`

Then commit and push. A note that stays on one machine is not memory.

**Do not write down what Tamarada can be asked.** Which pages exist, what a
SOP's steps are, what failed last night — all of that is one API call away and
goes stale the moment somebody changes it. A stale note is worse than no note,
because you will have no other source and will act on it. `memory/README.md`
has the table of what to ask instead.

## Read the contract before calling anything

**`docs/AGENT_API.md` lists every route.** It is generated from the server and
is the only current description of it. If a route you expect is missing, or the
server refuses one this file says is fine, run `scripts/sync-contract.sh` — the
copy here does not update itself. Do not guess a path: a guess that
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
