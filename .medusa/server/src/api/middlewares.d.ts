import { z } from "@medusajs/framework/zod";
export declare const postalSettingsSchema: z.ZodObject<{
    action: z.ZodOptional<z.ZodEnum<{
        save: "save";
        test: "test";
    }>>;
    to: z.ZodOptional<z.ZodString>;
    cc: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
    bcc: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
    from_name: z.ZodOptional<z.ZodString>;
    reply_to: z.ZodOptional<z.ZodString>;
    template: z.ZodOptional<z.ZodString>;
    subject: z.ZodOptional<z.ZodString>;
    html: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    custom_args: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    settings: z.ZodOptional<z.ZodObject<{
        auth_type: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
            "smtp-api": "smtp-api";
        }>>>;
        from: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        base_url: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        api_key: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        test_to: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const postalSendTestSchema: z.ZodObject<{
    to: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    from: z.ZodOptional<z.ZodString>;
    from_name: z.ZodOptional<z.ZodString>;
    reply_to: z.ZodOptional<z.ZodString>;
    template: z.ZodOptional<z.ZodString>;
    subject: z.ZodString;
    html: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    cc: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
    bcc: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    custom_args: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.core.$strict>;
export declare const postalWebhookSchema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
export declare const postalWebhookListSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type PostalSettingsBody = z.infer<typeof postalSettingsSchema>;
export type PostalSendTestBody = z.infer<typeof postalSendTestSchema>;
export type PostalWebhookBody = z.infer<typeof postalWebhookSchema>;
export type PostalWebhookListQuery = z.infer<typeof postalWebhookListSchema>;
declare const _default: import("@medusajs/framework/http").MiddlewaresConfig;
export default _default;
