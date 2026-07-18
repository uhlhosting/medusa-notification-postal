import { execFileSync } from "node:child_process"

const ZERO_SHA = /^0+$/
const CONVENTIONAL_COMMIT = /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z0-9][a-z0-9._/-]*\))?(!)?: .+$/
const MERGE_COMMIT = /^Merge (branch|remote-tracking branch|pull request) /

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim()
}

function resolveRange() {
  const head = process.env.CI_COMMIT_SHA || "HEAD"
  const base = process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA || process.env.CI_COMMIT_BEFORE_SHA

  if (base && !ZERO_SHA.test(base)) {
    return [`${base}..${head}`]
  }

  try {
    git("rev-parse", `${head}^`)
    return [`${head}^..${head}`]
  } catch {
    return [head]
  }
}

const commits = process.env.CI_COMMIT_TITLE
  ? [`${process.env.CI_COMMIT_SHA || "CI"}\t${process.env.CI_COMMIT_TITLE}`]
  : git("log", "--format=%H%x09%s", ...resolveRange())
      .split("\n")
      .filter(Boolean)

const invalid = commits.filter((line) => {
  const [, subject = ""] = line.split("\t", 2)
  return !CONVENTIONAL_COMMIT.test(subject) && !MERGE_COMMIT.test(subject)
})

if (invalid.length) {
  console.error("Invalid commit messages. Use Conventional Commits:")
  for (const line of invalid) {
    console.error(`- ${line}`)
  }
  console.error("Examples: fix(api): handle timeout, feat(admin): add settings, chore(deps): update dependencies")
  process.exit(1)
}

console.log(`Commit message verification passed for ${commits.length} commit(s)`)
