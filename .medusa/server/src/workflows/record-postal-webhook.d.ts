import { ReturnWorkflow } from "@medusajs/framework/workflows-sdk";
import type { PostalWebhookRecord } from "../modules/postal/webhooks";
export type RecordPostalWebhookWorkflowInput = Record<string, unknown>;
export declare const recordPostalWebhookWorkflow: ReturnWorkflow<RecordPostalWebhookWorkflowInput, PostalWebhookRecord | null, [
]>;
