import type { PostalNotificationService } from "./services/postal";
export declare const POSTAL_PROVIDER_CONTAINER_KEY = "np_postal";
type ProviderScope = {
    resolve: (key: string) => unknown;
};
export declare const resolvePostalProvider: (scope: ProviderScope) => PostalNotificationService;
export {};
