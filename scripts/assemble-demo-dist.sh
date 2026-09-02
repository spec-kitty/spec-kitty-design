#!/usr/bin/env bash
# scripts/assemble-demo-dist.sh
#
# Assemble the static demo surface into a Storybook dist directory: copy the demo
# pages, rewrite their monorepo-relative asset paths to deploy-root-relative ones,
# mirror the assets they reference, and prove every reference resolves.
#
# Extracted from storybook-deploy.yml in M2 (#68) so ci-quality.yml runs the
# identical code on every PR. Before that, the surface a package rename touches
# hardest was verified nowhere until it was already live on Pages.
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
# Derived, not hardcoded: a third demo page must not be silently unassembled.
# The originals under apps/demo/ are left untouched so local file:// development
# keeps working (their paths stay relative to apps/demo/).
PAGES=()
for src in apps/demo/*-demo.html; do
  [ -f "$src" ] || continue
  cp "$src" "$DIST/$(basename "$src")"
  PAGES+=("$DIST/$(basename "$src")")
done
if [ "${#PAGES[@]}" -eq 0 ]; then
  echo "ERROR: no apps/demo/*-demo.html pages found to assemble" >&2
  exit 1
fi

# Path mappings:
#   ../../packages/tokens/dist/tokens.css   -> ./tokens.css
#   ../../packages/tokens/assets/<file>     -> ./assets/<file>
#   ../../packages/styles/src/<comp>/<file> -> ./<comp>/<file>
sed -i \
  -e 's|\.\./\.\./packages/tokens/dist/tokens\.css|./tokens.css|g' \
  -e 's|\.\./\.\./packages/tokens/assets/|./assets/|g' \
  -e 's|\.\./\.\./packages/styles/src/|./|g' \
  "${PAGES[@]}"

# No monorepo-relative path may survive, at ANY depth. The original guard matched
# only the `../../` form, so a `../packages/...` reference — which the sed above
# also does not rewrite — escaped both.
if grep -nE '\.\./.*packages/' "${PAGES[@]}"; then
  echo "ERROR: residual monorepo-relative references found after rewrite" >&2
  exit 1
fi

# --- tokens, fonts, brand assets --------------------------------------------
cp packages/tokens/dist/tokens.css "$DIST/tokens.css"

# tokens.css declares ~30 @font-face src: url('./fonts/...'). A silently missing
# fonts tree used to leave every one of them 404ing with the gate still green,
# and the old fallback named packages/tokens/src/fonts, a path that has never
# existed in any commit. The real source is packages/tokens/fonts.
if [ -d packages/tokens/dist/fonts ]; then
  cp -r packages/tokens/dist/fonts "$DIST/fonts"
elif [ -d packages/tokens/fonts ]; then
  mkdir -p "$DIST/fonts"
  cp packages/tokens/fonts/* "$DIST/fonts/"
else
  echo "ERROR: no fonts source found (packages/tokens/dist/fonts or packages/tokens/fonts)" >&2
  exit 1
fi

if [ -d packages/tokens/assets ]; then
  mkdir -p "$DIST/assets"
  cp -r packages/tokens/assets/. "$DIST/assets/"
fi

# --- reference extraction ----------------------------------------------------
# Deliberately attribute-agnostic: any quoted value starting with ./ , in either
# quote style, plus bare module specifiers. An earlier version anchored on
# href=/src= with double quotes only, which meant a legal `href = "./x.css"`
# extracted nothing, copied nothing, and then "verified" the empty set it had
# just produced. Extraction and verification must not share a blind spot.
extract_refs() {
  {
    grep -oE "[\"']\./[^\"']+[\"']" "$1" | sed -E "s/^[\"']\.\///; s/[\"']$//"
    grep -oE "from[[:space:]]+[\"']\./[^\"']+" "$1" | sed -E "s/.*[\"']\.\///"
  } || true
}

# References inside a stylesheet rather than the HTML — url() and @import.
# tokens.css names the fonts this way and nothing in the HTML mentions them.
extract_css_refs() {
  {
    grep -oE "url\([\"']?\./[^)\"']+" "$1" | sed -E "s/.*\([\"']?\.\///"
    grep -oE "@import[[:space:]]+[\"']\./[^\"']+" "$1" | sed -E "s/.*[\"']\.\///"
  } || true
}

# Independent cross-check. Counting reference-BEARING TAGS is derived differently
# from the value extraction above, so an extraction miss shows up as a mismatch
# instead of cancelling out on both sides.
count_ref_tags() {
  grep -oE '<(link[^>]+rel=[^>]*stylesheet|script[^>]+type=[^>]*module|img)' "$1" | wc -l
}

for page in "${PAGES[@]}"; do
  tags=$(count_ref_tags "$page")
  refs=$(extract_refs "$page" | sort -u | grep -c . || true)
  if [ "$refs" -lt "$tags" ]; then
    echo "ERROR: $(basename "$page") has $tags reference-bearing tags but only $refs extracted references." >&2
    echo "  Extraction is missing references — fix extract_refs before trusting this check." >&2
    exit 1
  fi
done

REFS="$(for page in "${PAGES[@]}"; do extract_refs "$page"; done | sort -u)"

# --- component files the demo pages actually reference ----------------------
# Derived from the pages rather than a hardcoded allowlist, so the set cannot
# drift out of date as components come and go.
while IFS= read -r ref; do
  [ -n "$ref" ] || continue
  src="packages/styles/src/$ref"
  if [ -f "$src" ]; then
    # Always refresh from source. An earlier version skipped any ref already
    # present in the dist, which meant a re-run over a warm dist served the
    # PREVIOUS build's component CSS - stale content, silently.
    mkdir -p "$DIST/$(dirname "$ref")"
    cp "$src" "$DIST/$ref"
  fi
done <<< "$REFS"

# Stylesheets are in place now, so their own references join the check.
CSS_REFS="$(
  while IFS= read -r ref; do
    [ -n "$ref" ] || continue
    case "$ref" in *.css) [ -f "$DIST/$ref" ] && extract_css_refs "$DIST/$ref" ;; esac
  done <<< "$REFS" | sort -u
)"
REFS="$(printf '%s\n%s\n' "$REFS" "$CSS_REFS" | grep -v '^$' | sort -u)"

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
  echo "ERROR: packages/tokens/dist/token-catalogue.json missing (it is tracked; run nx run tokens:catalogue)" >&2
  exit 1
fi

# --- the check that actually binds ------------------------------------------
missing=0
total=0
while IFS= read -r ref; do
  [ -n "$ref" ] || continue
  total=$((total + 1))
  if [ ! -e "$DIST/$ref" ]; then
    echo "  MISSING  ./$ref" >&2
    missing=$((missing + 1))
  fi
done <<< "$REFS"

if [ "$missing" -gt 0 ]; then
  echo "ERROR: $missing of $total demo asset reference(s) do not resolve in $DIST" >&2
  exit 1
fi

echo "OK: demo surface assembled from ${#PAGES[@]} page(s); all $total references resolve in $DIST"
