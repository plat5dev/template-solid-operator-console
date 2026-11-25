// Plat5 identity, as routed by the operator gateway: its own paths, by id.
// Shapes: plat5 docs/reference/api/identity.md#shapes. Ids are lowercase ULIDs.

export type Principal = "person" | "service_account"

export type PublicPrincipal = "all_users" | "all_authenticated_users"

export type BindingPrincipal = Principal | "group" | PublicPrincipal

export type NodeStatus = "active" | "deleted" | "purged"

export type Ancestor = {
  id: string
  kind: string
  /** `null` once freed, as on the node. */
  slug: string | null
  display_name: string
}

/** An organization, a project, or any other kind. `ancestors` is root first, without the node. */
export type Node = {
  id: string
  kind: string
  parent_id: string | null
  root_id: string
  /** `null` once freed: on a purged node below a root, and on a root whose slug was released. */
  slug: string | null
  display_name: string
  status: NodeStatus
  /** Opaque rate-limit tier name on a root, or `null`. */
  rate_limit_tier: string | null
  deleted_at: string | null
  /** When a deleted node is purged; it can be restored until then. */
  purge_after: string | null
  created_at: string
  updated_at: string
  ancestors: Ancestor[]
}

/** Whether the console offers writes to this node and what hangs off it: its name,
 *  children, bindings, members, service accounts and their keys, and invites. A purged
 *  node is read-only, and identity answers 409 `NODE_PURGED`; its deletes, which would
 *  change nothing, aren't offered either. Releasing a purged root's slug is the one write it takes. */
export function writable(node: Node): boolean {
  return node.status !== "purged"
}

/** A role for a member, group, or public principal on one node. `inherited` when it sits on an ancestor. */
export type Binding = {
  id: string
  member_id: string | null
  group_id: string | null
  public_principal: PublicPrincipal | null
  node_id: string
  role: string
  inherited: boolean
  guest: boolean
  principal: BindingPrincipal
  name: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

/** What a member holds on a node (`GET /nodes/{node_id}/memberships/{member_id}`). `*` is every permission. */
export type Membership = {
  member_id: string
  bindings: Binding[]
  permissions: string[]
}

/** A principal's presence in one tree. `name` is null for a person who hasn't signed in. */
export type Member = {
  id: string
  principal: Principal
  name: string | null
  status: "active" | "suspended" | "removed"
  guest: boolean
}

/** A flat collection of active members within one tree (`GET /nodes/{root_id}/groups`). */
export type Group = {
  id: string
  name: string
  root_id: string
  created_at: string
  updated_at: string
}

/** A root's security policy (`GET /nodes/{root_id}/security-policy`). */
export type SecurityPolicy = {
  allow_personal_keys: boolean
  allowed_cidrs: string[]
  required_idp_claims: Record<string, string[]>
  updated_at: string | null
}

/** A person, by user id. */
export type User = {
  id: string
  name: string | null
  status: "active" | "suspended"
}

/** A role bindable at a node (predefined system role or root custom role), with resolved permissions. */
export type Role = {
  id?: string
  slug: string
  display_name?: string
  description?: string
  source?: "system" | "custom"
  bindable_at?: string[]
  permissions: string[]
}

export type RolesList = {
  roles: Role[]
  creator_role: string
}

/** `id` is its member id; `node_id` is the node it belongs to. */
export type ServiceAccount = {
  id: string
  name: string
  node_id: string
  created_at: string
  updated_at: string
}

export type Key = {
  id: string
  name: string
  key_prefix: string
  allowed_cidrs?: string[]
  scopes?: string[]
  allowed_roots?: string[]
  expires_at?: string | null
  created_at: string
  revoked_at: string | null
}

export type Grant = {
  node_id: string
  role: string
}

export type InviteStatus = "active" | "redeemed" | "revoked" | "expired"

export type Invite = {
  id: string
  node_id: string
  role: string
  grants: Grant[]
  /** null: unlimited. */
  max_uses: number | null
  use_count: number
  status: InviteStatus
  expires_at: string
  token_prefix: string
  created_at: string
}
