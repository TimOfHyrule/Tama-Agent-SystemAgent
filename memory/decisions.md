# Decisions

Choices made and why. The choice is usually recoverable from the data; the
reason never is.

<!-- bin/memo appends below this line -->

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
