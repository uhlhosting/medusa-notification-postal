"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const constants_1 = require("../constants");
// Reconciles persisted (non-secret) Postal settings with the process
// environment at boot, so the provider — constructed from env/options — reflects
// admin-saved values after a restart. Only in-memory `process.env` is touched;
// nothing is written to disk. Secrets are never persisted, so they are never
// synced here.
const syncPostalSettingsLoader = async ({ container }) => {
    const logger = (() => {
        try {
            return container.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
        }
        catch {
            return { warn: console.warn.bind(console) };
        }
    })();
    try {
        const service = container.resolve(constants_1.POSTAL_PLUGIN_MODULE);
        const records = await service.listPostalSettings({ id: constants_1.POSTAL_SETTINGS_ID }, { take: 1 });
        const record = records?.[0];
        if (record) {
            if (record.auth_type)
                process.env.POSTAL_AUTH_TYPE = record.auth_type;
            if (record.from_address)
                process.env.POSTAL_FROM = record.from_address;
            if (record.base_url)
                process.env.POSTAL_BASE_URL = record.base_url;
            if (record.test_to)
                process.env.POSTAL_TEST_TO = record.test_to;
            if (record.pending_restart) {
                await service.updatePostalSettings({
                    id: constants_1.POSTAL_SETTINGS_ID,
                    pending_restart: false,
                });
            }
            return;
        }
        // No persisted row yet — seed one from any env-provided non-secret values so
        // the admin surface shows the effective configuration.
        const seed = {
            auth_type: process.env.POSTAL_AUTH_TYPE || "smtp-api",
            from_address: process.env.POSTAL_FROM || "",
            base_url: process.env.POSTAL_BASE_URL || "",
            test_to: process.env.POSTAL_TEST_TO || "",
        };
        if (seed.from_address || seed.base_url || seed.test_to) {
            await service.createPostalSettings({
                id: constants_1.POSTAL_SETTINGS_ID,
                ...seed,
                pending_restart: false,
            });
        }
    }
    catch (err) {
        logger.warn("[postal] Failed to sync settings from DB during boot — continuing with env-only config.", err instanceof Error ? err.message : String(err));
    }
};
exports.default = syncPostalSettingsLoader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3luYy1wb3N0YWwtc2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wb3N0YWwvbG9hZGVycy9zeW5jLXBvc3RhbC1zZXR0aW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHFEQUFxRTtBQUVyRSw0Q0FBdUU7QUFXdkUscUVBQXFFO0FBQ3JFLGlGQUFpRjtBQUNqRiwrRUFBK0U7QUFDL0UsNkVBQTZFO0FBQzdFLGVBQWU7QUFDZixNQUFNLHdCQUF3QixHQUFHLEtBQUssRUFBRSxFQUFFLFNBQVMsRUFBaUIsRUFBRSxFQUFFO0lBQ3RFLE1BQU0sTUFBTSxHQUFHLENBQUMsR0FBRyxFQUFFO1FBQ25CLElBQUksQ0FBQztZQUNILE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQyxpQ0FBeUIsQ0FBQyxNQUFNLENBRXhELENBQUE7UUFDSCxDQUFDO1FBQUMsTUFBTSxDQUFDO1lBQ1AsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFBO1FBQzdDLENBQUM7SUFDSCxDQUFDLENBQUMsRUFBRSxDQUFBO0lBRUosSUFBSSxDQUFDO1FBQ0gsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxnQ0FBb0IsQ0FPckQsQ0FBQTtRQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sT0FBTyxDQUFDLGtCQUFrQixDQUM5QyxFQUFFLEVBQUUsRUFBRSw4QkFBa0IsRUFBRSxFQUMxQixFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FDWixDQUFBO1FBQ0QsTUFBTSxNQUFNLEdBQUcsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFM0IsSUFBSSxNQUFNLEVBQUUsQ0FBQztZQUNYLElBQUksTUFBTSxDQUFDLFNBQVM7Z0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFBO1lBQ3JFLElBQUksTUFBTSxDQUFDLFlBQVk7Z0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQTtZQUN0RSxJQUFJLE1BQU0sQ0FBQyxRQUFRO2dCQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUE7WUFDbEUsSUFBSSxNQUFNLENBQUMsT0FBTztnQkFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFBO1lBRS9ELElBQUksTUFBTSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUMzQixNQUFNLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQztvQkFDakMsRUFBRSxFQUFFLDhCQUFrQjtvQkFDdEIsZUFBZSxFQUFFLEtBQUs7aUJBQ3ZCLENBQUMsQ0FBQTtZQUNKLENBQUM7WUFFRCxPQUFNO1FBQ1IsQ0FBQztRQUVELDZFQUE2RTtRQUM3RSx1REFBdUQ7UUFDdkQsTUFBTSxJQUFJLEdBQUc7WUFDWCxTQUFTLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSxVQUFVO1lBQ3JELFlBQVksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxFQUFFO1lBQzNDLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxFQUFFO1lBQzNDLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxFQUFFO1NBQzFDLENBQUE7UUFFRCxJQUFJLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdkQsTUFBTSxPQUFPLENBQUMsb0JBQW9CLENBQUM7Z0JBQ2pDLEVBQUUsRUFBRSw4QkFBa0I7Z0JBQ3RCLEdBQUcsSUFBSTtnQkFDUCxlQUFlLEVBQUUsS0FBSzthQUN2QixDQUFDLENBQUE7UUFDSixDQUFDO0lBQ0gsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixNQUFNLENBQUMsSUFBSSxDQUNULHlGQUF5RixFQUN6RixHQUFHLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQ2pELENBQUE7SUFDSCxDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBRUQsa0JBQWUsd0JBQXdCLENBQUEifQ==