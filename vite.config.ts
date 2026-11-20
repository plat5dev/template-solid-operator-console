import solid from "@solidjs/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv } from "vite"

// A production build without these would point at nothing. Fail `vite build` unless
// building for the container image (`--mode runtime`), which reads them from /config.js
// at start. `vite dev` falls back to local `plat5 start` defaults in src/config.ts.
const required = ["VITE_GATEWAY_URL", "VITE_AUTH_ISSUER", "VITE_AUTH_CLIENT_ID"]

// :5412 is the operator console's local port (plat5.template.yml).
// @ui-sdk/core must stay excluded from Vite dependency pre-bundling so @ui-sdk/solid
// and app code share a single core instance in development.
export default defineConfig(({ command, mode }) => {
  if (command === "build" && mode !== "runtime") {
    const env = loadEnv(mode, process.cwd(), "VITE_")
    const missing = required.filter((name) => !env[name])
    if (missing.length > 0) {
      throw new Error(`Missing ${missing.join(", ")}. See .env.example.`)
    }
  }

  return {
    plugins: [tailwindcss(), solid()],
    optimizeDeps: {
      exclude: ["@ui-sdk/core"],
    },
    server: { port: 5412, strictPort: true },
    preview: { port: 5412, strictPort: true },
  }
})
