# Conventions

House style for this install. Obvious once, invisible afterwards.

<!-- bin/memo appends below this line -->

## 2026-08-18 · CI: scripts/check.mjs runs on every push; the contract-drift check needs the TAMARADA_REPO_TOKEN secret


## 2026-08-18 · Run scripts/sync-contract.sh after Tamarada's routes change; the copy here does not update itself


## 2026-08-18 · Ask Tamarada what exists; memory is only for what it cannot answer


## 2026-08-18 · Field descriptions say what a field MEANS

Not what it is. "how strongly held, 1-5", never "a number". It is the only
lasting record of intent — nothing else in the system recovers what a field was
for, and a later change to that description is flagged as a semantic change
precisely because no check can catch a field quietly changing meaning.
