#!/usr/bin/env bash
# npm-audit-gate.sh — fails if any high or critical CVE is found
# Used in CI (FR-041) and as a local quality check
set -euo pipefail

echo "Running npm audit..."
# STDOUT ONLY. This was `2>&1`, which merges npm's warnings INTO the JSON capture: the moment
# npm emitted `npm warn ...` the parse below died with
#   SyntaxError: Unexpected token 'p', "npm warn au"... is not valid JSON
# and `set -euo pipefail` turned that into a failed security gate on a PR with no high or
# critical advisory at all. Found on #134, where the same commit range passed this gate an hour
# earlier and then did not, with nothing in the diff touching dependencies.
# STDERR IS KEPT, in a separate file. `2>/dev/null` isolated stdout correctly but threw away
# npm's own diagnostic, so when the parse below failed on #138 the message printed "First 200
# characters of what it returned:" with nothing after it — a gate that fails closed and then
# cannot say why. npm's error is the only thing that distinguishes a registry outage from a
# shape change, and this gate now reports it.
AUDIT_STDERR="$(mktemp)"
trap 'rm -f "$AUDIT_STDERR"' EXIT
OUTPUT=$(npm audit --audit-level=high --json 2>"$AUDIT_STDERR" || true)

# AND THE PARSE FAILS LOUDLY. Even with stderr separated, an unparseable body — a registry
# outage, a proxy error page, an npm version that changes the shape — must not be able to look
# like either a pass or a mysterious SyntaxError. It is reported as what it is.
VULNERABILITIES=$(printf '%s' "$OUTPUT" | node -e "
let d;
const raw = require('fs').readFileSync('/dev/stdin', 'utf8');
try {
  d = JSON.parse(raw);
} catch {
  process.stderr.write(
    'npm audit did not return JSON. First 200 characters of what it returned:\n' +
      raw.slice(0, 200) + '\n'
  );
  process.exit(2);
}
const counts = d.metadata?.vulnerabilities;
if (!counts) {
  process.stderr.write('npm audit JSON has no metadata.vulnerabilities — refusing to report a pass over a shape this gate cannot read.\n');
  process.exit(2);
}
const high = (counts.high || 0) + (counts.critical || 0);
process.stdout.write(String(high));
") || {
  echo "❌ npm audit gate could not determine the vulnerability count."
  if [ -s "$AUDIT_STDERR" ]; then
    echo "   npm wrote this to stderr:"
    sed 's/^/   | /' "$AUDIT_STDERR" | head -20
  else
    echo "   npm wrote nothing to stderr, so this is a response-shape problem rather than a"
    echo "   reported failure. A well-formed report has metadata.vulnerabilities; a registry"
    echo "   outage typically returns an error object. Re-run before investigating further —"
    echo "   #138 saw this once, with the step taking 5m24s, and a local audit at the same"
    echo "   commit returned a normal report."
  fi
  exit 1
}

if [ "$VULNERABILITIES" -gt 0 ]; then
  echo "❌ npm audit found $VULNERABILITIES high/critical vulnerabilities. Fix before merging."
  npm audit --audit-level=high
  exit 1
else
  echo "✅ npm audit passed — no high/critical vulnerabilities."
fi
