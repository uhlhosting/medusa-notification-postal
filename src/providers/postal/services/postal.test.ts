import test from "node:test"
import assert from "node:assert/strict"
import { MedusaError } from "@medusajs/framework/utils"
import {
  PostalNotificationService,
  resolvePostalSandbox,
  resolveRequestTimeoutMs,
} from "./postal"

const originalFetch = globalThis.fetch
const POSTAL_WEBHOOK_TAG_PREFIX = "uhlhosting.medusa-notification-postal:"
const logger = {
  info: () => undefined,
  error: () => undefined,
  warn: () => undefined,
  debug: () => undefined,
}

const createService = () =>
  new PostalNotificationService(
    { logger },
    {
      from: "ops@example.com",
      base_url: "https://postal.example.com/",
      api_key: "secret",
      auth_type: "smtp-api",
    }
  )

test.beforeEach(() => {
  globalThis.fetch = undefined as never
})

test.after(() => {
  globalThis.fetch = originalFetch
})

test("constructor and option validation reject invalid configuration", () => {
  assert.throws(
    () =>
      new PostalNotificationService(
        { logger },
        {
          from: "ops@example.com",
          base_url: "https://postal.example.com",
          api_key: "secret",
          auth_type: "legacy",
        } as any
      ),
    MedusaError
  )

  assert.throws(
    () =>
      new PostalNotificationService(
        { logger },
        {
          from: "",
          base_url: "https://postal.example.com",
          api_key: "secret",
          auth_type: "smtp-api",
        } as any
      ),
    MedusaError
  )

  assert.throws(
    () =>
      new PostalNotificationService(
        { logger },
        {
          from: "ops@example.com",
          base_url: "",
          api_key: "secret",
          auth_type: "smtp-api",
        } as any
      ),
    MedusaError
  )

  assert.throws(
    () =>
      new PostalNotificationService(
        { logger },
        {
          from: "ops@example.com",
          base_url: "https://postal.example.com",
          api_key: "",
          auth_type: "smtp-api",
        } as any
      ),
    MedusaError
  )

  assert.throws(
    () =>
      PostalNotificationService.validateOptions({
        from: " ",
        base_url: "https://postal.example.com",
        api_key: "secret",
      }),
    MedusaError
  )

  assert.throws(
    () =>
      PostalNotificationService.validateOptions({
        from: "ops@example.com",
        base_url: "https://postal.example.com",
        api_key: " ",
      }),
    MedusaError
  )

  assert.throws(
    () =>
      PostalNotificationService.validateOptions({
        from: "ops@example.com",
        api_key: "secret",
      }),
    MedusaError
  )
})

test("validates options and builds a send payload", async () => {
  assert.doesNotThrow(() =>
    PostalNotificationService.validateOptions({
      from: "ops@example.com",
      base_url: "https://postal.example.com",
      api_key: "secret",
    })
  )

  const service = createService()

  const fetchMock = (async () => ({
    ok: true,
    json: async () => ({
      status: "ok",
      data: {
        message_id: "msg_1",
        messages: {},
      },
    }),
  })) as unknown as typeof fetch

  globalThis.fetch = fetchMock

  const result = await service.send({
    to: [{ email: " user1@example.com " }, "user2@example.com"],
    from: "orders@example.com",
    provider_data: {
      from_name: "Orders Team",
      reply_to: "reply@example.com",
      subject: "Order confirmation",
      html: "<p>Hello <strong>there</strong></p>",
      headers: {
        "X-Trace-Id": " trace-1 ",
        Subject: "drop-me",
        "X-Bad": "line1\nline2",
      },
      custom_args: {
        order_id: "ord_1",
        nested: { ignored: true },
      },
      cc: ["cc@example.com", " "],
      bcc: "bcc@example.com",
      workflow_event: "order.placed",
      workflow_run_id: "wf_123",
    },
    content: {
      subject: "Order confirmation",
      html: "<p>Hello <strong>there</strong></p>",
    },
    template: "order-placed",
    attachments: [
      {
        filename: "invoice.pdf",
        content: "aGVsbG8=",
        content_type: "application/pdf",
      },
      {
        filename: "",
        content: "ignored",
      },
    ],
  } as never)

  assert.deepEqual(result, { id: "msg_1" })
})

test("send rejects CR/LF header injection in subject and recipients", async () => {
  const service = createService()

  const fetchMock = (async () => ({
    ok: true,
    json: async () => ({ status: "ok", data: { message_id: "msg_x", messages: {} } }),
  })) as unknown as typeof fetch
  globalThis.fetch = fetchMock

  await assert.rejects(
    () =>
      service.send({
        to: ["user@example.com"],
        from: "orders@example.com",
        provider_data: { subject: "Hello\r\nBcc: victim@example.com" },
        content: { subject: "Hello\r\nBcc: victim@example.com", html: "<p>x</p>" },
        template: "order-placed",
      } as never),
    MedusaError
  )

  await assert.rejects(
    () =>
      service.send({
        to: ["user@example.com\r\nBcc: victim@example.com"],
        from: "orders@example.com",
        provider_data: { subject: "Hello" },
        content: { subject: "Hello", html: "<p>x</p>" },
        template: "order-placed",
      } as never),
    MedusaError
  )
})

test("constructor rejects a non-http(s) base_url", () => {
  assert.throws(
    () =>
      new PostalNotificationService(
        { logger },
        {
          from: "ops@example.com",
          base_url: "ftp://postal.example.com",
          api_key: "secret",
          auth_type: "smtp-api",
        } as any
      ),
    MedusaError
  )
})

test("wraps Postal API failures as Medusa errors", async () => {
  const service = createService()

  globalThis.fetch = (async () => ({
    ok: false,
    status: 500,
    json: async () => ({
      status: "error",
      data: { message: "boom" },
    }),
  })) as unknown as typeof fetch

  await assert.rejects(() => service.getMessageDetails("123"), MedusaError)
})

test("wraps Postal API failures that only expose an error field", async () => {
  const service = createService()

  globalThis.fetch = (async () => ({
    ok: false,
    status: 422,
    json: async () => ({
      status: "error",
      data: { error: "bad payload" },
    }),
  })) as unknown as typeof fetch

  await assert.rejects(
    () => service.getMessageDeliveries("123"),
    /Postal API request failed: 422 - bad payload/
  )
})

test("wraps Postal API failures that only expose a status string", async () => {
  const service = createService()

  globalThis.fetch = (async () => ({
    ok: false,
    status: 503,
    json: async () => ({
      status: "error",
      data: {},
    }),
  })) as unknown as typeof fetch

  await assert.rejects(
    () => service.getMessageDetails("123"),
    /Postal API request failed: 503 - error/
  )
})

test("wraps Postal API responses that do not parse cleanly", async () => {
  const service = createService()

  globalThis.fetch = (async () => ({
    ok: true,
    json: async () => {
      throw new Error("invalid json")
    },
  })) as unknown as typeof fetch

  await assert.rejects(
    () => service.getMessageDetails("123"),
    /Postal API request failed: undefined - unknown error/
  )
})

test("send validates notification shape and wraps unexpected fetch errors", async () => {
  const service = createService()

  await assert.rejects(() => service.send(undefined as never), /No notification information provided/)
  await assert.rejects(
    () =>
      service.send({
        to: [],
        provider_data: {},
        template: "default",
      } as never),
    /Postal notification requires at least one recipient/
  )

  globalThis.fetch = (async () => {
    throw new Error("socket closed")
  }) as unknown as typeof fetch

  await assert.rejects(
    () =>
      service.send({
        to: ["user@example.com"],
        provider_data: {
          subject: "Order confirmation",
        },
        template: "order-placed",
      } as never),
    (error: unknown) =>
      error instanceof MedusaError &&
      /Failed to send email with Postal API: socket closed/.test(error.message)
  )
})

test("send rejects when the sender from address is missing", async () => {
  const service = createService()
  ;(service as any).config_.from = ""

  await assert.rejects(
    () =>
      service.send({
        to: ["user@example.com"],
        content: {
          subject: "Order confirmation",
        },
        template: "order-placed",
      } as never),
    /Postal notification requires a from address/
  )
})

test("send rethrows Postal API Medusa errors and supports empty provider data", async () => {
  const service = createService()

  globalThis.fetch = (async () => ({
    ok: false,
    status: 400,
    json: async () => ({
      status: "error",
      data: { message: "bad request" },
    }),
  })) as unknown as typeof fetch

  await assert.rejects(
    () =>
      service.send({
        to: ["user@example.com"],
        content: {
          subject: "Order confirmation",
          html: "<p>Thanks</p>",
        },
        template: "order-placed",
      } as never),
    (error: unknown) =>
      error instanceof MedusaError &&
      /Postal API request failed: 400 - bad request/.test(error.message)
  )
})

test("lookup helpers normalize ids and fetch the expected endpoints", async () => {
  const service = createService()
  const calls: Array<{ url: string; body: any }> = []

  globalThis.fetch = (async (url: string, init: any) => {
    calls.push({ url, body: JSON.parse(init.body) })

    return {
      ok: true,
      json: async () => ({
        status: "ok",
        data: {
          message_id: "msg_42",
        },
      }),
    }
  }) as unknown as typeof fetch

  await assert.rejects(() => service.getMessageDetails("12x"), MedusaError)

  const details = await service.getMessageDetails("42")
  const deliveries = await service.getMessageDeliveries(99)

  assert.deepEqual(details, { message_id: "msg_42" })
  assert.deepEqual(deliveries, { message_id: "msg_42" })
  assert.equal(calls[0]?.url, "https://postal.example.com/api/v1/messages/message")
  assert.deepEqual(calls[0]?.body, { id: 42, _expansions: true })
  assert.equal(calls[1]?.url, "https://postal.example.com/api/v1/messages/deliveries")
  assert.deepEqual(calls[1]?.body, { id: 99 })
})

test("send falls back to notification.data and recipient message ids", async () => {
  const service = createService()
  const calls: Array<{ url: string; body: any }> = []

  globalThis.fetch = (async (url: string, init: any) => {
    calls.push({ url, body: JSON.parse(init.body) })

    return {
      ok: true,
      json: async () => ({
        status: "ok",
        data: {
          message_id: "",
          messages: {
            "user@example.com": {
              id: 321,
            },
          },
        },
      }),
    }
  }) as unknown as typeof fetch

  const result = await service.send({
    to: ["user@example.com"],
    data: {
      from: "orders@example.com",
      from_name: "Orders",
      reply_to: "reply@example.com",
      subject: "Order confirmation",
      text: "Thanks for your order",
      headers: {
        "Reply-To": "reply@example.com",
        "List-Unsubscribe": "<mailto:unsubscribe@example.com>",
        "X-Trace-Id": "trace-2",
      },
      custom_args: {
        order_id: "ord_2",
      },
      workflow_event: "order.placed",
      workflow_run_id: "wf_456",
    },
    template: "order-placed",
  } as never)

  assert.deepEqual(result, { id: "321" })
  assert.equal(calls[0]?.url, "https://postal.example.com/api/v1/send/message")
  assert.equal(calls[0]?.body.to[0], "user@example.com")
  assert.equal(calls[0]?.body.cc?.[0], undefined)
  assert.equal(calls[0]?.body.bcc?.[0], undefined)
  assert.equal(calls[0]?.body.from, "Orders <orders@example.com>")
  assert.equal(calls[0]?.body.reply_to, "reply@example.com")
  assert.equal(calls[0]?.body.subject, "Order confirmation")
  assert.match(calls[0]?.body.html_body, /<title>Order confirmation<\/title>/)
  assert.match(calls[0]?.body.plain_body, /Thanks for your order/)
  assert.equal(
    calls[0]?.body.tag,
    `${POSTAL_WEBHOOK_TAG_PREFIX}order-placed`
  )
  assert.equal(calls[0]?.body.headers["Reply-To"], "reply@example.com")
  assert.equal(calls[0]?.body.headers["List-Unsubscribe"], "<mailto:unsubscribe@example.com>")
  assert.equal(calls[0]?.body.headers["X-Postal-Custom-Arg-order-id"], "ord_2")
})

test("send omits Reply-To when the sender reply_to is invalid", async () => {
  const service = createService()

  globalThis.fetch = (async () => ({
    ok: true,
    json: async () => ({
      status: "ok",
      data: {
        message_id: "msg_2",
        messages: {},
      },
    }),
  })) as unknown as typeof fetch

  const result = await service.send({
    to: ["user@example.com"],
    provider_data: {
      from: "orders@example.com",
      reply_to: "bad\r\nreply@example.com",
      subject: "Order confirmation",
    },
    template: "order-placed",
  } as never)

  assert.deepEqual(result, { id: "msg_2" })
})

test("send builds a payload from provider_data headers without attachments", async () => {
  const service = createService()
  const calls: Array<{ url: string; body: any }> = []

  globalThis.fetch = (async (url: string, init: any) => {
    calls.push({ url, body: JSON.parse(init.body) })
    return {
      ok: true,
      json: async () => ({
        status: "ok",
        data: {
          message_id: "msg_3",
          messages: {},
        },
      }),
    }
  }) as unknown as typeof fetch

  const result = await service.send({
    to: ["user@example.com"],
    provider_data: {
      from: "orders@example.com",
      reply_to: "reply@example.com",
      subject: "Order confirmation",
      headers: {
        "X-Trace-Id": "trace-3",
      },
      custom_args: {
        order_id: "ord_3",
      },
    },
    template: "order-placed",
  } as never)

  assert.deepEqual(result, { id: "msg_3" })
  assert.equal(calls[0]?.body.headers["X-Trace-Id"], "trace-3")
  assert.equal(calls[0]?.body.attachments, undefined)
})

test("helper methods normalize addresses, attachments, and health snapshots", () => {
  const service = createService()
  const normalizeEmails = (service as any).normalizeEmails.bind(service)
  const normalizeAttachments = (service as any).normalizeAttachments.bind(service)
  const stripHtml = (service as any).stripHtml.bind(service)
  const getFirstRecipientMessage = (service as any).getFirstRecipientMessage.bind(service)
  const normalizePostalLookupId = (service as any).normalizePostalLookupId.bind(service)

  assert.deepEqual(normalizeEmails([" user@example.com ", { email: "ops@example.com" }, "", null]), [
    "user@example.com",
    "ops@example.com",
  ])
  assert.deepEqual(normalizeEmails(undefined), [])
  assert.deepEqual(normalizeAttachments(null), undefined)
  assert.deepEqual(
    normalizeAttachments([
      { filename: "invoice.pdf", content: "abc", content_type: "application/pdf" },
      { filename: "skip.pdf" },
    ]),
    [
      {
        name: "invoice.pdf",
        content_type: "application/pdf",
        data: "abc",
      },
    ]
  )
  assert.equal(stripHtml("<p>Hello <strong>world</strong></p>"), "Hello world")
  assert.equal(getFirstRecipientMessage(null), null)
  assert.deepEqual(
    getFirstRecipientMessage({
      "recipient@example.com": { id: "" },
      "ops@example.com": { id: 123, token: "tok_123" },
    }),
    {
      recipient: "ops@example.com",
      id: "123",
      token: "tok_123",
    }
  )
  assert.equal(normalizePostalLookupId("42"), 42)
  assert.throws(() => normalizePostalLookupId(" 42x "), MedusaError)
  assert.deepEqual(service.getHealthSnapshot(), {
    auth_type: "smtp-api",
    mode: "api",
  })
})

const captureSend = () => {
  const calls: Array<{ url: string; body: any }> = []

  globalThis.fetch = (async (url: string, init: any) => {
    calls.push({ url, body: JSON.parse(init.body) })
    return {
      ok: true,
      json: async () => ({
        status: "ok",
        data: { message_id: "msg_sandbox", messages: {} },
      }),
    }
  }) as unknown as typeof fetch

  return calls
}

const withEnv = async (
  env: Record<string, string | undefined>,
  run: () => Promise<void>
) => {
  const previous = Object.fromEntries(
    Object.keys(env).map((key) => [key, process.env[key]])
  )

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }

  try {
    await run()
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

test("sandbox is off unless POSTAL_SANDBOX explicitly turns it on", async () => {
  // NODE_ENV is production in every deployed environment, staging included, so
  // it must not be what decides this either way.
  await withEnv(
    { POSTAL_SANDBOX: undefined, POSTAL_TEST_TO: "sandbox@example.com", NODE_ENV: "development" },
    async () => {
      assert.equal(resolvePostalSandbox().enabled, false)
    }
  )

  await withEnv(
    { POSTAL_SANDBOX: "true", POSTAL_TEST_TO: "sandbox@example.com", NODE_ENV: "production" },
    async () => {
      assert.equal(resolvePostalSandbox().enabled, true)
    }
  )

  for (const flag of ["1", "yes", "on", "TRUE"]) {
    await withEnv({ POSTAL_SANDBOX: flag }, async () => {
      assert.equal(resolvePostalSandbox().enabled, true)
    })
  }

  for (const flag of ["false", "0", "off", "", "maybe"]) {
    await withEnv({ POSTAL_SANDBOX: flag }, async () => {
      assert.equal(resolvePostalSandbox().enabled, false)
    })
  }
})

test("sandbox redirects every recipient and records who they were", async () => {
  const service = createService()
  const calls = captureSend()

  await withEnv(
    { POSTAL_SANDBOX: "true", POSTAL_TEST_TO: " sandbox@example.com " },
    async () => {
      const result = await service.send({
        to: ["customer@example.com", "second@example.com"],
        provider_data: {
          subject: "Ihre Bestellung",
          cc: ["cc@example.com"],
          bcc: "bcc@example.com",
          headers: { "X-Trace-Id": "trace-sandbox" },
        },
        template: "order-placed",
      } as never)

      assert.deepEqual(result, { id: "msg_sandbox" })
    }
  )

  const body = calls[0]?.body

  // Nobody outside the sandbox address is written to.
  assert.deepEqual(body.to, ["sandbox@example.com"])
  assert.equal(body.cc, undefined)
  assert.equal(body.bcc, undefined)

  // But who it was for is not lost.
  assert.equal(body.headers["X-Postal-Sandbox"], "true")
  assert.equal(
    body.headers["X-Postal-Sandbox-To"],
    "customer@example.com, second@example.com"
  )
  assert.equal(body.headers["X-Postal-Sandbox-Cc"], "cc@example.com")
  assert.equal(body.headers["X-Postal-Sandbox-Bcc"], "bcc@example.com")
  assert.equal(body.headers["X-Trace-Id"], "trace-sandbox")

  // One inbox receives mail meant for many people, and the subject line is the
  // only part of that a mailbox list shows.
  assert.equal(body.subject, "[sandbox: customer@example.com +3] Ihre Bestellung")
})

test("a caller cannot forge or overwrite the sandbox headers", async () => {
  const service = createService()
  const calls = captureSend()

  await withEnv(
    { POSTAL_SANDBOX: "true", POSTAL_TEST_TO: "sandbox@example.com" },
    async () => {
      await service.send({
        to: ["customer@example.com"],
        provider_data: {
          subject: "Ihre Bestellung",
          headers: { "X-Postal-Sandbox-To": "someone-else@example.com" },
          custom_args: { "x-postal-sandbox": "false" },
        },
      } as never)
    }
  )

  assert.equal(
    calls[0]?.body.headers["X-Postal-Sandbox-To"],
    "customer@example.com"
  )
  assert.equal(calls[0]?.body.headers["X-Postal-Sandbox"], "true")
})

test("sandbox leaves recipients alone when it is off", async () => {
  const service = createService()
  const calls = captureSend()

  await withEnv(
    { POSTAL_SANDBOX: "false", POSTAL_TEST_TO: "sandbox@example.com" },
    async () => {
      await service.send({
        to: ["customer@example.com"],
        provider_data: { subject: "Ihre Bestellung" },
      } as never)
    }
  )

  assert.deepEqual(calls[0]?.body.to, ["customer@example.com"])
  assert.equal(calls[0]?.body.subject, "Ihre Bestellung")
  assert.equal(calls[0]?.body.headers?.["X-Postal-Sandbox"], undefined)
})

test("sandbox without a recipient sends as addressed rather than failing", async () => {
  const service = createService()
  const calls = captureSend()

  await withEnv(
    { POSTAL_SANDBOX: "true", POSTAL_TEST_TO: "" },
    async () => {
      await service.send({
        to: ["customer@example.com"],
        provider_data: { subject: "Ihre Bestellung" },
      } as never)
    }
  )

  // Refusing here would leave a misconfigured environment unable to send at
  // all; the provider logs the misconfiguration instead.
  assert.deepEqual(calls[0]?.body.to, ["customer@example.com"])
  assert.equal(calls[0]?.body.headers?.["X-Postal-Sandbox"], undefined)
})

test("sandbox refuses a recipient that would inject a header", async () => {
  const service = createService()
  captureSend()

  await withEnv(
    { POSTAL_SANDBOX: "true", POSTAL_TEST_TO: "sandbox@example.com" },
    async () => {
      await assert.rejects(
        service.send({
          to: ["victim@example.com\r\nBcc: attacker@example.com"],
          provider_data: { subject: "Ihre Bestellung" },
        } as never),
        MedusaError
      )
    }
  )
})

const okFetch = (calls: Array<{ body: any }>) =>
  (async (_url: string, init: any) => {
    calls.push({ body: JSON.parse(init.body) })
    return {
      ok: true,
      json: async () => ({
        status: "ok",
        data: { message_id: "msg_rt", messages: {} },
      }),
    }
  }) as unknown as typeof fetch

test("send drops a reply_to that is not one plain address, warns without content, and still sends", async () => {
  const warnings: string[] = []
  const service = new PostalNotificationService(
    {
      logger: {
        info: () => undefined,
        warn: (message: string) => {
          warnings.push(message)
        },
      } as never,
    },
    {
      from: "ops@example.com",
      base_url: "https://postal.example.com",
      api_key: "secret",
      auth_type: "smtp-api",
    }
  )

  const invalid = [
    "Enquirer <enquirer@example.com>",
    "a@example.com, b@example.com",
    "enquirer@example.com\r\nBcc: victim@example.com",
    "énquirer@example.com",
    "not-an-address",
  ]

  for (const reply_to of invalid) {
    const calls: Array<{ body: any }> = []
    globalThis.fetch = okFetch(calls)

    const result = await service.send({
      to: ["staff@example.com"],
      provider_data: {
        reply_to,
        subject: "Website enquiry",
        text: "body",
        workflow_run_id: "wf_rt",
      },
      template: "website-enquiry",
    } as never)

    assert.deepEqual(result, { id: "msg_rt" })
    assert.equal(calls.length, 1)
    assert.equal(calls[0]?.body.reply_to, undefined)
    assert.equal(calls[0]?.body.headers?.["Reply-To"], undefined)
  }

  assert.equal(warnings.length, invalid.length)
  for (const warning of warnings) {
    assert.match(warning, /reply_to is not a single plain email address and was dropped/)
    assert.doesNotMatch(warning, /@|enquirer|victim|not-an-address/)
  }
})

test("send keeps a valid reply_to and falls back to info logging when the logger has no warn", async () => {
  const infos: string[] = []
  const service = new PostalNotificationService(
    { logger: { info: (message: string) => void infos.push(message) } as never },
    {
      from: "ops@example.com",
      base_url: "https://postal.example.com",
      api_key: "secret",
      auth_type: "smtp-api",
    }
  )
  const calls: Array<{ body: any }> = []
  globalThis.fetch = okFetch(calls)

  await service.send({
    to: ["staff@example.com"],
    provider_data: { reply_to: " enquirer@example.com ", subject: "S", text: "t" },
  } as never)
  assert.equal(calls[0]?.body.reply_to, "enquirer@example.com")
  assert.equal(calls[0]?.body.headers["Reply-To"], "enquirer@example.com")

  await service.send({
    to: ["staff@example.com"],
    provider_data: { reply_to: "a@example.com;b@example.com", subject: "S", text: "t" },
  } as never)
  assert.equal(calls[1]?.body.reply_to, undefined)
  assert.equal(
    infos.filter((line) => line.includes("reply_to is not a single plain email address")).length,
    1
  )
})

const createWarningService = (warnings: string[]) =>
  new PostalNotificationService(
    {
      logger: {
        info: () => undefined,
        warn: (message: string) => {
          warnings.push(message)
        },
      } as never,
    },
    {
      from: "ops@example.com",
      base_url: "https://postal.example.com",
      api_key: "secret",
      auth_type: "smtp-api",
    }
  )

const replyToHeaders = (headers: Record<string, string> | undefined) =>
  Object.entries(headers ?? {}).filter(([name]) => name.toLowerCase() === "reply-to")

test("send drops a Reply-To header that is not one plain address, warns without content, and still sends", async () => {
  const warnings: string[] = []
  const service = createWarningService(warnings)
  const invalid = [
    "Enquirer <enquirer@example.com>",
    "enquirer@example.com, attacker@example.com",
    "enquirer@example.com Bcc: victim@example.com",
    "énquirer@example.com",
    "not-an-address",
  ]

  for (const [index, value] of invalid.entries()) {
    const calls: Array<{ body: any }> = []
    globalThis.fetch = okFetch(calls)

    const result = await service.send({
      to: ["staff@example.com"],
      provider_data: {
        subject: "Website enquiry",
        text: "body",
        workflow_run_id: "wf_rh",
        headers: {
          [index % 2 ? "reply-to" : "Reply-To"]: value,
          "X-Contact-Topic": "quote",
        },
      },
      template: "contact-form",
    } as never)

    assert.deepEqual(result, { id: "msg_rt" })
    assert.equal(calls.length, 1)
    assert.deepEqual(replyToHeaders(calls[0]?.body.headers), [])
    assert.equal(calls[0]?.body.reply_to, undefined)
    assert.equal(calls[0]?.body.headers["X-Contact-Topic"], "quote")
  }

  assert.equal(warnings.length, invalid.length)
  for (const warning of warnings) {
    assert.match(warning, /Reply-To header is not a single plain email address and was dropped/)
    assert.doesNotMatch(warning, /@|enquirer|attacker|victim|not-an-address/)
  }
})

test("send keeps one valid Reply-To header, and a valid reply_to replaces any caller Reply-To header", async () => {
  const warnings: string[] = []
  const service = createWarningService(warnings)
  const calls: Array<{ body: any }> = []
  globalThis.fetch = okFetch(calls)

  await service.send({
    to: ["staff@example.com"],
    provider_data: {
      subject: "S",
      text: "t",
      headers: { "Reply-To": " enquirer@example.com " },
    },
  } as never)
  assert.deepEqual(replyToHeaders(calls[0]?.body.headers), [
    ["Reply-To", "enquirer@example.com"],
  ])

  await service.send({
    to: ["staff@example.com"],
    provider_data: {
      subject: "S",
      text: "t",
      headers: { "Reply-To": "first@example.com", "reply-to": "second@example.com" },
    },
  } as never)
  assert.deepEqual(replyToHeaders(calls[1]?.body.headers), [
    ["Reply-To", "first@example.com"],
  ])

  await service.send({
    to: ["staff@example.com"],
    provider_data: {
      subject: "S",
      text: "t",
      reply_to: "enquirer@example.com",
      headers: { "reply-to": "someone.else@example.com, x@example.com" },
    },
  } as never)
  assert.deepEqual(replyToHeaders(calls[2]?.body.headers), [
    ["Reply-To", "enquirer@example.com"],
  ])
  assert.equal(calls[2]?.body.reply_to, "enquirer@example.com")
  assert.deepEqual(warnings, [])
})

test("resolveRequestTimeoutMs prefers the option, then the env, then 10s, clamped to 1-60s", () => {
  const original = process.env.POSTAL_REQUEST_TIMEOUT_MS
  try {
    delete process.env.POSTAL_REQUEST_TIMEOUT_MS
    assert.equal(resolveRequestTimeoutMs(), 10000)
    assert.equal(resolveRequestTimeoutMs(undefined), 10000)
    assert.equal(resolveRequestTimeoutMs(5000), 5000)
    assert.equal(resolveRequestTimeoutMs("7000"), 7000)
    assert.equal(resolveRequestTimeoutMs(10), 1000)
    assert.equal(resolveRequestTimeoutMs(600000), 60000)
    assert.equal(resolveRequestTimeoutMs("abc"), 10000)

    process.env.POSTAL_REQUEST_TIMEOUT_MS = "15000"
    assert.equal(resolveRequestTimeoutMs(), 15000)
    assert.equal(resolveRequestTimeoutMs(""), 15000)
    assert.equal(resolveRequestTimeoutMs(3000), 3000)
  } finally {
    if (original === undefined) {
      delete process.env.POSTAL_REQUEST_TIMEOUT_MS
    } else {
      process.env.POSTAL_REQUEST_TIMEOUT_MS = original
    }
  }
})

test("send arms its abort timer with the request_timeout_ms provider option", async () => {
  const original = process.env.POSTAL_REQUEST_TIMEOUT_MS
  const originalSetTimeout = globalThis.setTimeout
  const delays: number[] = []
  try {
    process.env.POSTAL_REQUEST_TIMEOUT_MS = "20000"
    globalThis.setTimeout = ((handler: () => void, delay?: number) => {
      delays.push(Number(delay))
      return originalSetTimeout(handler, 0x7fffffff)
    }) as typeof setTimeout

    const service = new PostalNotificationService(
      { logger },
      {
        from: "ops@example.com",
        base_url: "https://postal.example.com",
        api_key: "secret",
        auth_type: "smtp-api",
        request_timeout_ms: 4000,
      }
    )
    globalThis.fetch = okFetch([])

    await service.send({
      to: ["user@example.com"],
      provider_data: { subject: "S", text: "t" },
    } as never)

    assert.deepEqual(delays, [4000])
  } finally {
    globalThis.setTimeout = originalSetTimeout
    if (original === undefined) {
      delete process.env.POSTAL_REQUEST_TIMEOUT_MS
    } else {
      process.env.POSTAL_REQUEST_TIMEOUT_MS = original
    }
  }
})
