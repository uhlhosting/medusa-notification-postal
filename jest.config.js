const { loadEnv } = require("@medusajs/framework/utils")

loadEnv("test", process.cwd())

module.exports = {
  transform: {
    "^.+\\.[jt]s$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            decorators: true,
          },
          target: "es2021",
        },
      },
    ],
  },
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "json"],
  modulePathIgnorePatterns: ["dist/", "/.medusa/"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "reports/junit",
        outputName: "junit.xml",
      },
    ],
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "cobertura"],
  setupFiles: ["./integration-tests/setup.js"],
  testPathIgnorePatterns: [],
  testMatch: ["**/src/**/__tests__/**/*.spec.[jt]s", "**/test/**/*.test.[jt]s"],
}

if (process.env.TEST_TYPE === "integration:http") {
  module.exports.testMatch = ["**/integration-tests/http/*.spec.[jt]s"]
} else if (process.env.TEST_TYPE === "integration:modules") {
  module.exports.testPathIgnorePatterns = []
  module.exports.testMatch = ["**/src/modules/*/__tests__/**/*.integration.spec.[jt]s"]
} else if (process.env.TEST_TYPE === "unit") {
  module.exports.testMatch = ["**/src/**/__tests__/**/*.spec.[jt]s", "**/test/**/*.test.[jt]s"]
}
