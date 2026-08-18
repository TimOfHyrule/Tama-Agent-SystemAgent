#!/usr/bin/env node
// What a session is told before it does anything else.
//
// Run by .claude/hooks/session-start.sh. It reads the company memory out of
// Tamarada and hands it to the session as context, together with an
// instruction to go through it WITH the human rather than absorb it silently.
//
// ── Why a hook and not a line in CLAUDE.md ───────────────────────────────
//
// CLAUDE.md already said "run bin/mem first". A written instruction competes
// with everything else in the file and loses often enough that the memory got
// read some sessions and not others -- and a memory that is read
// unpredictably is worse than one that is never read, because you cannot tell
// from the outside which kind of session you are talking to. The hook is not
// advice. It runs.
//
// ── Why the review is proportionate ──────────────────────────────────────
//
// The obvious version prints everything and asks "still true?" about each
// line. That works twice. By the third session it is a wall of text between
// the human and the thing they opened the session to do, and the correct
// response to it -- skip it -- is the one that gets learned.
//
// So: the notes are always shown, and only the ones that have gone [OLD] or
// [EXPIRED] are asked about, because those are the only ones where the answer
// changes what is stored. A session with nothing stale says one line and gets
// out of the way.
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = process.argv[2] || 'startup';

// A hook that breaks the session it is supposed to help is a bad trade, so
// every failure below turns into context saying what went wrong. The session
// still starts; it just knows it is working without memory, which is the
// thing it must not discover silently.
const emit = (text) => {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text },
  }));
  process.exit(0);
};

if (!process.env.TAMARADA_URL || !process.env.TAMARADA_KEY) {
  emit(
    'COMPANY MEMORY: unavailable this session -- TAMARADA_URL / TAMARADA_KEY are not set.\n' +
    'Tell the human this in your first message, and offer `bin/tama login`. Do not answer ' +
    'questions about the company from guesses; you have no memory of previous sessions.',
  );
}

let out;
try {
  out = execFileSync(path.join(ROOT, 'bin/mem'), { encoding: 'utf8', timeout: 20000 });
} catch (err) {
  // exit 1 with this message means the collection has never been created.
  const said = `${err.stdout ?? ''}${err.stderr ?? ''}`.trim();
  if (said.includes('bin/mem setup')) {
    emit(
      'COMPANY MEMORY: not set up yet on this Tamarada install.\n' +
      'Say so in your first message and offer to run `bin/mem setup`, which creates the page ' +
      'and collection. Until then there is no memory of previous sessions.',
    );
  }
  emit(
    `COMPANY MEMORY: could not be read.\n${said || err.message}\n\n` +
    'Tell the human in your first message. Do not answer questions about the company from ' +
    'guesses -- say plainly that memory was unreachable this session.',
  );
}

const empty = out.includes('No memory yet');
// Counted from the markers bin/mem prints rather than by re-querying: the two
// tools then cannot disagree about what is stale, which they would the first
// time one of the thresholds moved.
const stale = (out.match(/\[(OLD|EXPIRED)\]/g) || []).length;

// Only startup and clear get the walkthrough. `resume` is somebody continuing
// a conversation that already had it, and `compact` is a session mid-task
// whose context was just trimmed -- re-reading the memory there is useful,
// being asked to review it again in the middle of the work is not.
const walkthrough = source === 'startup' || source === 'clear';

if (empty) {
  emit(
    'COMPANY MEMORY: empty. Nothing has been written yet.\n' +
    (walkthrough
      ? 'Mention this once, briefly, and offer to start it: `bin/mem add fact "..."`. Do not interrogate them for facts.'
      : ''),
  );
}

const instruction = walkthrough
  ? [
      '',
      '── Before anything else, go through this with the human ──',
      '',
      'Your FIRST message must show them what is remembered. Not a summary of it -- the notes',
      'themselves, so they can spot a wrong one. Group by kind, keep it tight, no preamble.',
      '',
      stale
        ? `Then ask about the ${stale} note(s) marked [OLD] or [EXPIRED], one short question covering ` +
          'all of them: still true, or should it go? Act on the answer with `bin/mem add` / ' +
          '`bin/mem forget` -- do not just acknowledge it. Ask about nothing else: every other ' +
          'note is current and asking would train them to skip this.'
        : 'Nothing is stale, so ask nothing. Close with one line offering to add or correct anything, ' +
          'and then get on with whatever they came for.',
      '',
      'If they came in with a task already stated, do this first anyway -- it is short -- and then',
      'go straight into the task in the same message.',
    ].join('\n')
  : '';

emit(`COMPANY MEMORY (from Tamarada, read at session start):\n${out}${instruction}`);
