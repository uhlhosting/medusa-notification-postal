import test from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const ADMIN_DIR = join(__dirname, "..")
const readBundle = (locale: string): Record<string, string> =>
  JSON.parse(readFileSync(join(__dirname, "json", `${locale}.json`), "utf8"))

const en = readBundle("en")
const de = readBundle("de")

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      return sourceFiles(path)
    }

    return /\.tsx$/.test(path) && !/\.test\./.test(path) ? [path] : []
  })

// `t("postal.x")` calls plus `labelKey: "postal.x"` lookup tables. Keys built
// from a template literal are checked by the compiler instead: `t()` is typed
// against en.json (see i18next.d.ts), which is why a cast to `any` on a static
// key must never be used to silence it.
const usedKeys = () => {
  const keys = new Map<string, string>()
  const patterns = [
    /\bt\(\s*["'](postal\.[\w.]+)["']/g,
    /labelKey:\s*["'](postal\.[\w.]+)["']/g,
  ]

  for (const file of sourceFiles(ADMIN_DIR)) {
    const source = readFileSync(file, "utf8")

    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) {
        keys.set(match[1]!, file.replace(ADMIN_DIR, "src/admin"))
      }
    }
  }

  return keys
}

test("every translation key used by the admin UI exists in en.json", () => {
  const missing = [...usedKeys()]
    .filter(([key]) => !(key in en))
    .map(([key, file]) => `${key} (${file})`)

  assert.deepEqual(missing, [])
})

test("en and de define exactly the same keys", () => {
  const enKeys = Object.keys(en).sort()
  const deKeys = Object.keys(de).sort()

  assert.deepEqual(
    enKeys.filter((key) => !(key in de)),
    [],
    "keys missing from de.json"
  )
  assert.deepEqual(
    deKeys.filter((key) => !(key in en)),
    [],
    "keys in de.json but not en.json"
  )
})

test("no translation is empty and placeholders match across locales", () => {
  const placeholders = (value: string) =>
    (value.match(/{{\s*\w+\s*}}/g) ?? []).sort().join(",")

  for (const [key, value] of Object.entries(en)) {
    assert.notEqual(value.trim(), "", `${key} is empty in en.json`)
    assert.notEqual(de[key]?.trim(), "", `${key} is empty in de.json`)
    assert.equal(
      placeholders(de[key] ?? ""),
      placeholders(value),
      `${key} uses different {{placeholders}} in de.json`
    )
  }
})
