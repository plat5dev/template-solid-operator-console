# Operator console (Solid + TanStack + UI SDK)

A starter console for your operators, on the [operator gateway](https://github.com/plat5dev/operator): every tree of nodes and every person, their bindings, members, service accounts, keys, invites, tasks and audit logs, the operator log, and a raw request workbench for anything else.

It is a static SPA. It signs operators in with OIDC or OAuth 2.0 (authorization code + PKCE, public client), then calls the operator gateway's paths by node id with the operator token. It has no backend and no secrets. The gateway authenticates, authorizes, and records every request in the operator log.

`plat5 init` copies it into a project's `operator-console/` folder, beside the API starter. Fork it, customize `src/api/kinds.ts` and `src/appTabs.tsx`, and replace the starter Tasks tab with your own domain views.

Stack: **Vite 8 · Solid 2 · TanStack Router · TanStack Query · `@ui-sdk/solid` · Tailwind CSS v4 · TypeScript · `oauth4webapi`**

## Visual plane

It wears the operator plane's look: Plat5's paper and ink with an **amber** accent, a persistent amber bar across the top naming the gateway and signed-in operator, and an `operator` tag beside the wordmark. The customer console is violet and Plat5 itself is blue, so nobody mistakes the operator plane for the customer product.

## Run

`plat5 start` runs it at `http://localhost:5412` with the CLI's operator module (gateway `:5410`, operator IdP `:5411`, client `operator-console`). Sign in locally as `operator@example.com` / `password`.

On your own machine against a running stack (`plat5 start -x app`):

```bash
bun install
bun run dev          # http://localhost:5412
```

Local `bun run dev` defaults to the `plat5 start` operator stack (`http://localhost:5410`, `http://localhost:5411`, `operator-console`). To point at another gateway or IdP, copy `.env.example` to `.env.local` and edit it.

## Settings

`bun run build` requires the build-time `VITE_*` variables below (so a Cloudflare Pages deploy never ships pointing at localhost). `bun run build:runtime` skips the check for container images that inject `/config.js` at startup via `docker/config.sh`. Runtime `/config.js` always wins over build-time `VITE_*`.

| Container env (`docker/config.sh`) | Build-time (`VITE_*`) | Dev default | Notes |
|---|---|---|---|
| `GATEWAY_URL` | `VITE_GATEWAY_URL` | `http://localhost:5410` | Required in prod. Gateway origin; `ALLOWED_ORIGINS` must include console origin |
| `AUTH_ISSUER` | `VITE_AUTH_ISSUER` | `http://localhost:5411` | Required in prod. Must match gateway `AUTH_ISSUER` exactly |
| `AUTH_CLIENT_ID` | `VITE_AUTH_CLIENT_ID` | `operator-console` | Required in prod. Public PKCE client; redirect URI `<origin>/callback` |
| `AUTH_SCOPES` | `VITE_AUTH_SCOPES` | `openid email profile` | Optional |
| `AUTH_AUDIENCE` | `VITE_AUTH_AUDIENCE` | (unset) | Optional. Sent as `audience` on `/authorize` (e.g. Auth0) |

Plain `http` issuers are refused except on `localhost` and `127.0.0.1`.

## Structure

```
src/
  router.tsx         typed TanStack Router tree mirroring operator gateway paths
  appTabs.tsx        your API's domain tabs on a node (Tasks on project by default)
  config.ts          runtime /config.js → VITE_* → dev defaults
  index.css          @layer ui-sdk, Tailwind v4, and amber operator design tokens
  api/               client.ts, kinds.ts, identity.ts, audit.ts, tasks.ts, queries.ts, useMemberNames.ts
  auth/              OIDC/OAuth2 PKCE (oidc.ts), sessionStorage token (session.ts), AuthContext
  components/ui/     styled wrappers around @ui-sdk/solid primitives (Dialog, Drawer, Select, Combobox, Menu, Tabs, SegmentedControl, Collapsible, Toast, AlertDialog)
  components/        Layout, ErrorAlert, NodeCrumbs, NodeTable, ActAs, KeysTable, AuditLog, auditValues, RoleSelect, RequireAuth, Wordmark
  pages/             HomePage, CallbackPage, NodesPage, NodePage, TasksTab, MemberPage, ServiceAccountPage, UsersPage, UserPage, OperatorLogPage, RequestPage
```

### Customizing for your product

- **Node kinds**: edit `KINDS` in `src/api/kinds.ts` to match your `plat5.yml`.
- **Replace Tasks with your API's tabs**: edit `APP_NODE_TABS` in `src/appTabs.tsx` and delete `src/api/tasks.ts` and `src/pages/TasksTab.tsx`.
- **Add a standalone page**: add a page in `src/pages/`, register its route in `src/router.tsx`, and link it in `src/components/Layout.tsx`.

## Production image

The `Dockerfile` builds a static SPA behind nginx on `:8080`:

```bash
docker build -t operator-console .
docker run -p 5412:8080 \
  -e GATEWAY_URL=http://localhost:5410 \
  -e AUTH_ISSUER=http://localhost:5411 \
  -e AUTH_CLIENT_ID=operator-console \
  operator-console
```

## Deploy to Cloudflare Pages

1. Connect the repository to Cloudflare Pages.
2. Build command: `bun run build`. Output directory: `dist`.
3. Set `VITE_GATEWAY_URL`, `VITE_AUTH_ISSUER`, `VITE_AUTH_CLIENT_ID` (plus optional `VITE_AUTH_SCOPES`, `VITE_AUTH_AUDIENCE`, and `BUN_VERSION`).
4. Register `<origin>/callback` on the IdP client and add `<origin>` to the gateway's `ALLOWED_ORIGINS`.

`public/_headers` sends `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and `X-Robots-Tag: noindex`.

## Quality checks

```bash
bun run lint
bun run build:runtime
```

## License

MIT — see [LICENSE](LICENSE).
