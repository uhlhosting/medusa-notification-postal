# Contributing to @uhlhosting/medusa-notification-postal

Please read the local [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## Scope

This repo contains the Medusa plugin `@uhlhosting/medusa-notification-postal`.

## Release model

This plugin is released from GitHub to npm with trusted publishing, not from GitLab.

- Keep package metadata scoped to `@uhlhosting/*`
- Keep the GitHub Actions publish workflow intact unless a release fix requires a change
- Do not convert this repo to the GitLab npm release model used by the other plugins

## Contribution rules

- Keep changes focused on the plugin, not unrelated tooling cleanup
- Do not commit secrets, tokens, or credentials
- Preserve existing package behavior unless a publishing or release fix requires a change

## Local checks

Run the standard release gate before opening a merge request:

```bash
pnpm run release:check
```

If the repo contains publishable build output, also verify the package surface:

```bash
npm pack --dry-run
```
