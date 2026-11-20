# Operator console — agent contract

An operator-facing starter console for Plat5 APIs, built with Solid 2, TanStack Router, TanStack Query, `@ui-sdk/solid`, and Tailwind CSS v4.

## Locked

| Invariant | Location |
|---|---|
| Static SPA only. No SSR server, no secrets | `vite.config.ts`, `Dockerfile` |
| Runtime `/config.js` wins over `VITE_*` build env; `vite build` fails on missing required vars unless `--mode runtime` | `src/config.ts`, `vite.config.ts`, `docker/config.sh` |
| Login is OIDC / OAuth 2.0 Authorization Code + PKCE with a public client (`sessionStorage` token) | `src/auth/oidc.ts`, `src/auth/session.ts` |
| The access token goes to the operator gateway and nowhere else | `src/api/client.ts` |
| Console paths mirror the operator gateway paths by id (including `/as/{member_id}/…`) | `src/router.tsx`, `src/appTabs.tsx` |
| Errors show the Plat5 envelope and `X-Request-ID` | `src/components/ErrorAlert.tsx` |
| Purged nodes are read-only via `writable(node)`; refusals branch by error `code`, never status | `src/api/identity.ts`, `src/pages/NodePage.tsx` |
| `@ui-sdk/core` stays excluded from Vite `optimizeDeps` | `vite.config.ts` |

## Stop conditions

- Client-side authorization in the console: hiding, filtering, or role checks. The gateway decides; a 403 is shown as a 403
- Calling backend services directly, the IdP's admin API, or anything other than the operator gateway and the IdP's OIDC/OAuth endpoints
- Creating customer credentials (API keys, invite tokens, member sessions), even if a gateway routes it
- Using `window.confirm()` or `window.prompt()` instead of UI SDK dialogs

## UI SDK

Before using `@ui-sdk/solid`, follow the `ui-sdk` skill if it is installed, and read `node_modules/@ui-sdk/solid/docs/llms.txt`. To build a new component from behaviors, also search `node_modules/@ui-sdk/solid/docs/core.md` by heading, and read `rendering.md` next to it.

## Working here

1. Run `bun run lint && bun run build:runtime` before finishing.
2. Don't commit unless asked.
