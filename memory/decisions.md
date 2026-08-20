# Decisions

Choices made and why. The choice is usually recoverable from the data; the
reason never is.

<!-- bin/memo appends below this line -->

## 2026-08-20 · Agent register 放在自己的 page（Agent Register / collection agents），不是掛在 Agent memory 底下。理由是那是兩個系統：memory 是筆記，register 是「這個帳號上有哪些 agent」的名冊，混在一個 page 會讓兩者的 readiness 和權限綁在一起。Schema 照 Tama-AgentManager 的 docs/AGENT-RECORD.md，seed 照同 repo 的 agents.json。


## 2026-08-20 · claude/geo-seo-new-task-djxtcj 上剩下的兩個檔案作廢，不要撿回 main：docs/geo-seo-plan.md（GEO SEO 規劃）和 docs/ecpay-enquiry.md（綠界洽詢信）。Tim 2026-08-20 決定其他 agent 接手這兩件事，所以這裡的版本不是唯一來源，撿回來只會變成第二份會跟真的那份不一致。信的內容已經另外交給他了。那條分支這個環境刪不掉（見 dead-ends），要 Tim 自己刪；刪掉之後這則筆記就可以一起清掉。


## 2026-08-20 · 兩個 memory space 之間不需要「交接」。Tim 2026-08-20 糾正：我做了一個 for-life/ 資料夾，把該給 Life 的東西整理成檔案等人搬，理由是 bin/mem add 寫不到別人的 space。那是把讀的問題當成寫的問題在解——Life 本來就讀得到 Agent 的 memory（memSpace.js 的規則是兩邊都讀、只寫自己的）。所以想給 Life 看的東西，寫進自己的 memory 就到了。真正要搬家的（例如放錯 space 的一則 fact）是兩個指令：那邊 bin/mem add、這邊 bin/mem forget，不需要一個資料夾、一份說明和一個交接流程。


## 2026-08-20 · 非公司的事一律歸 Life，不管 build 側有沒有現成的地方放。Tim 2026-08-20 的裁示，推翻我當時的猶豫——我看到 life 側可能沒有對應的事項表，就建議「讀 Never Eat Alone」先留在 Professional Assistant 的 items。錯的地方是拿實作方便決定歸屬：分類照事情的性質走，容器不夠就去補容器。下次遇到同類的猶豫，直接歸 Life。


## 2026-08-18 · Agent tokens are preferred over the operator key for anything automated



## 2026-08-20 · The life memory and the build memory are separate spaces, read-across and write-own

Two repos, two Tamarada memory collections (see `memSpace.js`). Each reads both
and writes only its own.

Reading across, because the useful notes are the crossing ones — an absence
explains a stalled build, a broken pipeline explains a bad week. Not writing
across, because two agents editing one pot produces a memory nobody trusts and
nobody prunes.

**Known gap, deliberately accepted for now:** Tamarada cannot enforce the write
half. Page scoping is a single `pipeline_pages.appId` column matched exactly,
which gives sandboxed (sees only its own pages, so no cross-reading at all) or
full access (sees and writes everything). There is no read-only grant. So
cross-reading requires a full-access token, and the write rule lives in
`bin/mem` — a fence, not a wall. `scripts/check.mjs` holds the fence in place.

The real fix is a per-app read grant so the filter becomes "owns it, or was
granted it". That changes `appScopeId`, which Project-Station's own CLAUDE.md
flags as a silent tenancy bug when it goes wrong, so it wants tests first and
its own sitting rather than being done on the way to something else.
