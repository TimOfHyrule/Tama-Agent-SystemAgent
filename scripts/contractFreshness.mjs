// Whether docs/AGENT_API.md still matches the server, checked at session start.
//
// ── The failure this exists to catch ─────────────────────────────────────
//
// docs/AGENT_API.md is not documentation in this repo. `bin/tama` READS it to
// decide which routes to refuse without --paid. The list is generated in
// Project-Station and pulled here by scripts/sync-contract.sh.
//
// That pull is manual, and nothing has ever triggered it. So the contract goes
// stale in the background, and it goes stale in the direction that costs
// money: a route that STARTED spending the account's Anthropic key since the
// last sync is not on the local paid list, so the guard waves it straight
// through. Nothing fails. The bill arrives later.
//
// A stale contract is also the one thing here that no amount of care in the
// session can notice, because the session's evidence and the guard's evidence
// are the same wrong file.
//
// ── Why it is throttled rather than run every time ───────────────────────
//
// The check costs a network round trip, at the exact moment somebody is
// waiting for their first message. The contract changes on the order of once a
// week; checking it a dozen times a day buys nothing and is felt every time.
// So the answer is cached for a day, and a session that has already been told
// says nothing.
//
// The cache is only ever allowed to make the check LESS frequent, never to
// answer in its place: a cached "stale" is re-reported until it is actually
// fixed, because the fix is a human running one command and the reminder is
// the only thing that makes it happen.
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// A day. Long enough that opening five sessions in an afternoon checks once,
// short enough that a contract that changed on Monday is not still trusted on
// Wednesday.
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Bounded because this runs before the human's first message. If GitHub is
// slow, the right outcome is a session that starts without an answer, not a
// session that starts twelve seconds late -- the check is a safety net, and a
// safety net that delays the work gets cut down within a week.
const TIMEOUT_MS = 8000;

const CACHE = '.contract-check.json';

function readCache(root) {
  try { return JSON.parse(fs.readFileSync(path.join(root, CACHE), 'utf8')); } catch { return null; }
}

function writeCache(root, value) {
  // Best-effort: a read-only checkout should lose the throttle, not the check.
  try { fs.writeFileSync(path.join(root, CACHE), JSON.stringify(value)); } catch { /* ignore */ }
}

// Returns a line for the session, or null when there is nothing worth saying.
//
// `now` is passed in rather than read, so the throttle is testable without
// moving the clock -- the same reason cadence.js takes today as an argument.
export function contractNote(root, { now = Date.now(), env = process.env } = {}) {
  const script = path.join(root, 'scripts', 'sync-contract.sh');
  if (!fs.existsSync(script)) return null;

  const cached = readCache(root);
  // Fresh answer, recently: stay quiet. A stale one is repeated -- see above.
  if (cached && now - cached.at < MAX_AGE_MS && cached.state === 'current') return null;

  let state;
  try {
    // --check changes nothing. TAMARADA_REPO (a local checkout) and
    // TAMARADA_REPO_TOKEN (one API call) are both fast; the git-clone fallback
    // is not, which is what the timeout is really guarding.
    execFileSync('bash', [script, '--check'], {
      cwd: root, env, timeout: TIMEOUT_MS, stdio: 'pipe',
    });
    state = 'current';
  } catch (e) {
    // Exit 1 is the script's way of saying "stale", and it is the only failure
    // worth reporting. Anything else -- no token, no network, timed out -- is
    // the check being unavailable, which is not news and must not be dressed
    // up as a finding. Reporting "could not check" every session is how a
    // real warning gets filtered out along with it.
    state = e.status === 1 ? 'stale' : 'unknown';
  }

  writeCache(root, { at: now, state });
  if (state !== 'stale') return null;

  return [
    '',
    'CONTRACT IS STALE: docs/AGENT_API.md no longer matches Project-Station.',
    '`bin/tama` reads that file to decide which routes cost money, so a route',
    'that started spending the account\'s key since the last sync is currently',
    'being waved through. Run `scripts/sync-contract.sh` and commit the result',
    'before calling anything you have not called before.',
  ].join('\n');
}
