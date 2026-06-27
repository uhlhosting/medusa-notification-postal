## Description

Provide a clear description of the changes introduced by this pull request, the motivation behind them, and how they solve the problem.

## Related Issue

Fixes # (issue number)

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Chore / Documentation / Refactoring

## Technical Checklist

Please check off all items that apply to your code changes:

- [ ] Mutation logic is kept in workflows, not in routes.
- [ ] Route handlers are thin and typed.
- [ ] Medusa SDK clients are used instead of raw `fetch` where applicable.
- [ ] Postal HTTP calls have a bounded timeout and fail fast.
- [ ] Empty password/API key inputs on settings save preserve the existing secrets.
- [ ] Secrets (like passwords or API keys) are not exposed on the configuration route `/admin/plugin-settings/postal`.

## Verification & Publishing Checklist

- [ ] `pnpm release:check` passes successfully.
- [ ] Checked `npm pack --dry-run` to ensure the compiled `.medusa/server` bundle is included.
- [ ] No npm tokens or private `.npmrc` files are committed.
