# Production readiness migration

Requires Medusa 2.21.2 and UI 4.2.6. Stop callback handling/publication workers, back up the database, apply the module migration and upgrade every server/worker before resuming. No live migrations were performed during development.

The callback contract now preserves numeric Postal per-recipient IDs and recurring delay/engagement events. Retry identity is the provider UUID plus event type when present; legacy callbacks without UUID use canonical JSON SHA256, including callbacks lacking message IDs. Only the digest and redacted lifecycle metadata are stored. Historical rows keep NULL digests and are treated as previously published, avoiding unsafe historical replay. Rollback cannot automatically discard durable publication/replay receipts.

Publication receipts recover bus failures only with a durable shared production Event Bus provider configured on every server and worker; an in-memory test bus does not prove durable production delivery. A timed-out emission can still be accepted late, so consumers must deduplicate stable IDs. The minute job processes up to 100 due records in updated-at/id order, rotates failures behind newer attempts and stops starting work after 30s; a two-minute owner lease recovers worker crashes. Acknowledged callbacks do not re-emit. Unknown bus acknowledgment can emit again with the same stable event ID; downstream consumers must deduplicate that ID. Callback retention removes these receipts and must remain disabled until its replay horizon is approved.

Postal HTTP destinations are trusted operator boot configuration, including internal self-hosted HTTP/HTTPS origins. Restrict configuration access and network egress accordingly. URL credentials/query/fragment and redirects are rejected, response bodies are bounded to 1 MiB, and the 1-60s deadline covers the entire response. Provider error detail is redacted. This policy does not claim public-only DNS/address enforcement.

Automatic GitLab push mirror 6 was disabled on 2026-10-11. GitHub synchronization is manual only after current-main CI gates. Configure protected GITHUB_MIRROR_SSH_PRIVATE_KEY and GITHUB_MIRROR_KNOWN_HOSTS from independently verified GitHub host keys before using that job. No credential rotation or GitHub sync was performed.

Repository dependency overrides do not propagate into applications. The full source graph is audited with exact path/version fingerprints for two proposed residual highs (unpatched braces and Medusa's coupled GraphQL utils major), expiring 2026-11-07; these are not production acceptance. The independent consumer audit records stock and explicit application lodash/ajv override graphs. Actual email/provider delivery and deployed runtime remain separate release gates.

Primary contracts: https://docs.postalserver.io/developer/webhooks/ and https://docs.medusajs.com/learn/debugging-and-testing/testing-tools/integration-tests.

## Validation evidence

Node 24 LTS and pnpm 11.25.0 frozen installation, 234 unit tests, 3 native module tests, 6 native HTTP tests, strict backend/Admin typechecks, lint, build and exact package verification pass. Independent consumer stock graph: 0 critical, 3 high, 6 moderate; explicit compatible application lodash/ajv overrides: 0 critical, 2 high, 4 moderate. Source full graph after compatible security patches: 0 critical, 2 high, 4 moderate, 1 low. Source/consumer checks do not prove production mail delivery, migration application or deployed runtime.
