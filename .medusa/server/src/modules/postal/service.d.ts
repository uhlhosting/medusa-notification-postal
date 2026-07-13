declare const PostalPluginModuleService_base: import("@medusajs/framework/utils").MedusaServiceReturnType<import("@medusajs/framework/utils").ModelConfigurationsToConfigTemplate<{
    readonly PostalSetting: import("@medusajs/framework/utils").DmlEntity<import("@medusajs/framework/utils").DMLEntitySchemaBuilder<{
        id: import("@medusajs/framework/utils").PrimaryKeyModifier<string, import("@medusajs/framework/utils").TextProperty>;
        auth_type: import("@medusajs/framework/utils").TextProperty;
        from_address: import("@medusajs/framework/utils").TextProperty;
        base_url: import("@medusajs/framework/utils").TextProperty;
        test_to: import("@medusajs/framework/utils").TextProperty;
        pending_restart: import("@medusajs/framework/utils").BooleanProperty;
    }>, "postal_setting">;
    readonly PostalWebhookEvent: import("@medusajs/framework/utils").DmlEntity<import("@medusajs/framework/utils").DMLEntitySchemaBuilder<{
        id: import("@medusajs/framework/utils").PrimaryKeyModifier<string, import("@medusajs/framework/utils").TextProperty>;
        event_type: import("@medusajs/framework/utils").TextProperty;
        status: import("@medusajs/framework/utils").TextProperty;
        message_id: import("@medusajs/framework/utils").NullableModifier<string, import("@medusajs/framework/utils").TextProperty>;
        recipient: import("@medusajs/framework/utils").NullableModifier<string, import("@medusajs/framework/utils").TextProperty>;
        occurred_at: import("@medusajs/framework/utils").NullableModifier<Date, import("@medusajs/framework/utils").DateTimeProperty>;
        payload: import("@medusajs/framework/utils").JSONProperty;
    }>, "postal_webhook_events">;
}>>;
declare class PostalPluginModuleService extends PostalPluginModuleService_base {
}
export default PostalPluginModuleService;
