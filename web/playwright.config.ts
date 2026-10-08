import { defineConfig } from "@playwright/test";

const DEFAULT_DEV_SERVER_PORT = "4100";
const DEV_SERVER_PORT = process.env.E2E_PORT ?? DEFAULT_DEV_SERVER_PORT;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;
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
    command: `pnpm dev --port ${DEV_SERVER_PORT} --strictPort`,
    url: DEV_SERVER_URL,
    reuseExistingServer: true
  }
});
