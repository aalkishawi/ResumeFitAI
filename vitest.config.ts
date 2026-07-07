import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Ensure Prisma client construction has a datasource URL (no connection is
    // opened by the unit tests — they exercise pure logic only).
    env: { DATABASE_URL: "file:./dev.db" },
  },
});
