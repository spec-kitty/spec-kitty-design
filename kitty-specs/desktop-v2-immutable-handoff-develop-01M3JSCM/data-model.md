# Discovery data model

Audience: implementers of the source contract and offline verifier.

```mermaid
erDiagram
  SourceSnapshot ||--|{ SourceFile : pins
  SourceSnapshot ||--|{ PrimitiveFamily : covers
  PrimitiveFamily ||--|{ StateEvidence : documents
  SourceFile ||--o{ LicenseEvidence : permits
  SourceSnapshot ||--|{ GateEvidence : validates
  HandoffRecord ||--|| SourceSnapshot : references
  HandoffRecord ||--|{ SourceFile : exports
```

- **SourceSnapshot**: full Git SHA S on `develop`; repository and target branch; selected after reviewed source changes and gates.
- **PrimitiveFamily**: one of issue #470's 22 names, source form (`styles`, `elements`, or both), public consumer entry points, states/variants, and required assets.
- **SourceFile**: normalized repository-relative source or transitive asset path, byte length, SHA-256 digest, role, and license evidence reference. No absolute checkout path or mutable ref is a file identity.
- **LicenseEvidence**: SPDX identifier or explicit terms reference and source path; checked for every exported source/asset. Unknown rights are a failure, not an inferred MIT grant.
- **StateEvidence**: per-family state and theme/viewport coverage mapped to a Storybook story ID plus axe result and visual evidence ID/path at S. Missing coverage is explicit and cannot count as a pass.
- **GateEvidence**: command, result, source SHA, and evidence artifact for lint, test, build, Storybook, axe, visual, and export verification.
- **HandoffRecord**: deterministic schema/version, source S, artifact digest and file list, contract digest, and evidence IDs. The containing child commit R and eventual PR merge commit on `develop` are verified from Git ancestry and the merged PR; neither hash can be embedded in R's own content.
