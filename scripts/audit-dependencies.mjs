import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
const result = spawnSync("pnpm", ["audit", "--json"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
if (result.error) throw result.error;
if (![0, 1].includes(result.status)) throw new Error("Dependency audit process failed unexpectedly.");
let report;
try { report = JSON.parse(result.stdout); } catch { throw new Error("Dependency audit did not return a valid report; refusing to pass."); }
if (!report.metadata?.vulnerabilities || !report.advisories || typeof report.advisories !== "object" || Array.isArray(report.advisories)) throw new Error("Dependency audit response incomplete; refusing to pass.");
const baseline = JSON.parse(fs.readFileSync("security/dependency-audit-baseline.json", "utf8"));
if (!Array.isArray(baseline.entries)) throw new Error("Invalid dependency audit baseline.");
const known = new Map();
for (const entry of baseline.entries) {
  const date = new Date(`${entry.expires}T23:59:59Z`);
  const key = `${entry.id}:${entry.package}`;
  if (!/^GHSA-[a-z0-9-]+$/.test(entry.id || "") || typeof entry.package !== "string" || !entry.reason ||
    !/^\d{4}-\d{2}-\d{2}$/.test(entry.expires || "") || !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== entry.expires || !/^[a-f0-9]{64}$/.test(entry.fingerprint || "") || known.has(key)) {
    throw new Error("Malformed or duplicate dependency audit exception.");
  }
  known.set(key, entry);
}
const blocked = [];
for (const advisory of Object.values(report.advisories)) {
  if (!["critical", "high"].includes(advisory.severity)) continue;
  if (!Array.isArray(advisory.findings) || advisory.findings.some((finding) => typeof finding.version !== "string" || !Array.isArray(finding.paths) || finding.paths.some((path) => typeof path !== "string"))) throw new Error("Invalid dependency audit findings.");
  const findings = advisory.findings.map((finding) => ({ paths: [...finding.paths].sort(), version: finding.version }));
  const fingerprint = createHash("sha256").update(JSON.stringify(findings)).digest("hex");
  const accepted = known.get(`${advisory.github_advisory_id}:${advisory.module_name}`);
  if (advisory.severity === "critical" || !accepted?.reason || accepted.fingerprint !== fingerprint || new Date(`${accepted.expires}T23:59:59Z`).getTime() < Date.now()) {
    blocked.push(`${advisory.severity}: ${advisory.module_name} ${advisory.github_advisory_id}`);
  }
}
fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/dependency-audit.json", JSON.stringify(report, null, 2));
console.log(`Dependency graph audit: ${JSON.stringify(report.metadata.vulnerabilities)}. Proposed source-grounded high-risk exceptions are explicitly time-bound in security/dependency-audit-baseline.json; this includes dev-supplied Medusa peers and is not deployed-consumer proof.`);
if (blocked.length) { console.error(`Unreviewed or expired vulnerabilities:\n${blocked.join("\n")}`); process.exit(1); }
