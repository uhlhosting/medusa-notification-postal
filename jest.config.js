// Jest runs Medusa-style unit specs only (src/**/__tests__/**/*.unit.spec.ts).
// The existing suites use node:test and run through `pnpm test`. Without this
// filter Jest also collected them, plus their compiled copies in .medusa/server,
// and failed with "Your test suite must contain at least one test".
module.exports = {
  transform: {
    "^.+\\.[jt]s$": [
      "@swc/jest",
      { jsc: { parser: { syntax: "typescript", decorators: true } } },
    ],
  },
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "json"],
  modulePathIgnorePatterns: ["<rootDir>/.medusa/"],
  testMatch: ["**/src/**/__tests__/**/*.unit.spec.[jt]s"],
}
