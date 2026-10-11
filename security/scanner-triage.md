# GitLab scanner triage

Baseline main pipeline18356, SAST111041:7findings (2High,5Medium); secret detection111042:0. Latest pipeline IDs and changed trust boundaries require individual review. Scanner job success is not zero findings.

| Severity | Finding ID | Baseline location | Source-grounded review |
| --- | --- | --- | --- |
| High | `e74079609f3ed987c0ce9600433c42570466f68f0bb11ebfb1c7f50a11ffd22a` | `scripts/verify-release.mjs:137` | Fixed HTTPS registry.npmjs.org origin with encoded dependency/version path segments, redirect rejection and ten-second deadline. Trusted development metadata boundary. |
| High | `8e11a5954bb5c9047bcfe7ac0cd2f319a0ac5d7b5519b36390798fc28a2b4367` | `src/providers/postal/services/postal.ts:456` | Destination is immutable operator-owned provider boot configuration, not a request URL. Legitimate self-hosted HTTP/HTTPS remains supported. Credentials/query/fragment rejected, redirects forbidden, full response deadline and1MiB size bound. Explicit trusted integration boundary; plain HTTP requires a trusted network. |
| Medium | `6eaca2986adced21b8347e3fb339f290b224d5bf9cc308ad092321129c8c2af4` | `scripts/security-summary.mjs:20` | Checks constant scanner report filenames under trusted CI working directory. No uploaded/request path. |
| Medium | `586495778b7e5ee2fe59c84975ef8ce460b5fd0e68e89c388b6e9b4374a8ef4b` | `scripts/security-summary.mjs:21` | Reads those same constant scanner report filenames. Report content is untrusted; secret output remains metadata only. |
| Medium | `63317459aeae2bbaddf3e134f40ce1603060accbf5a777a63da9728895bf599a` | `scripts/verify-release.mjs:29` | Reads package.json under trusted checkout directory. No runtime/request filename. |
| Medium | `275ef2d61c719e88927cd24b73b954e1ca494534d8c32e43daad9caf445db56f` | `scripts/verify-release.mjs:37` | Checks exports from trusted repository package metadata. Source editors already control build configuration. |
| Medium | `27ffad2e1262a5dd4d7df37ed0f49e3fb273a0c39d36df76d781724cbc1a4263` | `src/providers/postal/services/postal.ts:684` | The prior tag-stripping expression could scan repeatedly on angle-bracket-heavy input. Replaced with a linear single-pass character walk, retaining text fallback behavior. Verify current scanner removes this finding. |
