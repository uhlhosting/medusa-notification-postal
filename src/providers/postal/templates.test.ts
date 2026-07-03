import test from "node:test"
import assert from "node:assert/strict"
import {
  getPostalTemplateExample,
  normalizePostalCustomArgs,
  getPostalTemplateOptions,
  getPostalTemplatePreview,
  resolvePostalTemplate,
  resolvePostalSender,
} from "./templates"

test("resolvePostalTemplate applies registry defaults", () => {
  const resolved = resolvePostalTemplate("postal-admin-test")

  assert.equal(resolved.template_name, "postal-admin-test")
  assert.equal(resolved.subject, "Postal test from Medusa Admin")
  assert.match(resolved.html, /Medusa Admin settings/)
  assert.equal(resolved.text, "Postal provider test message from Medusa Admin settings.")
})

test("resolvePostalTemplate provides rich html for built-in text templates", () => {
  const defaultTemplate = resolvePostalTemplate("default")
  const postalTestTemplate = resolvePostalTemplate("postal-test")

  assert.match(defaultTemplate.html, /Postal Notification/)
  assert.match(defaultTemplate.html, /generic Postal notification preview/)
  assert.match(postalTestTemplate.html, /Postal test send/)
  assert.match(postalTestTemplate.html, /Postal test message from Medusa/)
})

test("resolvePostalTemplate preserves custom template names", () => {
  const resolved = resolvePostalTemplate("custom-template", {
    subject: "Custom subject",
  })

  assert.equal(resolved.template_name, "custom-template")
  assert.equal(resolved.subject, "Custom subject")
  assert.match(resolved.html, /Notification/)
  assert.match(resolved.text, /generic Postal notification preview/)
})

test("resolvePostalTemplate falls back to default subject and rich html", () => {
  const resolved = resolvePostalTemplate("  ")

  assert.equal(resolved.template_name, "default")
  assert.equal(resolved.subject, "Notification")
  assert.match(resolved.html, /Postal Notification/)
  assert.match(resolved.text, /generic Postal notification preview/)
})

test("resolvePostalTemplate handles an undefined template name", () => {
  const resolved = resolvePostalTemplate(undefined, {
    text: "Direct plain body",
  })

  assert.equal(resolved.template_name, "default")
  assert.equal(resolved.subject, "Notification")
  assert.equal(resolved.text, "Direct plain body")
  assert.match(resolved.html, /Direct plain body/)
})

test("resolvePostalTemplate strips html and rehydrates missing body text", () => {
  const resolved = resolvePostalTemplate("custom-template", {
    subject: "Custom subject",
    html: "<p>Hello <strong>world</strong> &amp; team</p>",
  })

  assert.equal(resolved.text, "Hello world & team")
  assert.equal(resolved.subject, "Custom subject")
})

test("resolvePostalTemplate derives text from html when text is missing", () => {
  const resolved = resolvePostalTemplate("custom-template", {
    subject: "Custom subject",
    html: "<p>Hello <strong>world</strong></p>",
  })

  assert.equal(resolved.subject, "Custom subject")
  assert.equal(resolved.html, "<p>Hello <strong>world</strong></p>")
  assert.equal(resolved.text, "Hello world")
})

test("resolvePostalTemplate derives html from text when html is missing", () => {
  const resolved = resolvePostalTemplate("custom-template", {
    subject: "Custom subject",
    text: "Plain text body",
  })

  assert.equal(resolved.subject, "Custom subject")
  assert.equal(resolved.text, "Plain text body")
  assert.match(resolved.html, /Custom subject/)
  assert.match(resolved.html, /Plain text body/)
})

test("normalizePostalCustomArgs converts safe keys to headers", () => {
  const headers = normalizePostalCustomArgs({
    "order id": 123,
    customer_group: "vip",
    ignored: null,
    "": "skip-me",
    nested: { nope: true },
  })

  assert.equal(headers["X-Postal-Custom-Arg-order-id"], "123")
  assert.equal(headers["X-Postal-Custom-Arg-customer-group"], "vip")
  assert.equal(Object.keys(headers).length, 2)
})

test("resolvePostalSender formats sender identity", () => {
  const resolved = resolvePostalSender(
    {
      from_name: "Postal Admin",
      reply_to: "reply@example.com",
    },
    "no-reply@example.com"
  )

  assert.equal(resolved.from, "Postal Admin <no-reply@example.com>")
  assert.equal(resolved.reply_to, "reply@example.com")
})

test("resolvePostalSender uses fallback from and omits empty reply-to", () => {
  const resolved = resolvePostalSender({}, "fallback@example.com")

  assert.equal(resolved.from, "fallback@example.com")
  assert.equal(resolved.reply_to, undefined)
})

test("getPostalTemplateOptions returns the built-in examples in order", () => {
  const options = getPostalTemplateOptions()

  assert.equal(options[0]?.value, "postal-admin-test")
  assert.equal(options[0]?.description, "Postal test from Medusa Admin")
  assert.equal(options.some((option) => option.value === "password-reset"), true)
  assert.equal(options.some((option) => option.value === "email-verification"), true)
  assert.equal(options.some((option) => option.value === "abandoned-cart"), true)
  assert.equal(options.some((option) => option.value === "restock-available"), true)
})

test("getPostalTemplatePreview returns the template content", () => {
  const preview = getPostalTemplatePreview("order-placed")

  assert.equal(preview.value, "order-placed")
  assert.equal(preview.subject, "Order confirmation")
  assert.match(preview.html, /Thanks for your order/)
  assert.match(preview.text, /We have received your order/)
})

test("getPostalTemplateExample returns example payload data", () => {
  const example = getPostalTemplateExample("order-placed")

  assert.equal(example.to, "recipient@example.com")
  assert.equal(example.from, "orders@example.com")
  assert.deepEqual(example.cc, [])
  assert.deepEqual(example.bcc, [])
  assert.equal(example.headers["X-Order-Id"], "ord_123")
  assert.equal(example.workflow_event, "order.placed")
  assert.equal(example.custom_args.order_id, "ord_123")
  assert.equal(example.metadata.store, "main")
})

test("getPostalTemplatePreview returns the template content for new templates", () => {
  const cartPreview = getPostalTemplatePreview("abandoned-cart")
  assert.equal(cartPreview.value, "abandoned-cart")
  assert.equal(cartPreview.subject, "You left items in your cart")
  assert.match(cartPreview.html, /We saved the items you added to your cart/)

  const restockPreview = getPostalTemplatePreview("restock-available")
  assert.equal(restockPreview.value, "restock-available")
  assert.equal(restockPreview.subject, "Product is back in stock")
  assert.match(restockPreview.html, /available again/)
})

test("getPostalTemplatePreview returns the password reset content", () => {
  const preview = getPostalTemplatePreview("password-reset")

  assert.equal(preview.value, "password-reset")
  assert.equal(preview.subject, "Reset your password")
  assert.match(preview.html, /We received a request to reset the password/)
  assert.match(preview.text, /We received a request to reset the password/)
})

test("getPostalTemplatePreview returns the email verification content", () => {
  const preview = getPostalTemplatePreview("email-verification")

  assert.equal(preview.value, "email-verification")
  assert.equal(preview.subject, "Verify your email address")
  assert.match(preview.html, /Verify your email address/)
  assert.match(preview.text, /verify your email address/)
})

test("getPostalTemplateExample returns the email verification example payload", () => {
  const example = getPostalTemplateExample("email-verification")

  assert.equal(example.to, "recipient@example.com")
  assert.equal(example.from, "security@example.com")
  assert.equal(example.reply_to, "support@example.com")
  assert.equal(example.headers["X-Verification-Flow"], "email-verification")
  assert.equal(example.custom_args.verification_token, "token_456")
  assert.equal(example.metadata.store, "main")
})

test("getPostalTemplatePreview keeps registry metadata for recovery templates", () => {
  const preview = getPostalTemplatePreview("abandoned-cart")

  assert.equal(preview.label, "Abandoned Cart")
  assert.equal(preview.description, "You left items in your cart")
  assert.match(preview.html, /Cart Recovery/)
})

test("getPostalTemplateExample carries workflow metadata and headers", () => {
  const example = getPostalTemplateExample("restock-available")

  assert.equal(example.workflow_event, "restock.available")
  assert.equal(example.workflow_run_id, "wf_example_restock_available")
  assert.equal(example.headers["X-Trace-Id"], undefined)
  assert.deepEqual(example.cc, [])
  assert.deepEqual(example.bcc, [])
  assert.equal(example.metadata.store, "main")
})

test("getPostalTemplateExample covers all built-in templates", () => {
  const templateNames = [
    "default",
    "postal-test",
    "postal-admin-test",
    "order-placed",
    "password-reset",
    "email-verification",
    "welcome",
    "abandoned-cart",
    "restock-available",
  ] as const

  for (const template of templateNames) {
    const example = getPostalTemplateExample(template)
    assert.equal(example.value, template)
    assert.equal(typeof example.workflow_event, "string")
    assert.equal(typeof example.workflow_run_id, "string")
    assert.equal(typeof example.to, "string")
    assert.equal(typeof example.from, "string")
    assert.equal(typeof example.from_name, "string")
    assert.equal(typeof example.reply_to, "string")
  }
})
