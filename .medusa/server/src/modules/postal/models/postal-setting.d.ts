export declare const PostalSetting: import("@medusajs/framework/utils").DmlEntity<import("@medusajs/framework/utils").DMLEntitySchemaBuilder<{
    id: import("@medusajs/framework/utils").PrimaryKeyModifier<string, import("@medusajs/framework/utils").TextProperty>;
    auth_type: import("@medusajs/framework/utils").TextProperty;
    from_address: import("@medusajs/framework/utils").TextProperty;
    base_url: import("@medusajs/framework/utils").TextProperty;
    test_to: import("@medusajs/framework/utils").TextProperty;
    pending_restart: import("@medusajs/framework/utils").BooleanProperty;
}>, "postal_setting">;
export default PostalSetting;
