import { infiniteQueryOptions, queryOptions } from "@tanstack/solid-query"
import type { AuditEvent, OperatorAuditEvent } from "./audit"
import { api, path, withCursor, type RequestOptions } from "./client"
import type {
  Binding,
  Invite,
  Key,
  Member,
  Membership,
  Node,
  NodeStatus,
  RolesList,
  ServiceAccount,
  User,
} from "./identity"
import type { Task } from "./tasks"

export type Paged<T> = {
  items: T[]
  hasMore: boolean
}

async function fetchPaged<T>(
  target: string,
  collection: string,
  after?: string,
  opts?: RequestOptions,
): Promise<Paged<T>> {
  const page = await api<Record<string, unknown>>("GET", withCursor(target, after), undefined, opts)
  return {
    items: (page[collection] as T[] | undefined) ?? [],
    hasMore: page.has_more === true,
  }
}

function nextCursor<T extends { id: string }>(last: Paged<T>): string | undefined {
  return last.hasMore && last.items.length > 0 ? last.items[last.items.length - 1]!.id : undefined
}

/**
 * Shared TanStack Query keys and option factories for every operator gateway read.
 * Mutations invalidate from these keys so all views stay consistent.
 */
export const queryKeys = {
  roots: (kind: string, status: NodeStatus | "") => ["roots", kind, status] as const,
  allRoots: () => ["roots"] as const,

  node: (nodeId: string) => ["node", nodeId] as const,
  children: (nodeId: string, kind: string, status: NodeStatus, memberId?: string) =>
    ["children", nodeId, kind, status, memberId ?? ""] as const,
  allChildren: (nodeId: string) => ["children", nodeId] as const,

  roles: (nodeId: string) => ["roles", nodeId] as const,
  bindings: (nodeId: string) => ["bindings", nodeId] as const,
  members: (rootId: string) => ["members", rootId] as const,
  membersSample: (rootId: string) => ["members-sample", rootId] as const,
  member: (rootId: string, memberId: string) => ["member", rootId, memberId] as const,
  memberUser: (memberId: string) => ["member-user", memberId] as const,
  membership: (rootId: string, memberId: string) => ["membership", rootId, memberId] as const,

  serviceAccounts: (nodeId: string) => ["service-accounts", nodeId] as const,
  serviceAccount: (nodeId: string, saId: string) => ["service-account", nodeId, saId] as const,
  keys: (base: string) => ["keys", base] as const,
  invites: (nodeId: string) => ["invites", nodeId] as const,
  auditEvents: (base: string, query: string) => ["audit-events", base, query] as const,
  tasks: (projectId: string, memberId?: string) => ["tasks", projectId, memberId ?? ""] as const,

  usersLookup: (issuer: string, subject: string) => ["users-lookup", issuer, subject] as const,
  user: (userId: string) => ["user", userId] as const,
  userNodes: (userId: string, deleted: boolean) => ["user-nodes", userId, deleted] as const,
  operatorAudit: (query: string) => ["operator-audit", query] as const,
}

export const queries = {
  roots: (kind: string, status: NodeStatus | "") => {
    const q = new URLSearchParams({ kind })
    if (status) q.set("status", status)
    const target = `/services/identity/nodes?${q}`
    return infiniteQueryOptions({
      queryKey: queryKeys.roots(kind, status),
      queryFn: ({ pageParam }) => fetchPaged<Node>(target, "nodes", pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: nextCursor,
    })
  },

  node: (nodeId: string) =>
    queryOptions({
      queryKey: queryKeys.node(nodeId),
      queryFn: () => api<Node>("GET", path`/services/identity/nodes/${nodeId}`),
    }),

  children: (nodeId: string, kind: string, status: NodeStatus, memberId?: string) => {
    const target = memberId
      ? path`/services/identity/nodes/${nodeId}/children/${kind}` + (status === "deleted" ? "?status=deleted" : "")
      : `/services/identity/nodes?parent_id=${encodeURIComponent(nodeId)}&kind=${encodeURIComponent(kind)}&status=${status}`
    return infiniteQueryOptions({
      queryKey: queryKeys.children(nodeId, kind, status, memberId),
      queryFn: ({ pageParam }) => fetchPaged<Node>(target, "nodes", pageParam, { asMember: memberId }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: nextCursor,
    })
  },

  roles: (nodeId: string) =>
    queryOptions({
      queryKey: queryKeys.roles(nodeId),
      queryFn: () => api<RolesList>("GET", path`/services/identity/nodes/${nodeId}/roles`),
    }),

  bindings: (nodeId: string) => {
    const target = path`/services/identity/nodes/${nodeId}/bindings`
    return infiniteQueryOptions({
      queryKey: queryKeys.bindings(nodeId),
      queryFn: ({ pageParam }) => fetchPaged<Binding>(target, "bindings", pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: nextCursor,
    })
  },

  members: (rootId: string) => {
    const target = path`/services/identity/nodes/${rootId}/members`
    return infiniteQueryOptions({
      queryKey: queryKeys.members(rootId),
      queryFn: ({ pageParam }) => fetchPaged<Member>(target, "members", pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: nextCursor,
    })
  },

  /** First 100 members of a root, for pickers (ActAs, Add binding). */
  membersSample: (rootId: string) =>
    queryOptions({
      queryKey: queryKeys.membersSample(rootId),
      queryFn: async () => {
        const res = await api<{ members: Member[] }>("GET", path`/services/identity/nodes/${rootId}/members` + "?limit=100")
        return res.members ?? []
      },
    }),

  member: (rootId: string, memberId: string) =>
    queryOptions({
      queryKey: queryKeys.member(rootId, memberId),
      queryFn: () => api<Member>("GET", path`/services/identity/nodes/${rootId}/members/${memberId}`),
    }),

  memberUser: (memberId: string) =>
    queryOptions({
      queryKey: queryKeys.memberUser(memberId),
      queryFn: () => api<User>("GET", path`/services/identity/members/${memberId}/user`),
      retry: false,
    }),

  membership: (rootId: string, memberId: string) =>
    queryOptions({
      queryKey: queryKeys.membership(rootId, memberId),
      queryFn: () => api<Membership>("GET", path`/services/identity/nodes/${rootId}/memberships/${memberId}`),
    }),

  serviceAccounts: (nodeId: string) => {
    const target = path`/services/identity/nodes/${nodeId}/service-accounts`
    return infiniteQueryOptions({
      queryKey: queryKeys.serviceAccounts(nodeId),
      queryFn: ({ pageParam }) => fetchPaged<ServiceAccount>(target, "service_accounts", pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: nextCursor,
    })
  },

  serviceAccount: (nodeId: string, saId: string) =>
    queryOptions({
      queryKey: queryKeys.serviceAccount(nodeId, saId),
      queryFn: () => api<ServiceAccount>("GET", path`/services/identity/nodes/${nodeId}/service-accounts/${saId}`),
    }),

  keys: (base: string) =>
    infiniteQueryOptions({
      queryKey: queryKeys.keys(base),
      queryFn: ({ pageParam }) => fetchPaged<Key>(base, "keys", pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: nextCursor,
    }),

  invites: (nodeId: string) => {
    const target = path`/services/identity/nodes/${nodeId}/invites`
    return infiniteQueryOptions({
      queryKey: queryKeys.invites(nodeId),
      queryFn: ({ pageParam }) => fetchPaged<Invite>(target, "invites", pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: nextCursor,
    })
  },

  auditEvents: (base: string, query: string) => {
    const target = `/services/audit${base}/audit-events${query}`
    return infiniteQueryOptions({
      queryKey: queryKeys.auditEvents(base, query),
      queryFn: ({ pageParam }) => fetchPaged<AuditEvent>(target, "audit_events", pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: nextCursor,
    })
  },

  tasks: (projectId: string, memberId?: string) => {
    const target = path`/services/api/projects/${projectId}/tasks`
    return infiniteQueryOptions({
      queryKey: queryKeys.tasks(projectId, memberId),
      queryFn: ({ pageParam }) => fetchPaged<Task>(target, "tasks", pageParam, { asMember: memberId }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: nextCursor,
    })
  },

  usersLookup: (issuer: string, subject: string) => {
    const q = new URLSearchParams({ issuer, subject })
    return queryOptions({
      queryKey: queryKeys.usersLookup(issuer, subject),
      queryFn: async () => {
        const res = await api<{ users: User[] }>("GET", `/services/identity/users?${q}`)
        return res.users ?? []
      },
    })
  },

  user: (userId: string) =>
    queryOptions({
      queryKey: queryKeys.user(userId),
      queryFn: () => api<User>("GET", path`/services/identity/users/${userId}`),
    }),

  userNodes: (userId: string, deleted: boolean) => {
    const target = path`/services/identity/users/${userId}/nodes` + (deleted ? "?status=deleted" : "")
    return infiniteQueryOptions({
      queryKey: queryKeys.userNodes(userId, deleted),
      queryFn: ({ pageParam }) => fetchPaged<Node>(target, "nodes", pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: nextCursor,
    })
  },

  operatorAudit: (query: string) => {
    const target = "/services/operator-audit/operator-audit-events" + (query ? `?${query}` : "")
    return infiniteQueryOptions({
      queryKey: queryKeys.operatorAudit(query),
      queryFn: ({ pageParam }) => fetchPaged<OperatorAuditEvent>(target, "audit_events", pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: nextCursor,
    })
  },
}
