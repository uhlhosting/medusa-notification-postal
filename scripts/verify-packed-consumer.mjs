import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
const source = process.cwd()
const pkg = JSON.parse(readFileSync("package.json", "utf8"))
const temp = mkdtempSync(path.join(tmpdir(), "postal-consumer-"))
const run = (cmd, args, cwd = temp) => execFileSync(cmd, args, { cwd, stdio: "inherit", env: process.env })
try {
  const pack = JSON.parse(execFileSync("pnpm", ["pack", "--json", "--pack-destination", temp], { cwd: source, encoding: "utf8" }))
  const filename = pack.filename ?? pack[0]?.filename
  const dependencies = { [pkg.name]: `file:${path.resolve(temp, filename)}`, react: pkg.devDependencies.react, "react-dom": pkg.devDependencies["react-dom"], vite: pkg.devDependencies.vite, typescript: pkg.devDependencies.typescript, "@types/node": pkg.devDependencies["@types/node"] }
  for (const name of Object.keys(pkg.peerDependencies)) dependencies[name] = pkg.devDependencies[name] ?? pkg.peerDependencies[name]
  writeFileSync(path.join(temp, "package.json"), JSON.stringify({ private: true, type: "module", packageManager: pkg.packageManager, dependencies }))
  // Stock Medusa's optional fdir/picomatch peer range currently conflicts.
  // Record warnings; this verifies an ordinary consumer install, not strict-peer success.
  writeFileSync(path.join(temp, ".npmrc"), "strict-peer-dependencies=false\n")
  // Scratch manifests intentionally resolve independently, including under CI.
  run("pnpm", ["install", "--no-frozen-lockfile", "--prefer-offline", "--ignore-scripts"])
  const audit = (() => { try { return execFileSync("pnpm", ["audit", "--json"], { cwd: temp, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }) } catch (error) { if (error.status !== 1) throw error; return error.stdout } })()
  mkdirSync(path.join(source, "reports"), { recursive: true })
  writeFileSync(path.join(source, "reports/consumer-dependency-audit.json"), audit)
  const counts = JSON.parse(audit).metadata?.vulnerabilities
  if (!counts) throw new Error("Packed consumer audit did not return vulnerability metadata")
  console.log("Unmodified host dependency graph advisory counts (consumer overrides are not inherited):", JSON.stringify(counts))
  writeFileSync(path.join(temp, "smoke.cjs"), `try { require.resolve("@medusajs/test-utils"); throw new Error("Development-only test-utils unexpectedly installed in the consumer"); } catch (error) { if (error.code !== "MODULE_NOT_FOUND") throw error; } for (const subpath of ["", "/workflows", "/modules/postal", "/providers/postal", "/.medusa/server/src/modules/postal"]) { const value = require(${JSON.stringify(pkg.name)} + subpath); if (!value) throw new Error("Missing consumer export " + subpath); } console.log("Consumer CJS exports passed")`)
  run(process.execPath, ["smoke.cjs"])
  writeFileSync(path.join(temp, "smoke.mjs"), `for (const subpath of ["", "/workflows"]) await import(${JSON.stringify(pkg.name)} + subpath); console.log("Consumer ESM exports passed")`)
  run(process.execPath, ["smoke.mjs"])
  writeFileSync(path.join(temp, "declarations.ts"), `import * as plugin from ${JSON.stringify(pkg.name)}; import * as workflows from ${JSON.stringify(pkg.name + "/workflows")}; import module from ${JSON.stringify(pkg.name + "/modules/postal")}; void [plugin, workflows, module];`)
  writeFileSync(path.join(temp, "tsconfig.json"), JSON.stringify({ compilerOptions: { module: "Node16", moduleResolution: "Node16", target: "ES2022", strict: true, skipLibCheck: true, noEmit: true }, files: ["declarations.ts"] }))
  run("pnpm", ["exec", "tsc", "-p", "tsconfig.json"])
  writeFileSync(path.join(temp, "index.html"), '<html><body><script type="module" src="/entry.js"></script></body></html>')
  writeFileSync(path.join(temp, "entry.js"), `import * as extensions from ${JSON.stringify(pkg.name + "/admin")}; console.log(Object.keys(extensions));`)
  run("pnpm", ["exec", "vite", "build"])
  console.log("Independent packed consumer install, exports and Admin build passed")
  // Prove explicit application-level compatible patches separately. These are
  // consumer configuration, never inherited repository overrides.
  writeFileSync(path.join(temp, "pnpm-workspace.yaml"), 'overrides:\n  lodash: 4.18.1\n  "ajv@^8": 8.18.0\n')
  run("pnpm", ["install", "--no-frozen-lockfile", "--prefer-offline", "--ignore-scripts"])
  let patchedAudit
  try { patchedAudit = execFileSync("pnpm", ["audit", "--json"], { cwd: temp, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }) }
  catch (error) { if (error.status !== 1) throw error; patchedAudit = error.stdout }
  writeFileSync(path.join(source, "reports/consumer-patched-dependency-audit.json"), patchedAudit)
  console.log("Explicit compatible consumer lodash/ajv patch graph advisory counts:", JSON.stringify(JSON.parse(patchedAudit).metadata?.vulnerabilities))

  if (process.env.DB_HOST && process.env.DB_PORT) {
    const hostManifest = JSON.parse(readFileSync(path.join(temp, "package.json"), "utf8"))
    hostManifest.devDependencies = Object.fromEntries(["@medusajs/cli", "@medusajs/test-utils", "jest", "@swc/core", "@swc/jest"].map(name => [name, pkg.devDependencies[name]]))
    hostManifest.devDependencies["@medusajs/draft-order"] = pkg.devDependencies["@medusajs/medusa"]
    hostManifest.type = "commonjs"
    writeFileSync(path.join(temp, "package.json"), JSON.stringify(hostManifest))
    run("pnpm", ["install", "--no-frozen-lockfile", "--prefer-offline", "--ignore-scripts"])
    writeFileSync(path.join(temp, "medusa-config.js"), `const {defineConfig}=require("@medusajs/framework/utils");module.exports=defineConfig({projectConfig:{databaseUrl:process.env.DATABASE_URL,http:{jwtSecret:"packed-native-isolated",cookieSecret:"packed-native-isolated",storeCors:"*",adminCors:"*",authCors:"*"}},admin:{disable:true},plugins:[{resolve:${JSON.stringify(pkg.name)},options:{}}],modules:[{resolve:"@medusajs/medusa/notification",options:{providers:[{resolve:${JSON.stringify(pkg.name + "/providers/postal")},id:"postal",options:{channels:["email"],base_url:"http://postal.internal.invalid",api_key:"isolated-test-key",from:"operator@example.invalid"}}]}}]});`)
    writeFileSync(path.join(temp, "jest.config.js"), `module.exports={testEnvironment:"node",testMatch:["**/packed.spec.js"],transform:{"^.+\\.[jt]s$":["@swc/jest",{jsc:{target:"es2022"}}]}};`)
    writeFileSync(path.join(temp, "packed.spec.js"), `const {medusaIntegrationTestRunner}=require("@medusajs/test-utils");const {Modules,ContainerRegistrationKeys,generateJwtToken}=require("@medusajs/framework/utils");jest.setTimeout(120000);medusaIntegrationTestRunner({inApp:true,testSuite:({api,getContainer})=>{it("discovers installed Postal routes and actual provider registry",async()=>{const c=getContainer();const user=await c.resolve(Modules.USER).createUsers({email:"packed-admin@example.invalid"});const token=generateJwtToken({actor_id:user.id,actor_type:"user",auth_identity_id:"isolated"},{secret:c.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig.http.jwtSecret,expiresIn:"1m"});const r=await api.get("/admin/postal/health",{headers:{Authorization:"Bearer "+token}});expect(r.status).toBe(200);expect(r.data.status).toBe("ok");});}});`)
    run(process.execPath, ["--experimental-vm-modules", "node_modules/jest/bin/jest.js", "--runInBand"])
  }

} finally { rmSync(temp, { recursive: true, force: true }) }
