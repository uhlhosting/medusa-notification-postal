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

// What `POST /admin/postal/send-test` returns. `delivery.to` is always a list;
// the top-level `to` echoes whatever form the caller sent.
export type PostalTestSendResponse = {
  success: boolean;
  workflow_run_id: string;
  to: string | string[];
  delivery: {
    id: string | null;
    to: string[];
    subject: string;
    delivered_at: string;
  };
};

// What `GET /admin/postal/messages/:id` returns: the live Postal record of one
// message and its delivery attempts. Nothing here is stored by the plugin.
export type PostalMessageDelivery = {
  id: number;
  status?: string | null;
  details?: string | null;
  output?: string | null;
  sent_with_ssl?: boolean | null;
  timestamp?: number | null;
};

export type PostalMessageResponse = {
  id: number;
  message: {
    status?: {
      status?: string | null;
      held?: boolean | null;
      last_delivery_attempt?: number | null;
    } | null;
    details?: {
      rcpt_to?: string | null;
      mail_from?: string | null;
      subject?: string | null;
      message_id?: string | null;
      timestamp?: number | null;
      direction?: string | null;
      size?: string | number | null;
      tag?: string | null;
    } | null;
  };
  deliveries: PostalMessageDelivery[];
};

export const postalMessageKey = (id: string) => ["postal-message", id] as const;

// The message route only accepts Postal's numeric message id. An `external_id`
// that is not one (the RFC Message-ID header, when Postal returned no row id)
// cannot be looked up.
export const toPostalMessageId = (value?: string | null) => {
  const id = String(value ?? "").trim();

  return /^\d+$/.test(id) ? id : null;
};

// Only fetched while the drawer is open, so it is the one query here that may
// be disabled: nothing on the page displays its data until then.
export const usePostalMessage = (id: string | null) =>
  useQuery<PostalMessageResponse>({
    queryKey: postalMessageKey(id ?? ""),
    queryFn: () =>
      sdk.client.fetch<PostalMessageResponse>(`/admin/postal/messages/${id}`),
    enabled: id !== null,
    retry: false,
  });

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
