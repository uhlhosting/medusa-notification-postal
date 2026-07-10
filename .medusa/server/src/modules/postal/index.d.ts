import PostalPluginModuleService from "./service";
export { POSTAL_PLUGIN_MODULE } from "./constants";
declare const _default: import("@medusajs/types").ModuleExports<typeof PostalPluginModuleService> & {
    linkable: {
        readonly postalSetting: {
            id: {
                serviceName: "postalPlugin";
                field: "postalSetting";
                linkable: "postal_setting_id";
                primaryKey: "id";
            };
            toJSON: () => {
                serviceName: "postalPlugin";
                field: "postalSetting";
                linkable: "postal_setting_id";
                primaryKey: "id";
            };
        };
        readonly postalWebhookEvents: {
            id: {
                serviceName: "postalPlugin";
                field: "postalWebhookEvents";
                linkable: "postal_webhook_events_id";
                primaryKey: "id";
            };
            toJSON: () => {
                serviceName: "postalPlugin";
                field: "postalWebhookEvents";
                linkable: "postal_webhook_events_id";
                primaryKey: "id";
            };
        };
    };
};
export default _default;
