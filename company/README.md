# Company memory

`memory/` is about operating Tamarada. This is about running the company. They
are kept apart because the rule that governs one does not govern the other.

## Why the memory/ rule does not work here

`memory/README.md` says: **write down only what cannot be looked up**, because
Tamarada already knows what pages and modules exist and a note repeating it goes
stale. That rule does real filtering there.

Here it filters nothing. Almost nothing about a company can be looked up
anywhere, so "cannot be looked up" would admit everything, and this becomes a
pile that grows until nobody — human or agent — reads it.

So the axis here is different: **how long is this true for?**

| | What | How it is read |
|---|---|---|
| `facts.md` | Rarely changes. What the company is, who it is for, standing policy. | Every session |
| `now.md` | Changes weekly. What is being worked on, what is waiting, on whom. | Every session |
| `decisions.md` | Never changes. What was decided and why. | Grepped when a question comes up |

The first two are read in full at the start of every session, so they have a
budget: **200 lines between them**, checked by `scripts/check.mjs`. That is not
tidiness. Past a certain size an agent stops reading a file and starts reading
part of one, and a partially-read memory is worse than a short one because it
produces confident answers from half the picture.

`decisions.md` has no budget because nothing reads it whole.

## The dated-entry rule for now.md

Every line in `now.md` carries a date. An undated "we are waiting on the
supplier" is true the day it is written and indistinguishable from true a year
later — and the agent has nothing to check it against, which is exactly the
failure the Tamarada docs are built to avoid, in a place with no API to fall
back on.

If a line's date is old and you do not know whether it still holds, that is not
a note any more. Delete it or ask.

## What must never go in here

Not a matter of taste. Three specific properties of this repo make it the wrong
container for some things:

- **Git history is permanent.** Deleting a file in a later commit does not
  remove it; it stays in the history, in every clone, forever.
- **Every clone copies all of it** onto another machine.
- **All of it is pasted into a model's context** at the start of a session.

So, never:

- **Credentials.** Keys, passwords, tokens. `scripts/check.mjs` refuses the
  obvious ones; it cannot catch all of them.
- **Personal data about identifiable people.** Customers' details, an
  employee's pay, performance, health, or personal circumstances. Roles and
  responsibilities are fine — "Tim decides pricing" is operating knowledge.
  "Tim is off sick until March" is not.
- **Anything under an obligation to somebody else.** Contract terms marked
  confidential, another company's data, anything covered by an NDA.
- **The full text of anything with a canonical home.** Link to the contract,
  the invoice, the doc. A copy here is a second version that will disagree with
  the first, and nobody will know which is real.

When something is genuinely needed but does not belong here, write the pointer
rather than the content: "pricing agreed with X — see the signed PDF in Drive".

## Writing

```bash
bin/memo now       "Waiting on the supplier quote before the Q4 pricing call"
bin/memo decisions "Chose monthly over annual billing — annual hid churn we needed to see"
bin/memo facts     "Target user is a one-person operator, not a team"
```

Then commit and push. A note on one machine is not memory.
