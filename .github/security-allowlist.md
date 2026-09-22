# Security Allowlist — Postinstall Script Exceptions

This file documents every npm package that has been explicitly reviewed
and approved to run postinstall/install/prepare lifecycle scripts.
CI enforces `npm ci --ignore-scripts`; any package that requires a
postinstall hook must be listed here with rationale.

## Approved exceptions

| Package | Script purpose | Reviewed by | Date | Expiry review |
|---|---|---|---|---|
| (none at v1.0.0) | | | | |
| surge | Global install for PR preview deployment; postinstall is empty for surge | node-norris | 2026-05-01 | Annual |

## Accepted residual CVE risks (npm audit — cannot fix without breaking changes)

| Package | CVE | Advisory | Why not fixed | Exploitability in this repo | Reviewed | Expiry |
|---|---|---|---|---|---|---|
| `uuid@8.3.2` | GHSA-w5hq-g745-h8pq | Missing buffer bounds check in v3/v5/v6 when `buf` is provided | Fix requires uuid v14 (breaking API change); downgrading `webpack-dev-server` would break the `@nx/webpack` build | **Not exploitable here** — `sockjs` and `@lhci/cli` use `uuid.v4()` without a `buf` param; the vulnerable code path is never triggered | stijn-dejongh | 2027-05-01 |

Mitigation: monitor for uuid patches compatible with uuid 8.x, or track `webpack-dev-server` for a uuid 14.x upgrade.

## Adding an exception

1. Review the postinstall script source on the package's GitHub repo
2. Confirm it only performs legitimate setup (native module compilation, font download, etc.)
3. Add a row to the table above with your name and the date
4. Add the package to `npm install --ignore-scripts` exception in `ci-quality.yml`
