import { ReturnWorkflow } from "@medusajs/framework/workflows-sdk";
import type { PostalTemplateName } from "../providers/postal/templates";
export type SendPostalEmailWorkflowInput = {
    to: string | string[];
    from?: string;
    from_name?: string;
    reply_to?: string;
    template?: PostalTemplateName | string;
    provider_data: {
        from?: string;
        from_name?: string;
        reply_to?: string;
        subject: string;
        html?: string;
        text?: string;
        cc?: string | string[];
        bcc?: string | string[];
        headers?: Record<string, string>;
        custom_args?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
        workflow_event?: string;
        workflow_run_id?: string;
    };
};
export type SendPostalEmailWorkflowResult = {
    success: boolean;
    delivery: {
        id: string | null;
        to: string[];
        subject: string;
        delivered_at: string;
        deliveries: Array<{
            id: string | null;
        }>;
    };
    deliveries: Array<{
        id: string | null;
    }>;
};
export declare const sendPostalEmailWorkflow: ReturnWorkflow<SendPostalEmailWorkflowInput, SendPostalEmailWorkflowResult, [
]>;
