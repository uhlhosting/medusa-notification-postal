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

test("resolvePostalTemplate preserves custom template names", () => {
  const resolved = resolvePostalTemplate("custom-template", {
    subject: "Custom subject",
  })

  assert.equal(resolved.template_name, "custom-template")
  assert.equal(resolved.subject, "Custom subject")
  assert.equal(resolved.html, "")
  assert.equal(resolved.text, "")
})

test("normalizePostalCustomArgs converts safe keys to headers", () => {
  const headers = normalizePostalCustomArgs({
    "order id": 123,
    customer_group: "vip",
    ignored: null,
  })

  assert.equal(headers["X-Postal-Custom-Arg-order-id"], "123")
  assert.equal(headers["X-Postal-Custom-Arg-customer-group"], "vip")
  assert.equal(Object.keys(headers).length, 2)
})

test("resolvePostalSender formats sender identity", () => {
  const resolved = resolvePostalSender(
    {
      from_name: "Postal Admin",
      reply_to: "reply@uhlhosting.ch",
    },
    "no-reply@uhlhosting.ch"
  )

  assert.equal(resolved.from, "Postal Admin <no-reply@uhlhosting.ch>")
  assert.equal(resolved.reply_to, "reply@uhlhosting.ch")
})

test("getPostalTemplateOptions returns the built-in examples in order", () => {
  const options = getPostalTemplateOptions()

  assert.equal(options[0]?.value, "postal-admin-test")
  assert.equal(options[0]?.description, "Postal test from Medusa Admin")
  assert.equal(options.some((option) => option.value === "password-reset"), true)
  assert.equal(options.some((option) => option.value === "abandoned-cart"), true)
  assert.equal(options.some((option) => option.value === "restock-available"), true)
})

test("getPostalTemplatePreview returns the template content", () => {
  const preview = getPostalTemplatePreview("order-placed")

  assert.equal(preview.value, "order-placed")
  assert.equal(preview.subject, "Order confirmation")
  assert.match(preview.html, /Thanks for your order/)
  assert.match(preview.text, /Thanks for your order/)
})

test("getPostalTemplateExample returns example payload data", () => {
  const example = getPostalTemplateExample("order-placed")

  assert.equal(example.to, "customer@uhlhosting.ch")
  assert.equal(example.from, "orders@uhlhosting.ch")
  assert.deepEqual(example.cc, ["ops@uhlhosting.ch"])
  assert.deepEqual(example.bcc, ["audit@uhlhosting.ch"])
  assert.equal(example.headers["X-Order-Id"], "ord_123")
  assert.equal(example.workflow_event, "order.placed")
  assert.equal(example.custom_args.order_id, "ord_123")
  assert.equal(example.metadata.store, "main")
})

test("getPostalTemplatePreview returns the template content for new templates", () => {
  const cartPreview = getPostalTemplatePreview("abandoned-cart")
  assert.equal(cartPreview.value, "abandoned-cart")
  assert.equal(cartPreview.subject, "You left items in your cart")
  assert.match(cartPreview.html, /You left some items/)

  const restockPreview = getPostalTemplatePreview("restock-available")
  assert.equal(restockPreview.value, "restock-available")
  assert.equal(restockPreview.subject, "Product is back in stock")
  assert.match(restockPreview.html, /back in stock/)
})

