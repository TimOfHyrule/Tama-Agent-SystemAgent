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
    const topics = [];
    for (const d of ['memory', 'company']) {
      const dir = path.join(ROOT, d);
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir)) {
        if (f.endsWith('.md') && f !== 'README.md') topics.push(`${d}/${f}`);
      }
    }
    const missing = topics.filter((f) => !rd(f).includes(marker));
    if (missing.length) bad(`bin/memo: no append marker in ${missing.join(', ')} -- notes there would fail to write`);
    else ok(`bin/memo can append to ${topics.length} topic(s)`);
  }
}

// ── The always-read files still fit in a session ────────────────────────
//
// company/facts.md and company/now.md are read IN FULL at the start of every
// session. Past a certain size that stops happening: an agent reads part of a
// file and answers from half the picture, confidently, with nothing to check
// against -- and unlike the Tamarada side there is no API here to fall back
// on. So the budget is a check rather than advice in a README nobody rereads.
//
// decisions.md is deliberately exempt: nothing reads it whole.
{
  const BUDGET = 200;
  const alwaysRead = ['company/facts.md', 'company/now.md'].filter((f) => fs.existsSync(path.join(ROOT, f)));
  if (alwaysRead.length) {
    const lines = alwaysRead.reduce((n, f) => n + rd(f).split('\n').length, 0);
    if (lines > BUDGET) {
      bad(`company/facts.md + company/now.md are ${lines} lines (budget ${BUDGET}). Prune them -- a memory too long to read is worse than a short one, because it gets read in part.`);
    } else {
      ok(`always-read company memory is ${lines}/${BUDGET} lines`);
    }
  }
}

// ── now.md entries are dated ────────────────────────────────────────────
//
// An undated "waiting on the supplier" is true the day it is written and
// indistinguishable from true a year later. Dating is the only thing that lets
// a later session tell a live item from a fossil.
{
  const f = 'company/now.md';
  if (fs.existsSync(path.join(ROOT, f))) {
    const undated = rd(f).split('\n')
      .filter((l) => l.startsWith('## '))
      .filter((l) => !/^## \d{4}-\d{2}-\d{2}/.test(l));
    if (undated.length) bad(`${f}: ${undated.length} entr(ies) with no date -- a later session cannot tell those from fossils`);
    else ok('every now.md entry is dated');
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
