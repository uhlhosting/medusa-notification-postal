import type { PostalTemplateName } from "../../providers/postal/templates";
type SendPostalEmailStepInput = {
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
export declare const sendPostalEmailStep: import("@medusajs/framework/workflows-sdk").StepFunction<SendPostalEmailStepInput, {
    id: any;
    to: string[];
    subject: string;
    delivered_at: string;
    deliveries: {
        id: any;
    }[];
}>;
declare const buildProviderData: (input: SendPostalEmailStepInput) => {
    from: string | undefined;
    from_name: string | undefined;
    reply_to: string | undefined;
    cc: string | string[] | undefined;
    bcc: string | string[] | undefined;
    headers: Record<string, string> | undefined;
    custom_args: Record<string, unknown> | undefined;
    metadata: Record<string, unknown> | undefined;
    workflow_event: string | undefined;
    workflow_run_id: string | undefined;
};
export declare const buildPostalNotificationInput: (input: SendPostalEmailStepInput, to: string, template: string, providerData: ReturnType<typeof buildProviderData>) => any;
export {};
