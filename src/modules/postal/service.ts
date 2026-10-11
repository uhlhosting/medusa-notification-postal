import type { PostalSettingRecord } from "./settings"
import { randomUUID } from "node:crypto"
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import type { Context } from "@medusajs/framework/types"
import { MedusaService, InjectManager, InjectTransactionManager, MedusaContext } from "@medusajs/framework/utils"
import PostalSetting from "./models/postal-setting"
import PostalWebhookEvent from "./models/postal-webhook-event"
import {
  resolvePostalPluginOptions,
  type ResolvedPostalPluginOptions,
} from "./options"

class PostalPluginModuleService extends MedusaService({
  PostalSetting,
  PostalWebhookEvent,
}) {
  readonly bootSettings: Readonly<PostalSettingRecord> | null | { unavailable: true }
  protected readonly pluginOptions_: ResolvedPostalPluginOptions

  // Medusa constructs a module service as (cradle, moduleOptions,
  // moduleDeclaration); for a plugin module the options are the plugin's own.
  constructor(...args: any[]) {
    super(...args)
    this.pluginOptions_ = resolvePostalPluginOptions(args[1])
    try { this.bootSettings = args[0]?.postalBootSettings ?? null } catch { this.bootSettings = null }
  }

  @InjectManager()
  async readBootSettings(@MedusaContext() context: Context<EntityManager> = {}): Promise<PostalSettingRecord | null> {
    // Preserve PostgreSQL timestamp precision as text for exact revision fencing.
    const rows = await context.manager!.execute(`select id, auth_type, from_address, base_url, test_to, pending_restart, updated_at::text as updated_at from "postal_setting" where id = ? and deleted_at is null`, ["postal"])
    return (rows[0] as PostalSettingRecord | undefined) ?? null
  }

  @InjectManager()
  async persistPostalSettingsRevision(data: Record<string, unknown>, exists: boolean, @MedusaContext() context: Context<EntityManager> = {}): Promise<void> {
    await this.persistPostalSettingsRevision_(data, exists, context)
  }
  @InjectTransactionManager()
  protected async persistPostalSettingsRevision_(data: Record<string, unknown>, exists: boolean, @MedusaContext() context: Context<EntityManager> = {}): Promise<void> {
    if (exists) await this.updatePostalSettings(data as never, context)
    else await this.createPostalSettings(data as never, context)
    // Every accepted admin save has a distinct revision, including same-value saves.
    await context.transactionManager!.execute(`update "postal_setting" set pending_restart = true, updated_at = greatest(clock_timestamp(), updated_at + interval '1 microsecond') where id = ? and deleted_at is null`, ["postal"])
  }

  @InjectManager()
  async acknowledgeBootSettings(@MedusaContext() context: Context<EntityManager> = {}): Promise<boolean> {
    return this.acknowledgeBootSettings_(context)
  }
  @InjectTransactionManager()
  protected async acknowledgeBootSettings_(@MedusaContext() context: Context<EntityManager> = {}): Promise<boolean> {
    const snapshot = this.bootSettings
    if (!snapshot || "unavailable" in snapshot || !snapshot.updated_at) return false
    const rows = await context.transactionManager!.execute(`update "postal_setting" set pending_restart = false, updated_at = now() where id = ? and updated_at = ? and auth_type = ? and from_address = ? and base_url = ? and test_to = ? and deleted_at is null returning id`, [snapshot.id, snapshot.updated_at, snapshot.auth_type, snapshot.from_address, snapshot.base_url, snapshot.test_to])
    return Boolean(rows.length)
  }

  @InjectManager()
  async claimWebhookPublication(id: string, @MedusaContext() context: Context<EntityManager> = {}): Promise<string | null> {
    return this.claimWebhookPublication_(id, context)
  }
  @InjectTransactionManager()
  protected async claimWebhookPublication_(id: string, @MedusaContext() context: Context<EntityManager> = {}): Promise<string | null> {
    const owner = randomUUID()
    const rows = await context.transactionManager!.execute(`update "postal_webhook_events" set publication_owner = ?, publication_expires_at = now() + interval '2 minutes', updated_at = now() where id = ? and published_at is null and deleted_at is null and (publication_owner is null or publication_expires_at <= now()) returning id`, [owner, id])
    return rows.length ? owner : null
  }

  @InjectManager()
  async settleWebhookPublication(id: string, owner: string, success: boolean, @MedusaContext() context: Context<EntityManager> = {}): Promise<boolean> {
    return this.settleWebhookPublication_(id, owner, success, context)
  }
  @InjectTransactionManager()
  protected async settleWebhookPublication_(id: string, owner: string, success: boolean, @MedusaContext() context: Context<EntityManager> = {}): Promise<boolean> {
    const rows = await context.transactionManager!.execute(`update "postal_webhook_events" set published_at = case when ? then now() else published_at end, publication_owner = null, publication_expires_at = null, updated_at = now() where id = ? and publication_owner = ? and published_at is null and deleted_at is null returning id`, [success, id, owner])
    return Boolean(rows.length)
  }

  async getPluginOptions(): Promise<ResolvedPostalPluginOptions> {
    return this.pluginOptions_
  }
}

export default PostalPluginModuleService
