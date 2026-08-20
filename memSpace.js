// Which memory this agent OWNS, and which it may READ.
//
// Zero imports on purpose: `bin/mem` reads it, the repo's own checks read it,
// and a person changing the split reads it. One file, three readers, no
// machinery in between.
//
// ── Why there are three of these ─────────────────────────────────────────
//
// This repo drives a Tamarada install. Tama-Agent-GeneralAssisstant runs the life
// side, and Project-Station is Tamarada's own source. Three jobs, three repos,
// three memories -- a session that opens to "what shall we build" should not
// boot with the groceries, and the reverse is worse.
//
// But they are not sealed off from each other, because the useful cases are
// exactly the crossing ones: "he is away next week" is a life note that
// changes what is worth building, and "page read grants shipped today" is a
// platform note that changes what this repo can ask the server for. So each
// side READS every space and WRITES one.
//
// ── What the platform enforces, and what it does not ─────────────────────
//
// It used to enforce neither half. Page scoping was one column --
// `pipeline_pages.appId` -- matched exactly, which gave two settings and no
// third: a sandboxed credential saw only pages it created (so cross-reading
// was impossible), or a full-access one saw and could DELETE everything in the
// account. The read-only rule therefore lived in `bin/mem`, a file in this
// repo that the agent can read and could route around. It was documented as a
// fence rather than a wall, honestly, and a fence is still the wrong place for
// a tenancy boundary.
//
// Tamarada now has page read grants (`pageGrants.js` in Project-Station). A
// grant lets one app READ another app's page and nothing else -- there is no
// write grant, deliberately, because two apps writing one page is a merge
// problem nobody has an answer to yet. So with a grant in place and a
// sandboxed credential, the asymmetry below is enforced by the server:
// crossing to read works, crossing to write returns "no such page", which is
// the same answer it gives for a page that never existed.
//
// The `bin/mem` rule stays anyway. It is now the FIRST line rather than the
// only one, and it fails with a sentence naming the repo to go to instead of a
// 404 from somewhere in the API. Two guards for one rule is right when one of
// them is the tenancy boundary.
//
// If this agent still runs on a full-access token, none of that applies and
// the fence is all there is. `bin/mem` says which it got.

// The one this agent writes to. `bin/mem add` and `bin/mem forget` touch
// nothing else, and `bin/mem setup` creates only this.
export const OWN = {
  page: 'Agent memory',
  collection: 'agent_memory',
  label: 'build',
};

// Read-only, for context. Adding one here grants no permission by itself --
// the token still has to be able to see it (see above), and `bin/mem` says so
// by name when it cannot rather than printing nothing.
export const PEERS = [
  {
    page: 'Life memory',
    collection: 'life_memory',
    label: 'life',
    // Named so a refusal can tell you where to go instead of just saying no.
    repo: 'Tama-Agent-GeneralAssisstant',
  },
  {
    page: 'Platform memory',
    collection: 'platform_memory',
    label: 'platform',
    // Named so a refusal can tell you where to go instead of just saying no.
    repo: 'Project-Station',
  },
];
