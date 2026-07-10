# Contributing to @uhlhosting/medusa-notification-postal

Please read the local [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## Scope

This repo contains the Medusa plugin `@uhlhosting/medusa-notification-postal`.

## Release model

Releases are automated with [semantic-release](https://docs.gitlab.com/ci/examples/semantic-release/) on GitLab CI. On every push to the default branch, the `release:semantic` job analyzes the commits since the last tag, computes the next version, publishes to the GitLab npm registry, creates a GitLab Release, and pushes the bumped `package.json` and `v*` tag back.

- **Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/)** — the type determines the version bump:
  - `fix:` → patch (`0.1.x`)
  - `feat:` → minor (`0.x.0`)
  - `feat!:` or a `BREAKING CHANGE:` footer → major (`x.0.0`)
  - `chore:`, `docs:`, `ci:`, `test:`, `refactor:` → no release
- Never hand-edit the `version` in `package.json`; semantic-release owns it.
- Keep package metadata scoped to `@uhlhosting/*`.
- The public npmjs mirror is still published from GitHub via OIDC trusted publishing on mirrored tags; keep the GitHub Actions publish workflow aligned with the tags semantic-release creates.

## Contribution rules

- Keep changes focused on the plugin, not unrelated tooling cleanup
- Do not commit secrets, tokens, or credentials
- Preserve existing package behavior unless a publishing or release fix requires a change
- Use Conventional Commit messages so releases version correctly

## Local checks

Run the standard release gate before opening a merge request:

```bash
pnpm run release:check
```

If the repo contains publishable build output, also verify the package surface:

```bash
npm pack --dry-run
```
