import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
} from "@tanstack/solid-router"
import { APP_NODE_TABS } from "./appTabs"
import { AuthProvider } from "./auth/AuthContext"
import { Layout } from "./components/Layout"
import { RequireAuth } from "./components/RequireAuth"
import { AppOverlays } from "./components/ui/overlays"
import { CallbackPage } from "./pages/CallbackPage"
import { HomePage } from "./pages/HomePage"
import { MemberPage } from "./pages/MemberPage"
import { NodePage, type BuiltinNodeTab } from "./pages/NodePage"
import { NodesPage } from "./pages/NodesPage"
import { OperatorLogPage, type OperatorLogSearch } from "./pages/OperatorLogPage"
import { RequestPage } from "./pages/RequestPage"
import { ServiceAccountPage } from "./pages/ServiceAccountPage"
import { UserPage } from "./pages/UserPage"
import { UsersPage } from "./pages/UsersPage"

const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined)

// Console paths mirror the operator gateway paths by id.
// `?as=<memberId>` acts as that member (via `X-Plat5-As-Member`) on routes that allow it.
const rootRoute = createRootRoute({
  component: () => (
    <AuthProvider>
      <Layout />
      <AppOverlays />
    </AuthProvider>
  ),
  notFoundComponent: () => <Navigate to="/" replace />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
})

const callbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/callback",
  component: CallbackPage,
})

const nodesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/nodes",
  validateSearch: (search: Record<string, unknown>): { kind?: string; status?: string } => ({
    kind: str(search.kind),
    status: typeof search.status === "string" ? search.status : undefined,
  }),
  component: () => (
    <RequireAuth>
      <NodesPage />
    </RequireAuth>
  ),
})

const nodeDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/nodes/$nodeId",
  component: () => (
    <RequireAuth>
      <NodePage />
    </RequireAuth>
  ),
})

const nodeChildrenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/nodes/$nodeId/children/$kind",
  validateSearch: (search: Record<string, unknown>): { as?: string } => ({
    as: str(search.as),
  }),
  component: () => (
    <RequireAuth>
      <NodePage tab="children" />
    </RequireAuth>
  ),
})

const builtinNodeTabs: BuiltinNodeTab[] = [
  "bindings",
  "members",
  "service-accounts",
  "invites",
  "roles",
  "audit-events",
]

const nodeTabRoutes = builtinNodeTabs.map((tab) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: `/nodes/$nodeId/${tab}`,
    component: () => (
      <RequireAuth>
        <NodePage tab={tab} />
      </RequireAuth>
    ),
  }),
)

const appTabRoutes = APP_NODE_TABS.map((t) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: t.routePath,
    validateSearch: t.asMember
      ? (search: Record<string, unknown>): { as?: string } => ({ as: str(search.as) })
      : undefined,
    component: () => (
      <RequireAuth>
        <NodePage tab={t.key} />
      </RequireAuth>
    ),
  }),
)

const memberDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/nodes/$nodeId/members/$memberId",
  component: () => (
    <RequireAuth>
      <MemberPage />
    </RequireAuth>
  ),
})

const serviceAccountDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/nodes/$nodeId/service-accounts/$serviceAccountId",
  component: () => (
    <RequireAuth>
      <ServiceAccountPage />
    </RequireAuth>
  ),
})

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  validateSearch: (search: Record<string, unknown>): { issuer?: string; subject?: string } => ({
    issuer: str(search.issuer),
    subject: str(search.subject),
  }),
  component: () => (
    <RequireAuth>
      <UsersPage />
    </RequireAuth>
  ),
})

const userDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users/$userId",
  component: () => (
    <RequireAuth>
      <UserPage />
    </RequireAuth>
  ),
})

const userNodesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users/$userId/nodes",
  component: () => (
    <RequireAuth>
      <UserPage tab="nodes" />
    </RequireAuth>
  ),
})

const userKeysRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users/$userId/keys",
  component: () => (
    <RequireAuth>
      <UserPage tab="keys" />
    </RequireAuth>
  ),
})

const userAuditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users/$userId/audit-events",
  component: () => (
    <RequireAuth>
      <UserPage tab="audit-events" />
    </RequireAuth>
  ),
})

const operatorLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/operator-audit-events",
  validateSearch: (search: Record<string, unknown>): OperatorLogSearch => ({
    node_id: str(search.node_id),
    operator_id: str(search.operator_id),
    acting_as_member_id: str(search.acting_as_member_id),
    service: str(search.service),
    route: str(search.route),
    request_id: str(search.request_id),
    created_id: str(search.created_id),
    method: str(search.method),
    outcome: str(search.outcome),
    occurred_after: str(search.occurred_after),
    occurred_before: str(search.occurred_before),
  }),
  component: () => (
    <RequireAuth>
      <OperatorLogPage />
    </RequireAuth>
  ),
})

const requestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/request",
  validateSearch: (search: Record<string, unknown>): { method?: string; path?: string; as?: string } => ({
    method: str(search.method),
    path: str(search.path),
    as: str(search.as),
  }),
  component: () => (
    <RequireAuth>
      <RequestPage />
    </RequireAuth>
  ),
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  callbackRoute,
  nodesRoute,
  nodeDetailRoute,
  nodeChildrenRoute,
  ...nodeTabRoutes,
  ...appTabRoutes,
  memberDetailRoute,
  serviceAccountDetailRoute,
  usersRoute,
  userDetailRoute,
  userNodesRoute,
  userKeysRoute,
  userAuditRoute,
  operatorLogRoute,
  requestRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
})

declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router
  }
}
