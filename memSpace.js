// Which memory this agent OWNS, and which it may READ.
//
// Zero imports on purpose: `bin/mem` reads it, the repo's own checks read it,
// and a person changing the split reads it. One file, three readers, no
// machinery in between.
//
// ── Why there are three of these ─────────────────────────────────────────
//
// This repo drives a Tamarada install. Tama-Agent-GeneralAssisstant runs the life
// side, and Tamarada is its own source. Three jobs, three repos,
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
// Page read grants are DESIGNED and not SHIPPED, and this file said the
// opposite for a while. There is no pageGrants module and no grant route on
// Tamarada's main branch -- the contract this repo mirrors listed three of
// them, which is how the claim survived: a route in a stale copy of a contract
// reads exactly like a route that exists.
//
// The design, for when it lands: a grant lets one app READ another app's page
// and nothing else. There is no write grant, deliberately, because two apps
// writing one page is a merge problem nobody has an answer to yet. With a
// grant in place and a sandboxed credential, the asymmetry below would be
// enforced by the server -- crossing to read works, crossing to write returns
// "no such page", the same answer it gives for a page that never existed.
//
// Until then the `bin/mem` rule is not the first line of two. It is the only
// line, in a file this agent can read and could route around, and the register
// in Tama-AgentManager says the same thing about the same grants: all four
// recorded, none issued, nothing enforcing them.
//
// Which direction to be wrong in is not symmetrical. An agent told a wall
// exists stops behaving as though it might not, and that is the failure this
// paragraph has now caused once.

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
    repo: 'Tamarada',
  },
];
