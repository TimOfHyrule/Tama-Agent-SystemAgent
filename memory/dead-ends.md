# Dead ends

Things that did not work, so nobody pays to find out twice. On this platform a
rediscovered dead end is usually a failed run, and a failed run spends real
money on the account's key.

<!-- bin/memo appends below this line -->

## 2026-08-21 · 改 collection schema 的請求形狀：PUT /api/collections/:id/schema 和 POST .../migrate/plan 都吃「裸的」{"fields":[...]}，不是 {"schema":{"fields":[...]}}，也不是 {"drop":["欄位"]}。猜錯回的訊息是 'schema.fields must be a non-empty array'，看起來像欄位陣列有問題，其實是外層包錯。刪掉還有資料的欄位會再被擋一次，要加 allowBreaking:true 才過——那是刻意的護欄，不是 bug。docs/AGENT_API.md 只列 method 和 path、不列 request body，所以形狀只能試；先打 migrate/plan 試形狀比直接 PUT 便宜，它不會改任何東西。


## 2026-08-20 · collection 的 field type 沒有確認過的 boolean。這個 install 現有的 18 個 collection 只用到 text / number / date / select / ref / array / file，一個 boolean 都沒有。而且 POST /api/collections/:id/schema/preview 驗不出型別——丟 type:'boolean' 進去它回 'new optional field' 當成過了，所以 preview 不能拿來確認一個型別存不存在。要 true/false 的欄位（例如 agents.memoryExists）就用 select ['yes','no']，會渲染成受限的選項，也不必賭伺服器怎麼處理不認得的型別。


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
