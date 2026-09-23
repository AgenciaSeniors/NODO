import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// End-to-end checks against a production build on example content
// (`NODO_MODE=demo npm run build` first). They never touch the real database.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Pixel 7"],
    locale: "es-ES",
  },
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    env: { NODO_MODE: "demo" },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
