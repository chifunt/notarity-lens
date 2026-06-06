import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@notarity-lens/shared": fileURLToPath(
        new URL("../../packages/shared/src/index.ts", import.meta.url),
      ),
      "@notarity-lens/notarity": fileURLToPath(
        new URL("../../packages/notarity/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
  },
});
