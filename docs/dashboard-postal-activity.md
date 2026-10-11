# Dashboard Postal activity capability

`GET /dashboard/postal/activity` is a separate server-to-server read surface.
It does not accept Medusa session, bearer or API-key credentials as a substitute
for the dedicated `x-dashboard-postal-assertion` header.

## Required host configuration

Set these six environment variables through the host's secret/configuration
management. Do not reuse federation, Admin or Postal keys:

- `DASHBOARD_POSTAL_ACTIVITY_PUBLIC_KEY` - dedicated Ed25519 public PEM key
- `DASHBOARD_POSTAL_ACTIVITY_PROJECT_ID` - immutable numeric GitLab project ID as a string
- `DASHBOARD_POSTAL_ACTIVITY_ENVIRONMENT` - exact environment name
- `DASHBOARD_POSTAL_ACTIVITY_BACKEND_ORIGIN` - canonical external HTTPS origin, no path or trailing slash
- `DASHBOARD_POSTAL_ACTIVITY_ISSUER` - canonical HTTPS dashboard origin
- `DASHBOARD_POSTAL_ACTIVITY_AUDIENCE` - exact dedicated activity audience

The host must also register `dashboardPostalActivityReplayRedis` in the global
Medusa container visible to request scopes. Medusa's module-local Redis clients
are not a global `redis` resource. Without this registration, access fails closed.
This is a required deployment prerequisite, not optional fallback behavior.

The host-owned client must implement the ioredis-compatible contract:

```ts
type ReplayRedis = {
  eval(script: string, numberOfKeys: number, ...args: (string | number)[]): Promise<unknown>
}
```

The published package exposes `ReplayRedis` and
`POSTAL_ACTIVITY_REPLAY_RESOURCE` through
`@uhlhosting/medusa-notification-postal/lib/dashboard-postal-capability`.
The host should expose a registered custom module service named
`dashboardPostalActivityReplayRedis` implementing this contract. Medusa exposes
registered module services to request scopes; a module loader's local resource
registration alone does not expose the client to those scopes. The service must
create and manage a client using its explicitly declared Redis dependency and
existing Redis configuration, with bounded connection/command
timeouts, offline queue disabled and bounded retries. Register it at startup,
share its durable server across replicas, and close the client at host shutdown.
Never create a new client on each request, log its URL, or substitute an in-memory
ledger. This plugin introduces no undeclared/transitive Redis dependency.

The plugin executes one atomic Lua operation that rejects reuse of either `jti`
or `nonce` and writes SHA-256 identifiers with the assertion's remaining TTL.
Keys use the dedicated `postal-activity` prefix and a tenant-bound Redis Cluster
hash tag. Redis failure, absent `eval`, and non-numeric success fail closed.

## Assertion and response

Header is a compact JWT signed with Ed25519, with exactly `{ alg: "EdDSA", typ: "JWT" }`.
Claims bind exact `iss`, `aud`, `project_id`, `environment`, `backend_origin`, and
`scope: "postal.activity.read"`. Integer `iat`/`exp` permit at most 60 seconds,
with no future issuance or clock-skew grace. `jti` and `nonce` each contain
16-128 URL-safe characters and must be unique. The browser must never receive
the assertion or private signing key.

Only the canonical path and GET method are accepted. Global middleware checks
`originalUrl`, because Express strips a regex-mounted prefix from `req.path`.
Trailing slash and case variants, HEAD, POST and OPTIONS are rejected.

Query accepts only integer `limit` (1-100, default 25) and `offset`
(0-10000, default 0). Unknown fields and duplicate/array values are rejected.
Response is `events`, `count`, `limit`, `offset` with `Cache-Control: no-store`.
Every event contains exactly `id`, `event_type`, `status`, `message_id`,
`occurred_at`, `created_at`. No recipient, content or provider payload is returned.
The database query enforces a rolling 30-day `created_at` floor and deterministic
descending `created_at`, `id` pagination. Physical deletion is still governed
by the existing opt-in retention jobs; this endpoint never changes their policy.

Before enabling a tenant, validate the host module-service registration, plugin release,
chart server configuration, scoped dashboard network access, authenticated
dashboard authorization and live replay rejection on the deployed backend.
