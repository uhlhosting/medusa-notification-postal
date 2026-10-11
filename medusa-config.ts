import { defineConfig } from "@medusajs/framework/utils"
export default defineConfig({
  projectConfig: { databaseUrl: process.env.DATABASE_URL, http: {
    storeCors: "http://localhost", adminCors: "http://localhost", authCors: "http://localhost",
    jwtSecret: "isolated-native-test-jwt", cookieSecret: "isolated-native-test-cookie",
  } },
  admin: { disable: true },
  modules: [
    { resolve: "./src/modules/postal" },
    { resolve: "@medusajs/medusa/notification", options: { providers: [{ resolve: "./src/providers/postal", id: "postal", options: { channels: ["email"], from: "operator@example.invalid", base_url: "http://postal.internal.invalid", api_key: "isolated-test-api-key" } }] } },
  ],
})
