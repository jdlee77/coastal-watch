// Tests open the page in a headless browser and answer every outside request
// with saved feed responses (tests/fixtures). Nothing reaches the live feeds.
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "tests",
  timeout: 30000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:8787", trace: "off" },
  webServer: {
    command: "python3 -m http.server 8787",
    url: "http://localhost:8787/index.html",
    reuseExistingServer: true,
    stdout: "ignore",
    stderr: "pipe",
  },
});
