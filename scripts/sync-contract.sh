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
#   scripts/sync-contract.sh            update it
#   scripts/sync-contract.sh --check    say whether it is stale, change nothing
#                                       (exit 1 if it is — usable in CI or a hook)
#
# ── Where it looks, in order ─────────────────────────────────────────────
#
#   TAMARADA_REPO        a local checkout. Regenerated rather than copied, so
#                        it reflects routes that are not committed yet, and it
#                        needs no network at all.
#   TAMARADA_REPO_TOKEN  fetch the ONE file over the GitHub API.
#   (nothing)            git clone, for a machine that already has credentials.
#
# The API path replaced a `git clone` with the token embedded in the URL. That
# form failed with `remote: Write access to repository not granted` on what was
# a pure read — a message that sends you to check write permissions you never
# needed. Cloning a whole repository to read one file was the wrong shape
# anyway.
set -euo pipefail

OWNER_REPO="${TAMARADA_REPO_SLUG:-TimOfHyrule/Project-Station}"
CONTRACT_PATH="docs/AGENT_API.md"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$HERE/$CONTRACT_PATH"
CHECK_ONLY=false
[ "${1:-}" = "--check" ] && CHECK_ONLY=true

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
fresh="$tmp/AGENT_API.md"

if [ -n "${TAMARADA_REPO:-}" ] && [ -d "$TAMARADA_REPO" ]; then
  echo "Using local checkout: $TAMARADA_REPO"
  ( cd "$TAMARADA_REPO" && npm run --silent agent-contract >/dev/null )
  cp "$TAMARADA_REPO/$CONTRACT_PATH" "$fresh"

elif [ -n "${TAMARADA_REPO_TOKEN:-}" ]; then
  echo "Fetching $CONTRACT_PATH from $OWNER_REPO"
  code=$(curl -sS -o "$fresh" -w '%{http_code}' \
    -H "Authorization: Bearer $TAMARADA_REPO_TOKEN" \
    -H "Accept: application/vnd.github.raw" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/$OWNER_REPO/contents/$CONTRACT_PATH")
  # Each code means a different thing to go and fix, and the raw body is JSON
  # nobody wants to read at 9am.
  case "$code" in
    200) : ;;
    401) echo "401 — the token is invalid or has expired. Make a new one." >&2; exit 1 ;;
    403) echo "403 — the token cannot read $OWNER_REPO. Check its 'Contents: Read-only' permission, and that the repo is selected under 'Only select repositories'. If the repo belongs to an organisation, the token's resource owner must be that org and an admin may have to approve it." >&2; exit 1 ;;
    404) echo "404 — $OWNER_REPO not visible to this token. Same causes as 403; GitHub returns 404 rather than 403 when a token cannot see a private repo at all." >&2; exit 1 ;;
    *)   echo "HTTP $code fetching the contract." >&2; head -c 300 "$fresh" >&2; exit 1 ;;
  esac

else
  echo "No TAMARADA_REPO and no TAMARADA_REPO_TOKEN — falling back to git clone."
  git clone --depth 1 --quiet "https://github.com/$OWNER_REPO.git" "$tmp/repo"
  cp "$tmp/repo/$CONTRACT_PATH" "$fresh"
fi

[ -s "$fresh" ] || { echo "Fetched an empty contract — refusing to overwrite." >&2; exit 1; }

if cmp -s "$fresh" "$TARGET"; then
  echo "Already current."
  exit 0
fi

# What changed in the PAID list specifically. A route count moving is
# interesting; a route joining or leaving the money list is the thing that
# changes what bin/tama actually does.
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
echo "Updated $CONTRACT_PATH — commit it, or the next clone is stale again."
