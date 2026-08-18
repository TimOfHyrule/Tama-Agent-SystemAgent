# What goes in here

Notes that survive between sessions. Every Claude Code session on this repo
starts with no memory of the last one, so anything learned the hard way is
learned again — and on this platform "again" can mean another failed run, which
is real money.

## This is the technical half

There is a second memory, for personal knowledge, and it is **not in this repo**
— it is a Tamarada collection, read and written with `bin/mem`. See
`docs/PERSONAL_MEMORY.md`.

Which one a note belongs in is usually obvious, and the test when it is not:
*would this still be worth having if Tamarada were down?* This half is exactly
the notes that would be — how the API behaves, what failed and why — which is
why they stay in files a broken Tamarada cannot take with it. The rule below
governs only this half; the personal side is governed by how long a thing stays
true instead, because "cannot be looked up" admits almost everything about a
company and so filters nothing.

## The one rule

**Write down only what cannot be looked up.**

Tamarada already knows what exists. Ask it. A note that duplicates its state
goes false the first time somebody changes something, and then keeps
confidently asserting the old answer — which a person skims and shrugs at, and
an agent acts on, because it has no other source.

| Wanting to know… | Do NOT write it here | Ask instead |
|---|---|---|
| what pages/collections/modules exist | ✗ | `GET /api/pipeline-pages`, `.../collections`, `/api/modules` |
| what a SOP's steps are | ✗ | `GET /api/sops/:name` |
| whether something can run | ✗ | `GET /api/pipeline-pages/:id/readiness` |
| what failed last night | ✗ | `GET /api/queue`, the module's action log |

## So what IS worth writing

Four kinds, all of them things the API cannot answer:

- **Decisions, with the reason.** "The weekly report goes to a Report page, not
  a collection — Tim wants to read it, not query it." The decision is
  recoverable from the data; the *reason* never is.
- **Dead ends.** The most valuable entries here. Rediscovering that an approach
  does not work costs a failed run, and a failed run costs money.
- **Corrections a human made.** If you were told "no, not like that", that is
  the single highest-value thing to record, because nothing in the system
  remembers it and the next session will make the same suggestion.
- **Conventions.** Naming, structure, house style — the things that are obvious
  once and invisible afterwards.

## Keeping it readable

One file per topic, so a session can grep for what it needs instead of reading
everything. Append with `bin/memo <topic> "<what happened>"`, which stamps the
date and puts it in the right place.

Entries are short and dated. If a file grows past a screen or two, the old
entries at the top have usually become either obvious or wrong — delete them.
A memory nobody prunes is one nobody reads, and an unread memory is the same as
no memory except that it takes longer to establish that.

**Contradicting an old entry beats deleting it silently.** "2026-08-18: the
opposite of what we said in June, because …" tells the next session that the
question was live and how it was settled. A note that quietly disappears
teaches nothing.
