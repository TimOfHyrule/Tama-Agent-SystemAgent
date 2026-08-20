# Dead ends

Things that did not work, so nobody pays to find out twice. On this platform a
rediscovered dead end is usually a failed run, and a failed run spends real
money on the account's key.

<!-- bin/memo appends below this line -->

## 2026-08-20 · 在 Claude Code 的雲端 session 裡刪不掉遠端分支。git push origin --delete 和 git push origin :branch 都回 HTTP 403（send-pack 被切斷），但一般的 push 是通的——所以那個 git proxy 允許寫入、不允許刪除 ref。GitHub MCP 也沒有 delete_branch 這個工具（有 create_branch）。本地 git branch -D 照樣可以，只會造成本地刪了遠端還在的假象。要刪遠端分支只能人去 GitHub UI 或在自己機器上做。


## 2026-08-18 · A URL-embedded token on git clone reports 'Write access not granted' for a pure read; fetch the one file over the API with an Authorization header instead


## 2026-08-18 · A SOP step cannot hand plain text to a collection

`collectionRecordWrite` needs a JSON object whose keys are the collection's
fields. A step that writes prose or a list fails with "The previous step's
output must be a JSON object matching the collection's fields, not a plain
string or array" — and it fails at the END of the pipeline, after everything
before it has already run and been paid for.

If the thing being produced is a document rather than a record, it does not
belong in a collection at all.
