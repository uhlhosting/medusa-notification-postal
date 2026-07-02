#!/usr/bin/env node

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const cwd = process.cwd()
const pkgPath = path.join(cwd, "package.json")
const pnpmExecPath = process.env.npm_execpath

function runPnpm(args) {
  if (pnpmExecPath) {
    return execFileSync(process.execPath, [pnpmExecPath, ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
  }

  return execFileSync("pnpm", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (!fs.existsSync(pkgPath)) {
  fail(`Missing package.json in ${cwd}`)
}

const pkg = readJson(pkgPath)

if (pkg.private) {
  fail("Package must remain publishable, but package.json is marked private")
}

if (!pkg.publishConfig || pkg.publishConfig.access !== "public") {
  fail("publishConfig.access must be set to public for this scoped npm package")
}

if (
  typeof pkg.repository?.url === "string" &&
  pkg.repository.url.startsWith("git+")
) {
  fail("repository.url must use a browser-safe HTTPS URL, not a git+ URL")
}

const packDir = fs.mkdtempSync(path.join(os.tmpdir(), "postal-pack-"))
let packOutput

try {
  packOutput = JSON.parse(
    runPnpm(["pack", "--json", "--pack-destination", packDir]),
  )
} finally {
  fs.rmSync(packDir, { recursive: true, force: true })
}

const packFiles = Array.isArray(packOutput)
  ? packOutput?.[0]?.files?.map((file) => file.path) ?? []
  : packOutput?.files?.map((file) => file.path) ?? []

const requiredFiles = ["LICENSE", "README.md", "package.json"]
const missingFiles = requiredFiles.filter((file) => !packFiles.includes(file))
if (missingFiles.length > 0) {
  fail(`npm pack output is missing required files: ${missingFiles.join(", ")}`)
}

if (!packFiles.some((file) => file.startsWith(".medusa/server/"))) {
  fail("npm pack output must include the compiled .medusa/server bundle")
}

if (packFiles.some((file) => file === "src" || file.startsWith("src/"))) {
  fail("npm pack output must not include the source src/ tree")
}

const testFiles = packFiles.filter((file) =>
  /(^|\/)[^/]+\.test\.(js|mjs|cjs|ts|tsx|d\.ts)(\.map)?$/.test(file)
)
if (testFiles.length > 0) {
  fail(`npm pack output must not include compiled test files: ${testFiles.join(", ")}`)
}

const depsTree = JSON.parse(
  runPnpm(["list", "--depth", "0", "--prod", "--json"]),
)
const directDeps = depsTree?.[0]?.dependencies ?? {}

const deprecated = []

async function getDeprecationMessage(name, version) {
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version)}`,
  )

  if (!response.ok) {
    throw new Error(
      `Failed to inspect ${name}@${version} from the npm registry: ${response.status} ${response.statusText}`,
    )
  }

  const data = await response.json()
  return typeof data.deprecated === "string" ? data.deprecated.trim() : ""
}

for (const [name, info] of Object.entries(directDeps)) {
  const version = info?.version
  if (!version) {
    continue
  }

  const deprecationMessage = await getDeprecationMessage(name, version)

  if (deprecationMessage) {
    deprecated.push(`${name}@${version}: ${deprecationMessage}`)
  }
}

if (deprecated.length > 0) {
  fail(`Deprecated production dependencies found:\n- ${deprecated.join("\n- ")}`)
}

console.log(`Release verification passed for ${pkg.name}@${pkg.version}`)
