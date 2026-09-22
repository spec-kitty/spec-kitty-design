# Delivery review finding — commit scope

Independent Codex delivery review rejected `9d90ba13cf198cca9d6ab733f98f2f052b491693`
because commit `a8da731827c194aec69440547e844c11483bb11f` used
`docs(review)`, while `review` is not an allowed repository commit scope.

Reproduction:

`npx commitlint --from 77707c3ccf0664cb22dff0ff4febd6e479301033 --to 9d90ba13cf198cca9d6ab733f98f2f052b491693 --verbose`

The review-evidence commit was reconstructed with the allowed
`docs(acceptance)` scope, its descendants and acceptance provenance were rebuilt,
and commitlint was rerun across the complete PR range. No product files changed.

All review work used Codex; no Claude, Hermes, or `/tk` transport was used.
