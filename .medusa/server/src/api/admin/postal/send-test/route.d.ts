import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
type SendTestBody = {
    to: string | string[];
    from?: string;
    from_name?: string;
    reply_to?: string;
    template?: string;
    subject: string;
    html?: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
    headers?: Record<string, string>;
    custom_args?: Record<string, string>;
    metadata?: Record<string, string>;
};
export declare const POST: (req: AuthenticatedMedusaRequest<SendTestBody>, res: MedusaResponse) => Promise<MedusaResponse>;
export {};
