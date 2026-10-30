import { useQuery } from "@tanstack/react-query";
import { sdk } from "./client";

export const postalSettingsKey = ["plugin-settings-postal"] as const;
export const postalHealthKey = ["postal-health"] as const;

// What `GET /admin/plugin-settings/postal` returns. Secrets never appear here,
// only whether they are configured and a masked tail of each.
export type PostalSettingsResponse = {
  provider_id: string;
  auth_type: "smtp-api";
  from: string | null;
  base_url: string | null;
  test_to: string | null;
  configured: {
    from: boolean;
    api_key: boolean;
    base_url: boolean;
    webhook_token: boolean;
  };
  secret_hints: {
    api_key_masked: string | null;
    webhook_token_masked: string | null;
  };
  pending_restart?: boolean;
};

export type PostalWebhookUrlResponse = {
  token?: string;
  path?: string;
  callback_url?: string | null;
};

// Every component that needs the saved settings calls this with the same key,
// so React Query serves them all from one request and one cache entry.
export const usePostalSettings = () =>
  useQuery<PostalSettingsResponse>({
    queryKey: postalSettingsKey,
    queryFn: () =>
      sdk.client.fetch<PostalSettingsResponse>("/admin/plugin-settings/postal"),
  });

export const isPostalConfigured = (
  settings: PostalSettingsResponse | undefined,
) =>
  Boolean(
    settings?.configured?.from &&
      settings.configured.base_url &&
      settings.configured.api_key,
  );
