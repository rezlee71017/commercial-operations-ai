import path from "node:path";
import { defineConfig } from "vitest/config";

// The "@/..." alias used by the Next.js routes, so route handlers can be tested directly.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
