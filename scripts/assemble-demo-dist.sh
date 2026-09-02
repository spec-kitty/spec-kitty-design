#!/usr/bin/env bash
# scripts/assemble-demo-dist.sh
#
# Assemble the static demo surface into a Storybook dist directory: copy the demo
# pages, rewrite their monorepo-relative asset paths to deploy-root-relative ones,
# mirror the assets they reference, and then PROVE every rewritten reference
# resolves inside the dist.
#
# Extracted from storybook-deploy.yml in M2 (#68) so that the sed rule, the asset
# mirroring and the resolution check run on every PR via ci-quality.yml, not only
# on push to main. Before that, the surface a package rename touches hardest was
# verified nowhere until it was already live on Pages.
#
# Usage: scripts/assemble-demo-dist.sh [DIST_DIR]

set -euo pipefail

DIST="${1:-apps/storybook/storybook-static}"

if [ ! -d "$DIST" ]; then
  echo "ERROR: dist directory not found: $DIST" >&2
  echo "  Run \`npx nx run storybook:storybook:build\` first." >&2
  exit 1
fi

# --- demo pages -------------------------------------------------------------
# The originals under apps/demo/ are intentionally left untouched so local
# file:// development keeps working (their paths stay relative to apps/demo/).
cp apps/demo/blog-demo.html "$DIST/blog-demo.html"
cp apps/demo/dashboard-demo.html "$DIST/dashboard-demo.html"

# Path mappings:
#   ../../packages/tokens/dist/tokens.css   -> ./tokens.css
#   ../../packages/tokens/assets/<file>     -> ./assets/<file>
#   ../../packages/styles/src/<comp>/<file> -> ./<comp>/<file>
sed -i \
  -e 's|\.\./\.\./packages/tokens/dist/tokens\.css|./tokens.css|g' \
  -e 's|\.\./\.\./packages/tokens/assets/|./assets/|g' \
  -e 's|\.\./\.\./packages/styles/src/|./|g' \
  "$DIST/blog-demo.html" \
  "$DIST/dashboard-demo.html"

# Nothing monorepo-relative may survive the rewrite. This catches a *missed*
# rewrite; it cannot catch a rewrite that points at nothing — that is what the
# resolution check at the bottom is for.
if grep -n '\.\./\.\./packages' "$DIST/blog-demo.html" "$DIST/dashboard-demo.html"; then
  echo "ERROR: residual ../../packages/ references found after rewrite" >&2
  exit 1
fi

# --- tokens, fonts, brand assets --------------------------------------------
cp packages/tokens/dist/tokens.css "$DIST/tokens.css"
if [ -d packages/tokens/dist/fonts ]; then
  cp -r packages/tokens/dist/fonts "$DIST/fonts"
elif [ -d packages/tokens/src/fonts ]; then
  cp -r packages/tokens/src/fonts "$DIST/fonts"
fi
if [ -d packages/tokens/assets ]; then
  mkdir -p "$DIST/assets"
  cp -r packages/tokens/assets/. "$DIST/assets/"
fi

# --- component files the demo pages actually reference ----------------------
# Derived from the pages rather than a hardcoded allowlist. A hardcoded list
# silently stops covering a component the moment a page starts using one that is
# not on it; deriving it means the set cannot drift out of date.
extract_refs() {
  {
    grep -oE '(href|src)="\./[^"]+"' "$1" | sed -E 's/.*="\.\///; s/"$//'
    grep -oE "from '\./[^']+'"        "$1" | sed -E "s/.*from '\.\///; s/'$//"
  } || true
}

REFS="$(for f in "$DIST/blog-demo.html" "$DIST/dashboard-demo.html"; do extract_refs "$f"; done | sort -u)"

while IFS= read -r ref; do
  [ -n "$ref" ] || continue
  # Already provided by the tokens/assets steps above.
  [ -e "$DIST/$ref" ] && continue
  src="packages/styles/src/$ref"
  if [ -f "$src" ]; then
    mkdir -p "$DIST/$(dirname "$ref")"
    cp "$src" "$DIST/$ref"
  fi
done <<< "$REFS"

# --- LLM-facilitation surface ------------------------------------------------
for f in llms.txt llms-full.txt; do
  if [ -f "$f" ]; then
    cp "$f" "$DIST/$f"
  else
    echo "WARN: $f missing at repo root; skipping" >&2
  fi
done

if [ -f packages/tokens/dist/token-catalogue.json ]; then
  cp packages/tokens/dist/token-catalogue.json "$DIST/token-catalogue.json"
else
  echo "WARN: token-catalogue.json missing; running catalogue generator" >&2
  npx nx run tokens:catalogue
  cp packages/tokens/dist/token-catalogue.json "$DIST/token-catalogue.json"
fi

# --- the check that actually binds ------------------------------------------
# Every deploy-root-relative reference in the demo pages must exist in the dist.
# Without this a page can reference a file nobody copied, the residual-path grep
# still passes, the deploy goes green, and the page 404s for real users.
missing=0
while IFS= read -r ref; do
  [ -n "$ref" ] || continue
  if [ -e "$DIST/$ref" ]; then
    echo "  OK   ./$ref"
  else
    echo "  MISSING  ./$ref" >&2
    missing=$((missing + 1))
  fi
done <<< "$REFS"

if [ "$missing" -gt 0 ]; then
  echo "ERROR: $missing demo asset reference(s) do not resolve in $DIST" >&2
  exit 1
fi

echo "OK: demo surface assembled; all $(printf '%s\n' "$REFS" | grep -c .) references resolve in $DIST"
