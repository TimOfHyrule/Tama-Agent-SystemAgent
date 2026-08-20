# Conventions

House style for this install. Obvious once, invisible afterwards.

<!-- bin/memo appends below this line -->

## 2026-08-20 · 在這個 repo 直接推 main，不要開 feature 分支。Tim 2026-08-20 的指示。原因在這次 session 看得很清楚：我把 hook、規劃文件和兩則 memory 筆記都推到一條 claude/* 分支，結果 memory 筆記等於沒寫——新 session 從 main 開，讀不到分支上的東西，而 memory 的全部意義就是被下一個 session 讀到。分支在這裡沒有保護到任何東西，只是讓寫下來的東西到不了。


## 2026-08-18 · CI: scripts/check.mjs runs on every push; the contract-drift check needs the TAMARADA_REPO_TOKEN secret


## 2026-08-18 · Run scripts/sync-contract.sh after Tamarada's routes change; the copy here does not update itself


## 2026-08-18 · Ask Tamarada what exists; memory is only for what it cannot answer


## 2026-08-18 · Field descriptions say what a field MEANS

Not what it is. "how strongly held, 1-5", never "a number". It is the only
lasting record of intent — nothing else in the system recovers what a field was
for, and a later change to that description is flagged as a semantic change
precisely because no check can catch a field quietly changing meaning.
