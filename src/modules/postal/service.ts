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
  protected readonly pluginOptions_: ResolvedPostalPluginOptions

  // Medusa constructs a module service as (cradle, moduleOptions,
  // moduleDeclaration); for a plugin module the options are the plugin's own.
  constructor(...args: any[]) {
    super(...args)
    this.pluginOptions_ = resolvePostalPluginOptions(args[1])
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
