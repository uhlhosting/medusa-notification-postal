import { readFileSync } from "node:fs"
import { pathToFileURL } from "node:url"

export function verifySecretReport(report) {
  if (!report || typeof report.version !== "string" || !/^\d+\.\d+\.\d+$/.test(report.version) || !Array.isArray(report.vulnerabilities) || report.scan?.type !== "secret_detection" || report.scan?.status !== "success") {
    throw new Error("Secret report missing, malformed or scan unsuccessful")
  }
  if (report.vulnerabilities.length !== 0) throw new Error(`Secret findings: ${report.vulnerabilities.length}`)
  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    verifySecretReport(JSON.parse(readFileSync("gl-secret-detection-report.json", "utf8")))
    console.log("Secret report verified: findings=0, scan=success")
  } catch {
    console.error("Secret-report gate failed: missing/invalid report, unsuccessful scan or findings present")
    process.exitCode = 1
  }
}
