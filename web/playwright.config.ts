import { defineConfig } from "@playwright/test";

const DEV_SERVER_URL = "http://localhost:4100";
const PHONE_VIEWPORT = { width: 390, height: 844 };

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: DEV_SERVER_URL,
    browserName: "chromium",
    viewport: PHONE_VIEWPORT,
    hasTouch: true,
    locale: "ja-JP"
  },
  webServer: {
    command: "pnpm dev",
    url: DEV_SERVER_URL,
    reuseExistingServer: true
  }
});
