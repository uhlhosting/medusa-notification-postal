#!/usr/bin/env node
// Summarize GitLab SAST + Secret Detection JSON reports into the job log.
//
// The security findings widget on merge requests is a Premium/Ultimate feature.
// This instance is Community Edition (Free), so this script surfaces the scan
// results in the pipeline instead, and the job exposes the raw reports as a
// downloadable MR artifact via `artifacts:expose_as`.

import fs from "node:fs"

const REPORTS = [
  { label: "SAST (semgrep)", file: "gl-sast-report.json" },
  { label: "Secret Detection", file: "gl-secret-detection-report.json" },
]

const SEVERITY_ORDER = ["Critical", "High", "Medium", "Low", "Info", "Unknown"]

const readReport = (file) => {
  try {
    if (!fs.existsSync(file)) return null
    return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch {
    return null
  }
}

const normalizeSeverity = (value) => {
  const v = String(value || "Unknown").trim()
  const match = SEVERITY_ORDER.find((s) => s.toLowerCase() === v.toLowerCase())
  return match || "Unknown"
}

let totalFindings = 0

for (const { label, file } of REPORTS) {
  const report = readReport(file)
  if (!report) {
    console.log(`\n▸ ${label}: report not found (${file}) — scan may not apply.`)
    continue
  }

  const vulns = Array.isArray(report.vulnerabilities) ? report.vulnerabilities : []
  totalFindings += vulns.length

  const counts = {}
  for (const v of vulns) {
    const sev = normalizeSeverity(v.severity)
    counts[sev] = (counts[sev] || 0) + 1
  }
  const countLine =
    SEVERITY_ORDER.filter((s) => counts[s])
      .map((s) => `${s}: ${counts[s]}`)
      .join("  ") || "none"

  console.log(`\n▸ ${label}: ${vulns.length} finding(s) — ${countLine}`)

  // List up to 20 findings (location + name only — no secret values are in the
  // report, so nothing sensitive is printed).
  const sorted = [...vulns].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(normalizeSeverity(a.severity)) -
      SEVERITY_ORDER.indexOf(normalizeSeverity(b.severity))
  )
  for (const v of sorted.slice(0, 20)) {
    const loc = v.location || {}
    const where = loc.file
      ? `${loc.file}${loc.start_line ? `:${loc.start_line}` : ""}`
      : "(no location)"
    console.log(
      `    [${normalizeSeverity(v.severity)}] ${v.name || v.message || "finding"} — ${where}`
    )
  }
  if (sorted.length > 20) {
    console.log(`    …and ${sorted.length - 20} more (see the exposed report artifact).`)
  }
}

console.log(
  `\nTotal security findings: ${totalFindings}. ` +
    `Full reports are attached as the "Security scan reports" merge-request artifact.`
)

// Visibility-only by default: do not fail the pipeline. Set
// SECURITY_FAIL_ON_FINDINGS=true to turn this into a gate.
if (process.env.SECURITY_FAIL_ON_FINDINGS === "true" && totalFindings > 0) {
  console.error(
    `\nFailing because SECURITY_FAIL_ON_FINDINGS=true and ${totalFindings} finding(s) were reported.`
  )
  process.exit(1)
}
