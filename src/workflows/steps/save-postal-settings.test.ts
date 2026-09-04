import test from "node:test"
import assert from "node:assert/strict"
import { POSTAL_SETTINGS_ID } from "../../modules/postal/constants"
import type {
  PostalSettingRecord,
  PostalSettingService,
} from "../../modules/postal/settings"
import { restorePostalSettings } from "./save-postal-settings"

const existing: PostalSettingRecord = {
  id: POSTAL_SETTINGS_ID,
  auth_type: "smtp-api",
  from_address: "original@example.com",
  base_url: "https://postal.example.com",
  test_to: "test@example.com",
  pending_restart: false,
}

const createService = () => {
  const updates: Array<Record<string, unknown>> = []
  const deletes: Array<string | string[]> = []
  const service: PostalSettingService = {
    listPostalSettings: async () => [],
    createPostalSettings: async () => undefined,
    updatePostalSettings: async (data) => {
      updates.push(data)
    },
    deletePostalSettings: async (ids) => {
      deletes.push(ids)
    },
  }
  return { service, updates, deletes }
}

test("settings compensation restores the exact previous row", async () => {
  const { service, updates, deletes } = createService()

  await restorePostalSettings(service, { existing })

  assert.deepEqual(updates, [existing])
  assert.deepEqual(deletes, [])
})

test("settings compensation removes a row created by the workflow", async () => {
  const { service, updates, deletes } = createService()

  await restorePostalSettings(service, { existing: null })

  assert.deepEqual(updates, [])
  assert.deepEqual(deletes, [POSTAL_SETTINGS_ID])
})
