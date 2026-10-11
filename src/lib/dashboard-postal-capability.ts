import { createHash, createPublicKey, verify } from "node:crypto"
import { MedusaError } from "@medusajs/framework/utils"
import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"

export const DASHBOARD_POSTAL_ASSERTION_HEADER = "x-dashboard-postal-assertion"
export const POSTAL_ACTIVITY_PATH = "/dashboard/postal/activity"
export const POSTAL_ACTIVITY_MATCHER = /^\/dashboard\/postal\/activity\/?$/i
// The host registers a bounded-timeout, shared Redis client explicitly. Medusa
// module Redis clients are isolated and there is no global "redis" resource.
export const POSTAL_ACTIVITY_REPLAY_RESOURCE = "dashboardPostalActivityReplayRedis"

export type ReplayRedis = {
  eval: (script: string, numberOfKeys: number, ...args: (string | number)[]) => Promise<unknown>
}

// One atomic shared-store operation, not separate SET calls or a process-local
// ledger. Neither identifier may be reused, even in another signed assertion.
export const POSTAL_ACTIVITY_REPLAY_SCRIPT = `
if redis.call('EXISTS', KEYS[1]) == 1 or redis.call('EXISTS', KEYS[2]) == 1 then
  return 0
end
redis.call('SET', KEYS[1], '1', 'EX', ARGV[1])
redis.call('SET', KEYS[2], '1', 'EX', ARGV[1])
return 1
`

const deny = () => new MedusaError(MedusaError.Types.NOT_ALLOWED, "Postal activity capability required")
const canonicalOrigin = (value: string) => {
  const url = new URL(value)
  return url.protocol === "https:" && !url.username && !url.password && url.origin === value
}

export async function consumePostalActivityCapability(
  assertion: unknown,
  redis: ReplayRedis,
  env: NodeJS.ProcessEnv = process.env,
  now = Math.floor(Date.now() / 1000)
) {
  try {
    const publicKey = env.DASHBOARD_POSTAL_ACTIVITY_PUBLIC_KEY
    const project = env.DASHBOARD_POSTAL_ACTIVITY_PROJECT_ID
    const environment = env.DASHBOARD_POSTAL_ACTIVITY_ENVIRONMENT
    const origin = env.DASHBOARD_POSTAL_ACTIVITY_BACKEND_ORIGIN
    const issuer = env.DASHBOARD_POSTAL_ACTIVITY_ISSUER
    const audience = env.DASHBOARD_POSTAL_ACTIVITY_AUDIENCE
    if (!publicKey || !project || !/^[1-9]\d*$/.test(project) || !environment || !origin || !canonicalOrigin(origin) || !issuer || !canonicalOrigin(issuer) || !audience || typeof redis?.eval !== "function") throw deny()
    if (typeof assertion !== "string" || assertion.length > 8192) throw deny()
    const parts = assertion.split(".")
    if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) throw deny()
    const [headerPart, bodyPart, signaturePart] = parts
    const header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8"))
    if (header.alg !== "EdDSA" || header.typ !== "JWT" || Object.keys(header).some((key) => !["alg", "typ"].includes(key))) throw deny()
    const key = createPublicKey(publicKey.replace(/\\n/g, "\n"))
    if (key.asymmetricKeyType !== "ed25519" || !verify(null, Buffer.from(`${headerPart}.${bodyPart}`), key, Buffer.from(signaturePart, "base64url"))) throw deny()
    const claims = JSON.parse(Buffer.from(bodyPart, "base64url").toString("utf8"))
    if (claims.iss !== issuer || claims.aud !== audience || claims.project_id !== project || claims.environment !== environment || claims.backend_origin !== origin || claims.scope !== "postal.activity.read") throw deny()
    if (!Number.isSafeInteger(claims.iat) || !Number.isSafeInteger(claims.exp) || claims.iat > now || claims.exp <= now || claims.exp <= claims.iat || claims.exp - claims.iat > 60) throw deny()
    if (![claims.jti, claims.nonce].every((value) => typeof value === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(value))) throw deny()
    const digest = (value: string) => createHash("sha256").update(value).digest("hex")
    const prefix = `postal-activity:{${digest(`${issuer}:${project}:${environment}:${origin}`)}}:`
    const accepted = await redis.eval(POSTAL_ACTIVITY_REPLAY_SCRIPT, 2, `${prefix}jti:${digest(claims.jti)}`, `${prefix}nonce:${digest(claims.nonce)}`, claims.exp - now)
    if (accepted !== 1) throw deny()
  } catch {
    // No signature, claims, provider data, or Redis errors reach logs/clients.
    throw deny()
  }
}

export async function authenticateDashboardPostalActivity(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  try {
    // Reject alternate methods/case/path spellings as well as credentials. The
    // global anchored guard also covers a trailing slash before route dispatch.
    // app.use(RegExp) strips the matched portion from req.path. originalUrl
    // retains the complete incoming spelling, including a trailing slash.
    if (req.method !== "GET" || req.originalUrl.split("?")[0] !== POSTAL_ACTIVITY_PATH) throw deny()
    const redis = req.scope.resolve<ReplayRedis>(POSTAL_ACTIVITY_REPLAY_RESOURCE)
    await consumePostalActivityCapability(req.headers[DASHBOARD_POSTAL_ASSERTION_HEADER], redis)
    res.setHeader("Cache-Control", "no-store")
    next()
  } catch {
    throw deny()
  }
}
