export declare const PostalWebhookEvent: import("@medusajs/framework/utils").DmlEntity<import("@medusajs/framework/utils").DMLEntitySchemaBuilder<{
    id: import("@medusajs/framework/utils").PrimaryKeyModifier<string, import("@medusajs/framework/utils").TextProperty>;
    event_type: import("@medusajs/framework/utils").TextProperty;
    status: import("@medusajs/framework/utils").TextProperty;
    message_id: import("@medusajs/framework/utils").NullableModifier<string, import("@medusajs/framework/utils").TextProperty>;
    recipient: import("@medusajs/framework/utils").NullableModifier<string, import("@medusajs/framework/utils").TextProperty>;
    occurred_at: import("@medusajs/framework/utils").NullableModifier<Date, import("@medusajs/framework/utils").DateTimeProperty>;
    payload: import("@medusajs/framework/utils").JSONProperty;
}>, "postal_webhook_events">;
export default PostalWebhookEvent;
