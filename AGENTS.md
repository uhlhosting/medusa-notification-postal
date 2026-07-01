# AGENTS.md

## Operating mode
- Act as a senior implementation partner
- Default to implementation-first execution
- Optimize for production correctness and smallest viable fix
- Avoid speculative rewrites and preserve existing architecture unless explicitly requested

## Shared Medusa Skills
- Follow `/Users/cosmic/Developer/MedusaJS/AGENTS.md` first.
- Then read this repo's root `SKILL.md`.
- Use the shared Medusa skills from the workspace policy when the task matches those surfaces.

## Repository Scope
- This repository is the standalone source for `@uhlhosting/medusa-notification-postal`
- Treat this repo as the canonical source for the postal plugin package
- Keep changes scoped to the postal plugin unless the user explicitly asks for broader repo or ecosystem work
- Do not import instructions, invariants, or paths from other Medusa repositories

## Working Rules
- Keep mutation logic in workflows, not routes
- Keep route handlers thin and typed
- Prefer `AuthenticatedMedusaRequest` for protected admin endpoints and enforce auth in `src/api/middlewares.ts`
- Keep workflow composition in `src/workflows/*.ts` and import workflows statically from routes and handlers
- Use Medusa SDK clients where applicable instead of raw `fetch`
- Preserve the compiled `.medusa/server` bundle as the package publish surface
- Do not add npm tokens, automation tokens, or `.npmrc` auth entries
- Use `glab` for GitLab CI and variable management, and `gh` for GitHub mirror checks when needed

## Postal Plugin Invariants
1. Provider auth mode is `smtp-api`
2. `provider_data` must carry email content and workflow metadata such as `subject`, `html`, `text`, `workflow_event`, and `workflow_run_id`
3. The admin settings route under `/admin/plugin-settings/postal` is a configuration visibility surface and must not expose secrets
4. Postal admin routes must require authenticated Medusa admin users through route-local middleware
5. Postal debug or test sends must use the plugin workflow path so trace metadata is preserved
6. Saving settings must preserve existing secrets when password or API key inputs are empty
7. Postal HTTP calls must fail fast with a bounded timeout
8. Postal webhook callbacks must use a tokenized store route, and the exact tokenized URL should be surfaced from an admin-only view rather than the settings surface
9. Settings and webhook tables are created by migrations, not on request paths
10. The admin webhook URL endpoint should return the tokenized path plus an absolute callback URL when the request origin can be resolved

## Publish and CI Rules
1. GitHub publishing must use OIDC Trusted Publishing only
2. The GitHub publish workflow must stay aligned with the npm trusted publisher configuration
3. GitLab CI is the source of truth and should mirror to GitHub only after checks pass
4. The GitLab mirror job must use a masked, protected CI/CD variable for GitHub push access
5. Keep release validation in the repo and run it before publish-related changes are signed off
6. Tag mirroring pipelines must push the tag ref specifically (using `refs/tags/...` format) to prevent conflicts with GitLab's background mirroring.
7. GitHub npm publishing must verify protected refs, package-version tag alignment, and release-branch reachability before publishing.

## Validation Checklist
1. `pnpm release:check` passes
2. `npm pack --dry-run` includes the compiled `.medusa/server` bundle
3. GitHub Actions publish workflow runs without npm tokens
4. GitLab CI validates, builds, and mirrors to GitHub on the allowed pipeline sources

## Maintenance Rule
- Update this file in the same commit whenever you change plugin architecture, auth behavior, route contracts, publish behavior, or CI/CD mirror behavior

# Project security best practices

- Always run **snyk_code_scan** tool for new first party code that is generated in a Snyk-supported language.
- If any security issues are found based on newly introduced or modified code or dependencies, attempt to fix the issues using the results context from **Snyk**.
- Rescan the code after fixing the issues to ensure that the issues were fixed and that there are no newly introduced issues.
- Repeat this process until no new issues are found.

## Release assets
- Use GitLab release assets as generic packages for distributable artifacts
- Keep release assets aligned with the published package version and tag
- Prefer Free-tier-safe release automation: avoid Ultimate-only security or release features unless explicitly requested
