# tamarada-agent

A place to stand while driving a [Tamarada](https://github.com/TimOfHyrule/Project-Station)
install from Claude Code. Open a Claude Code session on this repo and it can
build pages, collections, modules and SOPs over the API.

`CLAUDE.md` is what the agent reads. This file is for you.

You need a Tamarada account and a token. You do **not** need to run the install
— most of this works the same whether the server is yours or somebody else's.
The few operator-only things are marked as such.

## Setup

**The short way — no key to find, no key to paste:**

```bash
export TAMARADA_URL=https://your-install.example.com
bin/tama login
```

It prints a code. Open Tamarada, go to **Setup → Agents**, type the code, and
choose how much access to give it. The terminal then prints a token to export.

That token lasts **90 days** (the install can change it with
`AGENT_TOKEN_DAYS`). It appears on the same screen with the date it dies and
when it was last used, and can be revoked there without touching anything
else. When it does expire, `bin/tama login` again — there is no renewal to
remember, and nothing else breaks.

Nothing is pushed at you: you go and enter the code, so a stranger cannot make
your screen ask you to approve something. The code is what proves the request
is the one in front of you.

<details>
<summary>The long way, if you would rather use the account key directly</summary>

**1. Give the install a key you chose.** Start Tamarada with:

```bash
OPERATOR_API_KEY=dos_something_you_chose ... node server.js
```

Set it deliberately. Unset, the server mints one, prints it once at boot, and
you can never read it again.

For a key that is not the operator's — recommended, since an operator key
reaches *every* account on the install — `POST /api/accounts` returns a new
account's key once, at creation.

**2. Put the URL and key in the environment**, never in this repo:

```bash
export TAMARADA_URL=https://your-install.example.com
export TAMARADA_KEY=dos_something_you_chose
```

In Claude Code on the web, set them in the environment's variables rather than
exporting them in a shell — a shell export does not survive between sessions.

Locally, a `.env` file in the repo root works too: the session-start hook reads
it and carries both values into the session, so `bin/tama` and `bin/mem` work
without exporting anything by hand. It is gitignored, and the hook copies across
only those two names — nothing else in the file is exported. "Never in this
repo" above means never in a *tracked* file; `.env` is the one place that is
in the directory but never in a commit.

**3. Check it:**

```bash
bin/tama GET /api/accounts/me
```

</details>

## How Claude Code actually reaches your account

There is no account linking and no OAuth. Two separate things have to be true:

**The credential.** Every request carries `Authorization: Bearer $TAMARADA_KEY`.
Tamarada hashes it, finds the account, and that request *is* that account. The
key is the whole identity — there is nothing else, which is why it never goes
in a file here.

**The network path.** Claude Code has to be able to *reach* the server, and
this is the part that catches people:

| Tamarada runs on | Claude Code runs on | Works? |
|---|---|---|
| your laptop (`localhost`) | your laptop (CLI / desktop) | yes |
| your laptop (`localhost`) | the cloud (claude.ai/code) | **no** |
| a deployed URL | anywhere | yes |

A cloud session runs in its own container and cannot see your machine. If you
want to use Claude Code on the web against a local install, either run Claude
Code locally instead, or expose the install at a URL.

`bin/tama` says exactly this when a request cannot connect, so you will not
have to remember it.

## Its other half

[**Tama-Agent-GeneralAssisstant**](https://github.com/TimOfHyrule/Tama-Agent-GeneralAssisstant)
is the life side of the same pair: the running of a day rather than the running
of an install. Both read each other's memory; neither writes to the other's.

Everything except `CLAUDE.md`, `memSpace.js` and `memory/` is the same code in
both repos, and that duplication is deliberate. A session boots with its repo's
`CLAUDE.md` in context before anybody knows which job it is, so one repo means
one brief and a brief that covers both is half wrong whichever session you
opened. `scripts/check.mjs` runs in both, which is what keeps the copies from
drifting apart quietly.

`memSpace.js` is the whole configuration of the split, and it states the limit
plainly: Tamarada's page scoping is one exact-matched column, so cross-reading
needs a **full-access** token and the write rule is enforced by `bin/mem`
rather than by the platform. See that file, and `memory/decisions.md`, for what
the real fix would take.

## Two memories, in two different places

Both survive between sessions. They are kept apart because what belongs in each
is decided differently — and, more importantly, because one of them must never
be public.

**Company knowledge lives in Tamarada**, in a collection, reached with
`bin/mem`:

```bash
bin/mem                                    # read it all -- the first thing a session does
bin/mem add fact     "..."                 # rarely changes
bin/mem add now      "..." [--for <days>]  # in flight; --for gives it an end date
bin/mem add decision "..."                 # what was chosen, and why
bin/mem forget <recordId>
bin/mem setup                              # once, to create the page and collection
```

**Every session starts by going through it with you.** A SessionStart hook
(`.claude/hooks/session-start.sh`) reads the memory before the agent's first
message, so its opening move is to show you what it thinks it knows — and to
ask about anything that has gone `[OLD]` or `[EXPIRED]`, so a wrong note gets
corrected instead of quietly outliving its truth.

It only *asks* about the stale ones. The version that asks about everything
works twice; by the third session it is a wall of text between you and the
thing you opened the session to do, and skipping it becomes the habit. If
Tamarada is unreachable or the credentials are missing, the hook says so in
the session rather than failing it — a hook that aborts the session it exists
to help would be a worse bug than the one it fixes.

It is account data: private by construction, never in a commit, and editable by
a person as a table in the product. It started as `company/*.md` in this repo
and moved for one reason no amount of care in the files could fix — **git
history is permanent**, so a private note committed once is in every clone
forever, and taking it back is not possible. `docs/COMPANY_MEMORY.md` has the
full rule, including what must never go in at all.

The trade is real and worth stating: `bin/mem` needs Tamarada reachable, and
files did not. That is exactly why the other half stayed in files.

## memory/ — operating knowledge, in files

**Operating knowledge stays in this repo**, in `memory/`, written with
`bin/memo <topic> "..."`. It is technical, it is publishable, and it is what
you need on hand *precisely when Tamarada is misbehaving* — which is the one
moment a Tamarada-backed memory is no help at all.

Notes that outlive a session, so the next one does not relearn what the last
one did. `memory/README.md` states the discipline; the short version is that it
holds only what the API cannot answer — decisions and their reasons, dead ends,
corrections you made, conventions — and never a copy of what exists in
Tamarada, which would go stale and mislead.

It syncs the way everything else here does: git. Two sessions on two machines
both need to pull before writing and push after, and the per-topic files keep
that from turning into a merge conflict every time.

Worth reading yourself occasionally. It is a decent record of what was decided
and why, and it is the place to delete things that stopped being true — a
memory nobody prunes is one nobody reads.

## Keeping the contract current

```bash
scripts/sync-contract.sh          # update it
scripts/sync-contract.sh --check  # is it stale? exit 1 if so
```

`docs/AGENT_API.md` is generated in the Tamarada repo, and the copy here is a
copy of a copy — nothing upstream can keep it current. That matters more than a
stale page normally would, because **`bin/tama` reads this file** to decide
which routes to refuse without `--paid`. A route added since the last sync is
not on the list, so the guard waves it through: it fails in the direction that
costs money, and quietly.

The script says what changed, and specifically what joined or left the money
list, since that is the part that changes what `bin/tama` does.

Set `TAMARADA_REPO` to a local Project-Station checkout and it regenerates
rather than copying — so it picks up route changes you have not committed yet,
and needs no network. Without it, it shallow-clones the repo using the git
credentials you already have.

`--check` writes nothing and exits 1 when stale, so it works as a pre-commit
hook or a CI step if you would rather not remember.

## Checks

```bash
node scripts/check.mjs             # no credential, no network
scripts/sync-contract.sh --check   # is the contract still what Tamarada generates?
```

CI runs the first on every push and weekly — weekly because the thing most
likely to break here is not a change in this repo, it is a route added in
Tamarada, which no push here would notice.

`scripts/check.mjs` checks whether the machinery that USES these files still
works on them: `bin/tama` parses `docs/AGENT_API.md` to know what to refuse,
`bin/memo` finds a marker to append at, and either can stop matching without
anything throwing — the guard just refuses nothing, the memo just writes
nowhere. It also holds `docs/COMPANY_MEMORY.md` to the kinds `bin/mem` really
accepts, catches anything still pointing at the `company/*.md` files that moved
into Tamarada, and refuses to let a real key be committed while ignoring the
placeholders in this file.

`bin/mem` is checked more thinly on purpose: what it talks to is Tamarada, so
most of what could go wrong there needs a credential and a network, which this
script deliberately has neither of.

The contract check needs to reach Project-Station, which is private. Add a
repository secret named **`TAMARADA_REPO_TOKEN`** and the weekly run will tell
you when the copy here has drifted. Without the secret that step **skips rather
than fails** — a workflow that goes red for a missing secret just teaches
everyone that red is normal.

Make it a fine-grained token at
<https://github.com/settings/personal-access-tokens/new> with **Only select
repositories → Project-Station** and **Repository permissions → Contents →
Read-only**. Nothing else. If it comes back 403 or 404, that is what to
re-check: GitHub returns 404 rather than 403 when a token cannot see a private
repo at all, and `Write access to repository not granted` on a read means the
token cannot see the repo, not that it needs write.

## What this does not do

It does not make Tamarada cheaper to *run*. Your Claude subscription pays for
the agent thinking about your problem; Tamarada calling Anthropic to execute a
SOP step is billed to the account's own key, always. Building gets cheaper.
Running does not.
