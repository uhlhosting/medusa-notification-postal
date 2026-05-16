# @uhlhosting/medusa-notification-postal

Postal notification provider for Medusa, modeled after the SendGrid provider service contract.

## Options

- `api_key` - Postal server API key used in `X-Server-API-Key`
- `from` - default sender e-mail address
- `base_url` - Postal base URL, e.g. `https://post.uhlhosting.ch`

## Usage

Add to `apps/backend/medusa-config.ts` under the notification module providers.
