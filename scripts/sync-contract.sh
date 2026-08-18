#!/usr/bin/env bash
# Refresh docs/AGENT_API.md from the Tamarada repo that generates it.
#
# ── Why this exists ──────────────────────────────────────────────────────
#
# docs/AGENT_API.md is not documentation here. bin/tama READS it to decide
# which routes to refuse without --paid. So a stale copy is not an out-of-date
# page — it is a guard checking a list that no longer matches the server,
# silently, and in the direction that costs money: a route added since the last
# sync is not on the list, so the guard waves it through.
#
# The copy in the Tamarada repo is generated and test-pinned. This one is a
# copy of a copy, and nothing upstream can keep it current, which is exactly
# why the sync has to be a command somebody can run rather than a thing to
# remember.
#
#   scripts/sync-contract.sh            update it
#   scripts/sync-contract.sh --check    say whether it is stale, change nothing
#                                       (exit 1 if it is — usable in CI or a hook)
set -euo pipefail

REPO_URL="${TAMARADA_REPO_URL:-https://github.com/TimOfHyrule/Project-Station.git}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$HERE/docs/AGENT_API.md"
CHECK_ONLY=false
[ "${1:-}" = "--check" ] && CHECK_ONLY=true

# Prefer a checkout you already have: it can REGENERATE rather than copy, so it
# reflects uncommitted route changes too, and it needs no network.
fresh=""
if [ -n "${TAMARADA_REPO:-}" ] && [ -d "$TAMARADA_REPO" ]; then
  echo "Using local checkout: $TAMARADA_REPO"
  ( cd "$TAMARADA_REPO" && npm run --silent agent-contract >/dev/null )
  fresh="$TAMARADA_REPO/docs/AGENT_API.md"
else
  # Shallow clone rather than a raw file URL: the repo is private, and this way
  # it uses the git credentials you already have instead of asking for a token.
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  echo "Fetching from $REPO_URL"
  git clone --depth 1 --quiet "$REPO_URL" "$tmp/repo"
  fresh="$tmp/repo/docs/AGENT_API.md"
fi

[ -f "$fresh" ] || { echo "No AGENT_API.md upstream — has it moved?" >&2; exit 1; }

if cmp -s "$fresh" "$TARGET"; then
  echo "Already current."
  exit 0
fi

# What changed in the PAID list specifically. The route count moving is
# interesting; a route joining or leaving the money list is the thing that
# changes what bin/tama does, so it is reported on its own.
paid() { grep -oE '^- `\$` `[A-Z]+ /api/[^`]+`' "$1" 2>/dev/null | sed 's/^- `\$` `//; s/`$//' | sort; }
added="$(comm -13 <(paid "$TARGET") <(paid "$fresh") || true)"
removed="$(comm -23 <(paid "$TARGET") <(paid "$fresh") || true)"

echo "Contract has changed."
[ -n "$added" ]   && { echo "  now COSTS MONEY (bin/tama will start refusing these):"; echo "$added"   | sed 's/^/    + /'; }
[ -n "$removed" ] && { echo "  no longer costs money:";                                echo "$removed" | sed 's/^/    - /'; }
[ -z "$added$removed" ] && echo "  (routes changed, but the money list is the same)"

if $CHECK_ONLY; then
  echo "Stale. Run scripts/sync-contract.sh to update."
  exit 1
fi

cp "$fresh" "$TARGET"
echo "Updated docs/AGENT_API.md — commit it, or the next clone is stale again."
