export type PostalTemplateName = "default" | "postal-test" | "postal-admin-test" | "order-placed" | "password-reset" | "email-verification" | "welcome" | "abandoned-cart" | "restock-available";
export type PostalTemplateContent = {
    subject?: string;
    html?: string;
    text?: string;
};
export type PostalSenderIdentity = {
    from?: string;
    from_name?: string;
    reply_to?: string;
};
export type PostalTemplateDefinition = {
    subject: string;
    html?: string;
    text?: string;
};
export type PostalTemplateOption = {
    value: PostalTemplateName;
    label: string;
    description: string;
};
export type PostalTemplatePreview = PostalTemplateOption & {
    subject: string;
    html: string;
    text: string;
};
export type PostalTemplateExample = PostalTemplatePreview & {
    to: string;
    from: string;
    from_name: string;
    reply_to: string;
    cc: string[];
    bcc: string[];
    headers: Record<string, string>;
    workflow_event: string;
    workflow_run_id: string;
    custom_args: Record<string, string>;
    metadata: Record<string, string>;
};
export declare const POSTAL_TEMPLATE_REGISTRY: Record<PostalTemplateName, PostalTemplateDefinition>;
export declare const resolvePostalTemplate: (template?: string, content?: PostalTemplateContent) => {
    template_name: string;
    subject: string;
    html: string;
    text: string;
};
export declare const getPostalTemplateOptions: () => PostalTemplateOption[];
export declare const getPostalTemplatePreview: (template: PostalTemplateName) => PostalTemplatePreview;
export declare const getPostalTemplateExample: (template: PostalTemplateName) => PostalTemplateExample;
export declare const normalizePostalCustomArgs: (customArgs?: Record<string, unknown>) => Record<string, string>;
export declare const resolvePostalSender: (identity?: PostalSenderIdentity, fallbackFrom?: string) => {
    from: string;
    reply_to: string | undefined;
};
