#!/usr/bin/env node
// The invariants this repo can check on its own, with no credential and no
// network. Run locally or in CI: `node scripts/check.mjs`.
//
// ── What is worth checking here ──────────────────────────────────────────
//
// Not "is the contract current" -- that needs to reach the Tamarada repo,
// which is private, so it needs a token (see .github/workflows/check.yml).
// What CAN be checked without one is more interesting anyway: whether the
// machinery that USES these files still works on them.
//
// bin/tama refuses paid routes by parsing docs/AGENT_API.md, and bin/memo
// appends by finding a marker in memory/*.md. Both are text-matching a file
// they do not own. If either stops matching, nothing throws -- the guard
// simply refuses nothing, and the memo simply writes nowhere. Those are the
// failures worth a check, because they are the ones that look like success.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let failed = 0;
const ok = (m) => console.log(`  ok   ${m}`);
const bad = (m) => { console.error(`  FAIL ${m}`); failed++; };

// ── bin/tama's guard still finds the paid routes ────────────────────────
{
  const wrapper = rd('bin/tama');
  const doc = rd('docs/AGENT_API.md');
  // Lifted from the wrapper's own source rather than retyped, so this cannot
  // pass while the real one fails.
  const m = wrapper.match(/matchAll\(\/(\^- .*?)\/gm\)/);
  if (!m) {
    bad('bin/tama: could not find its paid-route pattern (did the parsing change?)');
  } else {
    const found = [...doc.matchAll(new RegExp(m[1], 'gm'))];
    if (found.length === 0) {
      bad('bin/tama: its pattern matches NOTHING in docs/AGENT_API.md -- the guard is off, and would refuse nothing');
    } else if (!found.every((x) => /^[A-Z]+$/.test(x[1]) && x[2].startsWith('/api/'))) {
      bad('bin/tama: its pattern matched something that is not a route');
    } else {
      ok(`bin/tama would refuse ${found.length} paid route(s)`);
    }
  }
}

// ── The contract still says which routes cost money ─────────────────────
{
  const doc = rd('docs/AGENT_API.md');
  const claim = doc.match(/\*\*(\d+) of (\d+) routes can spend/);
  if (!claim) bad('docs/AGENT_API.md: no "N of M routes can spend" line -- is this really the generated file?');
  else if (Number(claim[1]) === 0) bad('docs/AGENT_API.md: says NO route costs money, which cannot be right');
  else if (Number(claim[1]) >= Number(claim[2]) / 4) bad(`docs/AGENT_API.md: ${claim[1]} of ${claim[2]} marked paid -- too many to be right`);
  else ok(`contract marks ${claim[1]} of ${claim[2]} routes as spending`);
}

// ── bin/memo can still find where to append ─────────────────────────────
{
  const marker = (rd('bin/memo').match(/const MARKER = '([^']+)'/) || [])[1];
  if (!marker) {
    bad('bin/memo: could not find its append marker constant');
  } else {
    const topics = fs.readdirSync(path.join(ROOT, 'memory'))
      .filter((f) => f.endsWith('.md') && f !== 'README.md');
    const missing = topics.filter((f) => !rd(`memory/${f}`).includes(marker));
    if (missing.length) bad(`bin/memo: no append marker in ${missing.join(', ')} -- notes there would fail to write`);
    else ok(`bin/memo can append to ${topics.length} topic(s)`);
  }
}

// ── Nothing secret got committed ────────────────────────────────────────
{
  // .env is gitignored, but a key pasted into any tracked file is not, and it
  // is the one mistake here with a real cost.
  const tracked = fs.readdirSync(ROOT, { recursive: true })
    .filter((f) => typeof f === 'string' && !f.startsWith('.git/') && !f.startsWith('node_modules'))
    .filter((f) => fs.statSync(path.join(ROOT, f)).isFile());
  // Prefix plus length is not enough: `dos_something_you_chose` is a
  // placeholder in README.md and matched it, and a leak check that cries wolf
  // on the documentation gets switched off -- which is worse than not having
  // one. Real keys here are base64url from crypto.randomBytes, so requiring an
  // uppercase AND a digit separates them from anything written by hand in
  // snake_case.
  const looksReal = (s) => /[A-Z]/.test(s) && /[0-9]/.test(s);
  const leaked = tracked.filter((f) => {
    if (f === 'scripts/check.mjs') return false; // this file names the patterns
    const body = fs.readFileSync(path.join(ROOT, f), 'utf8');
    return [...body.matchAll(/\b(?:dos_|ses_|sk-ant-)([A-Za-z0-9_-]{16,})/g)]
      .some((m) => looksReal(m[1]));
  });
  if (leaked.length) bad(`a credential appears in: ${leaked.join(', ')}`);
  else ok('no credentials in tracked files');
}

console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
