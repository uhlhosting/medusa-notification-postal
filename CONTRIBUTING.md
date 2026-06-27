# Contributing to @uhlhosting/medusa-notification-postal

First off, thank you for taking the time to contribute! Contributions are what make the open-source community such an amazing place to learn, inspire, and create.

Please read our [Code of Conduct](file:///Users/cosmic/Developer/MedusaJS/Plugins/medusa-notification-postal/CODE_OF_CONDUCT.md) before participating in our community.

---

## How to Contribute

### 1. Reporting Bugs
* Check the [existing issues](https://github.com/uhlhosting/medusa-notification-postal/issues) to make sure the bug hasn't already been reported.
* Use the **Bug report** template when creating a new issue.
* Provide as much context as possible, including:
  * Medusa Framework and plugin versions
  * Node.js version
  * Provider authentication mode (`smtp-api`, `smtp-ip`, or `smtp`)
  * Error stack traces and reproduction steps

> [!WARNING]
> Never share active production credentials, secrets, password strings, or Postal API keys in issues, pull requests, or logs.

### 2. Suggesting Enhancements / Feature Requests
* Open an issue using the **Feature request** template.
* Clearly describe the problem you want solved and the proposed solution.
* Explain how the enhancement fits the Postal notification provider paradigm.

### 3. Development Invariants & Architectural Rules
When writing code for this plugin, please adhere to the following design constraints:

* **Workflows over Routes:** Keep mutation logic inside Medusa workflows. Do not place business logic directly in API routes.
* **Thin Route Handlers:** Keep route handlers thin, clean, and fully typed.
* **SDK Over Fetch:** Use Medusa SDK clients where applicable instead of raw `fetch` calls.
* **HTTP Timeouts:** All Postal HTTP calls must fail fast with a bounded timeout.
* **Auth Modes:** The supported provider authentication modes are `smtp-api`, `smtp-ip`, and `smtp`.
* **No Secret Exposure:** The admin settings route under `/admin/plugin-settings/postal` is a configuration visibility surface and must **not** expose secrets.
* **Preserve Secrets on Save:** When saving settings via API or settings view, if the password or API key inputs are empty, preserve the existing secrets rather than overwriting them with blank values.
* **Trace Metadata:** For Postal debug or test sends, make sure to use the plugin workflow path so that trace metadata is preserved.

---

## Local Development Workflow

This project is configured with `pnpm` workspace tools.

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Run in Development Mode:**
   ```bash
   pnpm dev
   ```

3. **Build the Plugin:**
   ```bash
   pnpm build
   ```
   *This compiles the TypeScript files and admin extensions into the `.medusa/server` directory.*

---

## Verification & Submitting a PR

Before submitting your pull request, please ensure the following checklist is completed:

1. **Local Checks Pass:**
   Run the release validation script to verify linting, typechecking, and compilation:
   ```bash
   pnpm release:check
   ```
2. **Pack dry-run:**
   Ensure the compiled `.medusa/server` bundle is correctly included in the package publish surface:
   ```bash
   npm pack --dry-run
   ```
3. **Commit Messages & Code:**
   * Keep commits clean and descriptive.
   * Do not commit any `.npmrc` authentication tokens, personal NPM tokens, or development credentials.
