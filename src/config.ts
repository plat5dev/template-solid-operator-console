// Settings resolution order:
// 1. Runtime /config.js (written at container start by docker/config.sh)
// 2. Build-time VITE_* env vars
// 3. In Vite dev only: local `plat5 start` operator stack defaults (:5410, :5411, operator-console)
// Production builds fail in vite.config.ts if required VITE_* are missing unless `--mode runtime`,
// and main.tsx refuses to boot if runtime /config.js left required settings empty.
type Settings = {
  gatewayUrl?: string
  issuer?: string
  clientId?: string
  scopes?: string
  audience?: string
}

const runtime: Settings = (window as { __CONSOLE_CONFIG__?: Settings }).__CONSOLE_CONFIG__ ?? {}
const env = import.meta.env
const dev = env.DEV

function setting(name: keyof Settings, build: string | undefined, devFallback = ""): string {
  return (runtime[name] || build || (dev ? devFallback : "")).trim()
}

export const config = {
  gatewayUrl: setting("gatewayUrl", env.VITE_GATEWAY_URL, "http://localhost:5410").replace(/\/$/, ""),
  issuer: setting("issuer", env.VITE_AUTH_ISSUER, "http://localhost:5411"),
  clientId: setting("clientId", env.VITE_AUTH_CLIENT_ID, "operator-console"),
  scopes: setting("scopes", env.VITE_AUTH_SCOPES) || "openid email profile",
  audience: setting("audience", env.VITE_AUTH_AUDIENCE),
  redirectUri: `${window.location.origin}/callback`,
} as const

/** Required settings that are empty: the console would point at nothing. */
export const missingSettings = (
  [
    ["gatewayUrl", "GATEWAY_URL"],
    ["issuer", "AUTH_ISSUER"],
    ["clientId", "AUTH_CLIENT_ID"],
  ] as const
)
  .filter(([key]) => !config[key])
  .map(([, name]) => name)
