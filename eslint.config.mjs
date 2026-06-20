import { defineConfig } from "eslint/config"
import medusa from "@medusajs/eslint-plugin"
import tseslint from "@typescript-eslint/eslint-plugin"
import tsparser from "@typescript-eslint/parser"

export default defineConfig([
  ...medusa.configs.recommended,
  {
    plugins: {
      "@typescript-eslint": tseslint,
    },
    languageOptions: {
      parser: tsparser,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-empty-pattern": "off",
    },
  },
])
