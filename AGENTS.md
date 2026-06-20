# AGENTS.md

## Operating mode
- Act as a senior implementation partner
- Default to implementation-first execution
- Optimize for production correctness and smallest viable fix
- Avoid speculative rewrites and preserve existing architecture unless explicitly requested

## Agent Skills Routing & Reference

When executing tasks in this repository, you must actively load and consult the appropriate local agent skills located in the [.agents/skills/](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills) directory. These skills contain custom guardrails, architecture patterns, and reference documentation specific to this codebase that are NOT available via external searches or generic LLM context.

### Core Domain Skills

| Skill Folder / Link | Key Purpose & When to Apply | Recommended Reference Files to Load First |
| :--- | :--- | :--- |
| [building-with-medusa](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/building-with-medusa/SKILL.md) | **REQUIRED for all Medusa backend tasks.** Use when planning, researching, or writing modules, workflows, steps, API routes, data models, or module links. | - [custom-modules.md](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/building-with-medusa/reference/custom-modules.md)<br>- [workflows.md](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/building-with-medusa/reference/workflows.md)<br>- [api-routes.md](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/building-with-medusa/reference/api-routes.md)<br>- [module-links.md](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/building-with-medusa/reference/module-links.md)<br>- [querying-data.md](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/building-with-medusa/reference/querying-data.md) |
| [building-admin-dashboard-customizations](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/building-admin-dashboard-customizations/SKILL.md) | **REQUIRED for all Admin UI changes.** Use when creating or modifying custom routes (`src/admin/routes`) or widgets (`src/admin/widgets`). | - [data-loading.md](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/building-admin-dashboard-customizations/references/data-loading.md)<br>- [forms.md](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/building-admin-dashboard-customizations/references/forms.md)<br>- [display-patterns.md](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/building-admin-dashboard-customizations/references/display-patterns.md)<br>- [navigation.md](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/building-admin-dashboard-customizations/references/navigation.md) |
| [building-storefronts](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/building-storefronts/SKILL.md) | **REQUIRED for storefront API integration.** Use when making storefront queries/mutations, setting up custom API route hooks, or using the Medusa JS SDK. | - Consult storefront integration files |
| [storefront-best-practices](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/storefront-best-practices/SKILL.md) | **REQUIRED for storefront visual / feature work.** Covers ecommerce UI/UX guidelines, checkout/cart components, layout structure, and SEO. | - [design.md](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/storefront-best-practices/reference/design.md)<br>- [connecting-to-backend.md](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/storefront-best-practices/reference/connecting-to-backend.md)<br>- [medusa.md](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/storefront-best-practices/reference/medusa.md)<br>- [seo.md](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/storefront-best-practices/reference/seo.md) |

### Database & Utility Skills

| Skill Folder / Link | Key Purpose & When to Apply | Allowed/Standard Command Patterns |
| :--- | :--- | :--- |
| [db-generate](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/db-generate/SKILL.md) | **Generate database migrations** for a custom module. | `npx medusa db:generate <module-name>` |
| [db-migrate](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/db-migrate/SKILL.md) | **Execute pending migrations** to align database schema. | `npx medusa db:migrate` |
| [new-user](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/new-user/SKILL.md) | **Create a new admin user** locally or in production environment. | `npx medusa user -e <email> -p <password>` |
| [learning-medusa](file:///Users/cosmic/Developer/MedusaJS/Tabaklaedeli/.agents/skills/learning-medusa/SKILL.md) | Guided developer instructions / tutorials for learning Medusa architecture. | Standard training sequences |

## Repository guardrails
- Canonical Medusa runtime surfaces are under `apps/backend` and `apps/storefront`
- Treat `plugins/medusa-plugin-woocommerce-import` as non-canonical until it is explicitly wired into workspace and backend config
- Treat `plugins/medusa-plugin-age-verification` as canonical owner for persisted age-verification records and route middleware
- Avoid duplicating business logic between `apps/backend/src` and plugin copies
- Keep plugin admin HTTP calls on Medusa SDK clients, not raw `fetch`, unless a browser upload flow strictly requires multipart fallback

## Backend standards
- Follow Medusa layering strictly: module -> workflow -> route
- Keep mutation logic in workflows, not routes
- Use only supported route methods and typed request/response contracts
- Keep import endpoints resilient with clear error payloads for admin UI consumers
- Keep protected store actions enforceable server-side, not only by storefront UI checks

## Storefront standards
- Use Medusa SDK clients, not raw fetch, for Medusa API calls
- Keep dynamic product and collection routes stable for imported catalog data
- Fail gracefully during static generation when backend is temporarily unreachable
- Age verification must be treated as a blocking commerce precondition for add-to-cart and checkout progression

## Validation checklist for WooCommerce import
1. Admin route responds on `POST /admin/woocommerce-import`
2. Admin page route loads at `/app/external-sync`
3. Import response includes `success`, `imported_count`, `skipped_count`, `error_count`, `errors`, `skipped_handles`
4. Imported products resolve on storefront routes:
   - `/{countryCode}/products/{handle}`
   - `/{countryCode}/collections/{handle}`
5. Backend build and storefront build/dev checks pass for the active environment

## UI UX parity checklist
1. Compare storefront navigation hierarchy, hero messaging, search interactions, and footer/legal surfaces against `tabaklaedeli.ch`
2. Validate desktop and mobile rendering for home, category, product, cart, checkout, and account routes
3. Record intentional divergences explicitly before release

## Age verification invariants
1. Default scope is sitewide storefront gate
2. Unverified sessions must be blocked from `POST /store/carts/:id/line-items` and `POST /store/carts/:id/complete`
3. Storefront gate state and backend enforcement state must stay aligned per request via explicit headers/cookies
4. Every deploy validation must include manually passing the gate (`Ich bin 18+`) and confirming expected browser console output contains no new errors or warnings related to age verification
5. Backend gate enforcement must validate persisted verification records server-side for customer/cart context and must not trust client-provided verification headers alone
6. For Swiss tobacco and nicotine commerce, `minimum_age` must be enforced at `>= 18` in both admin UI input bounds and backend settings normalization

## Custom Tier Module and Link Invariants
1. Custom Tier module resolves to the standard service named `"tier"`.
2. Tiers can be linked to Core Customers using the link definition defined in `src/links/tier-customer.ts`.
3. In unified graph queries, the relationship supports bidirectional traversal (querying `tier` with `customers.*`, and `customer` with `tier.*`) using the query engine (`query.graph`).

## AGENTS maintenance rule
- After each implementation batch that changes architecture, auth, route contracts, or UX gate behavior, update this file in the same commit with new invariants and validation checks
- Before release sign-off, include one browser validation pass that checks age-gate interaction and browser console logs

## Safety rules
- Flag destructive actions before execution
- If fast root-cause isolation fails, prefer reverting to last known-good commit and re-validating end-to-end

## Resolved Deployment Invariants
1. **ts-node Runtime Type Safety**: When using `ts-node` at runtime, resolved custom modules (e.g. `LOYALTY_MODULE`, custom `tier` service, etc.) resolve to type `unknown`. To bypass strict runtime compile error `TS18046`, they must be cast explicitly using `as any` (e.g. `req.scope.resolve(LOYALTY_MODULE) as any` or `container.resolve(MODULE) as any`).
2. **Production Admin index.html Routing**: Medusa's production admin panel expects the build assets (`index.html` and assets folder) to exist in the `public/admin` folder relative to the root directory from which the process is launched. Symlinking `.medusa/server/public` to `apps/backend/public` ensures index.html is consistently resolved.
3. **E2E verification of custom Tier and Customer links**: Verified successfully on production backend using `/tiers-test` which validates bidirectional traversal with the query graph engine (`query.graph`).
4. **Invoice Configuration Resolution**: The custom `invoiceGenerator` module must be explicitly registered inside the `modules` array of `medusa-config.ts` so that it is properly initialized and can be resolved by workflows and route controllers.
5. **Storefront Key Synchronization**: Storefront env-driven `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` bakes into client assets during the build step. Any database migration or local database override requires a remote storefront build (`npm run build`) to align runtime active API tokens.
6. **Native Multi-Language Translation and Localization**: Active store locales are persisted under the `store_locale` table in the database and queried dynamically via `/store/locales`. Translations map to target entities (such as products, categories, variants) via the `translation` table schema mapping `reference` names to lowercase entity types (e.g. `'product'`). Intercepting header injection via custom storefront `sdk.client.fetch` appends the selected `x-medusa-locale` header to preserve localized catalog queries across all server and client calls.
7. **Postal Notification Provider Auth Modes**: The `@uhlhosting/medusa-notification-postal` provider supports three explicit auth modes in provider options - `smtp-api`, `smtp-ip`, and `smtp`. Use `auth_type` to select mode and provide only the required credentials for that mode (`base_url` + `api_key` for `smtp-api`, SMTP host/port settings for `smtp-ip`, and SMTP host plus credentials for `smtp`).
8. **Postal Provider Data Contract**: For Medusa workflow compatibility, email content and metadata for Postal must be passed in `provider_data` (for example `subject`, `html`, `text`, `workflow_event`, `workflow_run_id`) rather than custom nested payloads under `data.provider_data`.
9. **Postal Admin Settings Surface**: The admin settings route `/admin/plugin-settings/postal` reports runtime Postal configuration visibility (`provider_id`, `auth_type`, `configured`, optional `from` and `base_url`). Treat this as a configuration visibility endpoint, not delivery assurance.
10. **Age Verification Deploy Invariant**: Age-verification plugin API/middleware and workflow artifacts must be present in `.medusa/server/src` after plugin build, and deploy flow must run `npx medusa db:migrate` to ensure `age_verification_record` exists before runtime validation.
11. **Woo Nuke Inventory Invariant**: `nuke_imported_data` must clear inventory levels to zero and delete linked inventory items (including final sweep leftovers), so imported catalog cleanup leaves no stale stock quantities behind.
12. **Production Worker Split Invariant**: production-like deployments run separate Medusa processes for `MEDUSA_WORKER_MODE=server` and `MEDUSA_WORKER_MODE=worker` (worker with `DISABLE_MEDUSA_ADMIN=true`) instead of relying on shared mode.
13. **Woo Customer Account Mapping Invariant**: Woo customer sync must set `has_account=true` for registered Woo users (role/username-based) and upgrade previously imported Woo guest records when source users are registered, to avoid collapsing all imported customers into guest-only Medusa records.
14. **Woo Nuke Reporting Invariant**: nuke responses must return a cleanup breakdown (`customersDeleted`, `productsDeleted`, `inventoryItemsDeleted`, `categoriesDeleted`, `collectionsDeleted`) so admin UX can show exactly what was removed, not only aggregate product counts.
15. **Plugin Settings Persistence Invariant**: Admin plugin setting routes under `/admin/plugin-settings/*` must support persisted editable values and return effective runtime settings on `GET`.
16. **Age Gate Settings Reflection Invariant**: Age verification middleware must evaluate persisted `admin_settings` gate flags before enforcing cart line-item and checkout blocks so admin changes reflect on backend enforcement.
17. **Saferpay Callback Locale Invariant**: The storefront payment callback endpoint must not hardcode `/ch`; it must resolve checkout redirects from `country_code` callback context and fallback to `NEXT_PUBLIC_DEFAULT_REGION`.
18. **Saferpay Notify URL Invariant**: Saferpay `notify_url` should default to `${MEDUSA_BACKEND_URL}/hooks/payment/saferpay_saferpay` when not explicitly provided, and webhook payload parsing must accept both snake_case and camelCase token/transaction fields.
19. **Saferpay Settings Secrecy Invariant**: `/admin/plugin-settings/saferpay` must never return raw password values; password updates are optional and empty password input means keep existing secret.
20. **Saferpay Restart Semantics Invariant**: Saving Saferpay settings persists intended config and returns `requires_restart=true`; provider runtime state is applied on backend process restart, not hot env mutation.
21. **Age Gate Continuation Invariant**: After successful age verification, users must be redirected back to their original in-app path (including checkout/callback query params), not always to country homepage.
22. **Saferpay Callback Origin Invariant**: Callback completion redirects must derive public origin from forwarded proxy headers when present, to avoid localhost/internal-host redirects in production.
23. **Saferpay Liability Strictness Invariant**: For card-like payment methods, authorization must require liability-shift compliance; non-compliant liability outcomes must not be treated as authorized.
24. **Saferpay Operation Idempotency Invariant**: Capture, cancel, refund, and callback handling must be safe under retries and duplicate callbacks, with no duplicate remote mutations for already-finalized states.
25. **Saferpay Admin Policy Invariant**: Saferpay admin settings must include language and pending-timeout policy controls with validated bounds, and diagnostics must expose effective notify URL plus last validation snapshot without secret leakage.
26. **Saferpay Runtime Policy Wiring Invariant**: Backend payment provider options in `medusa-config.ts` must include `language`, `pending_timeout_minutes`, and `pending_timeout_policy`, sourced from `SFP_LANGUAGE`, `SFP_PENDING_TIMEOUT_MINUTES`, and `SFP_PENDING_TIMEOUT_POLICY`.
27. **Saferpay Pending Resolution Invariant**: Pending transactions must persist timeout metadata at authorization and, when policy is `cancel`, `getPaymentStatus` must auto-cancel only after timeout expiry.
28. **Saferpay Environment Guard Invariant**: Authorize, capture, cancel, refund, and status operations must reject persisted payment data when its stored environment does not match the current provider runtime environment.
29. **Woo Health Workflow Invariant**: WooCommerce credential and connectivity checks exposed by admin health endpoints must execute through plugin workflows/steps, not direct route-level service calls.
30. **Postal Send Workflow Invariant**: Postal debug/test sends must execute via plugin workflow (`send-postal-email`) so provider delivery includes explicit workflow event and run-id context for traceability.
31. **Deploy Restart Completeness Invariant**: Production sync/restart flows must restart and verify all three runtime services - backend server, backend worker, and storefront - so no stale worker process remains on old code or env.
32. **Customer Tier Deletion and Cascade Invariant**: Deleting a customer tier executes `deleteTierWorkflow`, which deletes the tier, explicitly clears associated `tier_rules` to prevent orphaned database entries, and cleans up remote links (tier-to-customer links) cascade-wise via Medusa's link engine.
33. **WooCommerce Settings Persistence and Precedence Invariant**: WooCommerce settings are synchronized to `.env` using atomic temp-file-and-rename operations with automatic backups (`.env.bak`) to prevent corruption. In-memory `process.env` is bypassed in favor of dynamic parsed on-disk `.env` values when resolving active WooCommerce credentials to prevent desynchronization of configuration in multi-process worker deployments.
34. **WooCommerce Concurrency and Image Sync Invariant**: Product catalog import and API sync workflows execute remote image uploads concurrently using a batch partition size of `5`. Uploaded image assets are stored using the standard `woo-` filename prefix in S3/MinIO via the core `FILE` module, and rewritten thumbnail URLs are mapped back to their respective parent models.
35. **Plugin Workflow Verification and Compliance Invariant**: Custom plugin workflows (`set-age-verification`, `send-postal-email`, `test-woocommerce-connection`, `sync-woocommerce-api`, and `import-woocommerce-products`) are fully typed, use only regular synchronous functions for workflow declarations, perform all variables/object transformations inside `transform()` to preserve lazy execution, and are documented programmatically in their respective plugin READMEs.
36. **Postal Secret Persistence Boundary**: Postal admin settings must persist only non-secret runtime configuration in the DB-backed settings record. `POSTAL_API_KEY` and `POSTAL_SMTP_PASS` must be preserved from the current runtime state when empty values are submitted and must not be re-serialized into the DB settings blob on save.
37. **Postal HTTP Timeout Invariant**: Postal admin lookup and provider API requests must fail fast on unresponsive endpoints instead of hanging indefinitely; use a bounded request timeout for Postal HTTP calls.
