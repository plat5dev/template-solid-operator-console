import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/solid-query"
import { Link, useNavigate, useParams, useSearch } from "@tanstack/solid-router"
import type { JSX } from "@solidjs/web"
import { createEffect, createMemo, createSignal, For, Match, Show, Switch } from "solid-js"
import { api, hasCode, path } from "../api/client"
import {
  writable,
  type Binding,
  type Invite,
  type Member,
  type Node,
  type NodeStatus,
} from "../api/identity"
import { childKinds, plural } from "../api/kinds"
import { queries, queryKeys } from "../api/queries"
import { APP_NODE_TABS } from "../appTabs"
import { ActAsBanner, ActAsPicker } from "../components/ActAs"
import { AuditLog } from "../components/AuditLog"
import { ErrorAlert } from "../components/ErrorAlert"
import { Icon } from "../components/icons"
import { initials } from "../components/initials"
import { NodeCrumbs } from "../components/NodeCrumbs"
import { NodeTable } from "../components/NodeTable"
import { RoleSelect } from "../components/RoleSelect"
import {
  Avatar,
  Badge,
  Chip,
  EmptyState,
  Id,
  LoadingState,
  LoadMore,
  PageHead,
  Slug,
  Status,
  When,
} from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../components/ui/Combobox"
import {
  Dialog,
  DialogBackdrop,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/Dialog"
import { Field, FieldLabel, Input } from "../components/ui/Field"
import { confirm, toast } from "../components/ui/overlays"
import { SegmentedControl, SegmentedControlItem } from "../components/ui/SegmentedControl"
import { Tabs, TabsList, TabsTab } from "../components/ui/Tabs"

export type BuiltinNodeTab =
  | "children"
  | "bindings"
  | "members"
  | "service-accounts"
  | "invites"
  | "roles"
  | "audit-events"

export type NodeTab = BuiltinNodeTab | (string & {})

function tabPath(node: Node, tab: NodeTab, kind?: string): string {
  if (tab === "children") return path`/nodes/${node.id}/children/${kind ?? ""}`
  const appTab = APP_NODE_TABS.find((t) => t.key === tab && t.kind === node.kind)
  if (appTab) return appTab.nodePath(node)
  return path`/nodes/${node.id}/` + tab
}

function defaultTab(node: Node): { tab: NodeTab; kind?: string } {
  const kinds = childKinds(node.kind)
  if (kinds.length > 0) return { tab: "children", kind: kinds[0] }
  const appTab = APP_NODE_TABS.find((t) => t.kind === node.kind)
  if (appTab) return { tab: appTab.key }
  return { tab: "bindings" }
}

/** A node of any kind, by id: compact header + metadata bar + lifecycle actions, then
 *  URL-driven tabs for children, API tabs (`src/appTabs.tsx`), bindings, members (on a root),
 *  service accounts, invites, roles, and audit log. */
export function NodePage(props: { tab?: NodeTab }) {
  const params = useParams({ strict: false }) as () => {
    nodeId?: string
    kind?: string
  }
  const search = useSearch({ strict: false }) as () => { as?: string }
  const nodeId = () => params().nodeId ?? ""
  const routedKind = () => params().kind
  const memberId = () => search().as

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const nodeQuery = useQuery(() => queries.node(nodeId()))

  const reloadNode = () => void queryClient.invalidateQueries({ queryKey: queryKeys.node(nodeId()) })

  return (
    <Switch>
      <Match when={nodeQuery.isPending}>
        <LoadingState />
      </Match>
      <Match when={nodeQuery.isError}>
        <ErrorAlert error={nodeQuery.error} />
      </Match>
      <Match when={nodeQuery.isSuccess}>
        {(() => {
          const n = () => nodeQuery.data!
          const fallback = () => defaultTab(n())
          const activeTab = () => props.tab ?? fallback().tab
          const activeKind = () => routedKind() ?? fallback().kind
          const isRoot = () => n().parent_id === null
          const appTabs = () => APP_NODE_TABS.filter((t) => t.kind === n().kind)
          const activeAppTab = () => appTabs().find((t) => t.key === activeTab())

          const tabs = createMemo<[string, string][]>(() => [
            ...childKinds(n().kind).map((k): [string, string] => [`children/${k}`, plural(k)]),
            ...appTabs().map((t): [string, string] => [t.key, t.label]),
            ["bindings", "Bindings"],
            ...(isRoot() ? ([["members", "Members"]] as [string, string][]) : []),
            ["service-accounts", "Service accounts"],
            ["invites", "Invites"],
            ["roles", "Roles"],
            ["audit-events", "Audit log"],
          ])

          const currentKey = () => (activeTab() === "children" ? `children/${activeKind()}` : activeTab())

          function onTabChange(key: string | null) {
            if (!key) return
            const [t, k] = key.split("/") as [NodeTab, string | undefined]
            void navigate({ to: tabPath(n(), t, k) as never })
          }

          return (
            <>
              <NodeHeader
                node={n()}
                onChanged={(updated) => queryClient.setQueryData(queryKeys.node(nodeId()), updated)}
                onReload={reloadNode}
              />

              <Tabs value={currentKey()} onValueChange={onTabChange}>
                <TabsList>
                  <For each={tabs()}>
                    {([key, label]) => <TabsTab value={key}>{label}</TabsTab>}
                  </For>
                </TabsList>
              </Tabs>

              <Switch>
                <Match when={activeTab() === "children" && activeKind()}>
                  <ChildrenTab
                    node={n()}
                    kind={activeKind()!}
                    memberId={memberId()}
                    onPurged={reloadNode}
                  />
                </Match>
                <Match when={activeAppTab()}>
                  {(appTab) => appTab().render({ node: n(), memberId: memberId() })}
                </Match>
                <Match when={activeTab() === "bindings"}>
                  <BindingsTab node={n()} onPurged={reloadNode} />
                </Match>
                <Match when={activeTab() === "members"}>
                  <MembersTab node={n()} onPurged={reloadNode} />
                </Match>
                <Match when={activeTab() === "service-accounts"}>
                  <ServiceAccountsTab node={n()} />
                </Match>
                <Match when={activeTab() === "invites"}>
                  <InvitesTab node={n()} onPurged={reloadNode} />
                </Match>
                <Match when={activeTab() === "roles"}>
                  <RolesTab node={n()} />
                </Match>
                <Match when={activeTab() === "audit-events"}>
                  <div class="space-y-4">
                    <AuditLog base={path`/nodes/${n().id}`} rootId={n().root_id} />
                    <p class="text-xs text-muted">
                      <Link
                        to="/operator-audit-events"
                        search={{ node_id: n().id }}
                        class="font-medium text-accent-text hover:underline underline-offset-2"
                      >
                        View operator log for this node
                      </Link>{" "}
                      and everything below it.
                    </p>
                  </div>
                </Match>
              </Switch>
            </>
          )
        })()}
      </Match>
    </Switch>
  )
}

/** Compact node header + metadata strip + Rename and Delete dialogs. */
function NodeHeader(props: {
  node: Node
  onChanged: (n: Node) => void
  onReload: () => void
}) {
  const base = () => path`/nodes/${props.node.id}`
  const [error, setError] = createSignal<unknown>(null)
  const [graceExpired, setGraceExpired] = createSignal(false)

  const [renameOpen, setRenameOpen] = createSignal(false)
  const [draftName, setDraftName] = createSignal("")

  const [tierOpen, setTierOpen] = createSignal(false)
  const [draftTier, setDraftTier] = createSignal("")

  const [deleteOpen, setDeleteOpen] = createSignal(false)
  const [confirmSlug, setConfirmSlug] = createSignal("")

  // Reset per-node transient state when switching nodes.
  createEffect(
    () => props.node.id,
    () => {
      setError(null)
      setGraceExpired(false)
      setRenameOpen(false)
      setTierOpen(false)
      setDeleteOpen(false)
      setConfirmSlug("")
    },
  )

  function onWriteError(err: unknown) {
    if (hasCode(err, "NODE_PURGED")) props.onReload()
    if (hasCode(err, "GRACE_EXPIRED")) setGraceExpired(true)
    setError(err)
  }

  const renameMutation = useMutation(() => ({
    mutationFn: (displayName: string) => api<Node>("PATCH", base(), { display_name: displayName }),
    onSuccess: (updated) => {
      props.onChanged(updated)
      setRenameOpen(false)
      setError(null)
      toast.success("Renamed")
    },
    onError: onWriteError,
  }))

  const deleteMutation = useMutation(() => ({
    mutationFn: () => api("DELETE", base()),
    onSuccess: () => {
      setDeleteOpen(false)
      setConfirmSlug("")
      setError(null)
      toast.success(`Deleted ${props.node.kind}`)
      props.onReload()
    },
    onError: onWriteError,
  }))

  const restoreMutation = useMutation(() => ({
    mutationFn: () => api<Node>("POST", base() + "/restore"),
    onSuccess: (updated) => {
      props.onChanged(updated)
      setError(null)
      toast.success(`Restored ${props.node.kind}`)
    },
    onError: onWriteError,
  }))

  const releaseMutation = useMutation(() => ({
    mutationFn: () => api<Node>("POST", base() + "/release-slug"),
    onSuccess: (updated) => {
      props.onChanged(updated)
      setError(null)
      toast.success("Slug released")
    },
    onError: onWriteError,
  }))

  const tierMutation = useMutation(() => ({
    mutationFn: (tier: string | null) =>
      api<Node>("PATCH", base() + "/rate-limit-tier", { rate_limit_tier: tier }),
    onSuccess: (updated) => {
      props.onChanged(updated)
      setTierOpen(false)
      setError(null)
      toast.success(updated.rate_limit_tier ? `Rate limit tier set to "${updated.rate_limit_tier}"` : "Rate limit tier cleared")
    },
    onError: onWriteError,
  }))

  const canRename = () => writable(props.node)
  const canSetTier = () => props.node.parent_id === null && writable(props.node)
  const canRestore = () => props.node.status === "deleted" && !graceExpired()
  const canRelease = () =>
    props.node.status === "purged" && props.node.parent_id === null && props.node.slug !== null
  const canDelete = () => props.node.status === "active"

  function onRenameSubmit(e: SubmitEvent) {
    e.preventDefault()
    const trimmed = draftName().trim()
    if (!trimmed) return
    setError(null)
    void renameMutation.mutate(trimmed)
  }

  function onTierSubmit(e: SubmitEvent) {
    e.preventDefault()
    const trimmed = draftTier().trim()
    setError(null)
    void tierMutation.mutate(trimmed || null)
  }

  function onDeleteSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (props.node.slug !== null && confirmSlug().trim() !== props.node.slug) return
    setError(null)
    void deleteMutation.mutate()
  }

  async function onReleaseSlug() {
    const yes = await confirm({
      title: `Release slug "${props.node.slug}"?`,
      description: "A new root node will be able to claim this slug.",
      confirmLabel: "Release slug",
    })
    if (!yes) return
    setError(null)
    void releaseMutation.mutate()
  }

  return (
    <>
      <div class="space-y-4">
        <PageHead
          crumbs={<NodeCrumbs node={props.node} />}
          eyebrow={
            <span class="inline-flex flex-wrap items-center gap-1.5">
              <span>{props.node.kind}</span>
              <span>·</span>
              <Id value={props.node.id} copy />
            </span>
          }
          title={
            <span class="inline-flex flex-wrap items-center gap-2.5">
              <span>{props.node.display_name}</span>
              <Status value={props.node.status} />
            </span>
          }
          actions={
            <>
              <Show when={canRename()}>
                <Button
                  size="sm"
                  onClick={() => {
                    setError(null)
                    setDraftName(props.node.display_name)
                    setRenameOpen(true)
                  }}
                >
                  Rename
                </Button>
              </Show>
              <Show when={canRestore()}>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={restoreMutation.isPending}
                  onClick={() => {
                    setError(null)
                    void restoreMutation.mutate()
                  }}
                >
                  {restoreMutation.isPending ? "Restoring…" : "Restore"}
                </Button>
              </Show>
              <Show when={canRelease()}>
                <Button
                  size="sm"
                  disabled={releaseMutation.isPending}
                  onClick={() => void onReleaseSlug()}
                >
                  Release slug
                </Button>
              </Show>
              <Show when={canDelete()}>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setError(null)
                    setConfirmSlug("")
                    setDeleteOpen(true)
                  }}
                >
                  Delete {props.node.kind}
                </Button>
              </Show>
            </>
          }
        />

        <ErrorAlert error={error()} onDismiss={() => setError(null)} />

        {/* Compact horizontal metadata strip */}
        <dl class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-rule bg-surface px-4 py-2.5 text-xs">
          <div class="flex items-center gap-2">
            <dt class="text-muted">Slug</dt>
            <dd>
              <Slug value={props.node.slug} />
            </dd>
          </div>
          <div class="flex items-center gap-2">
            <dt class="text-muted">Created</dt>
            <dd class="text-text-2">
              <When at={props.node.created_at} />
            </dd>
          </div>
          <div class="flex items-center gap-2">
            <dt class="text-muted">Updated</dt>
            <dd class="text-text-2">
              <When at={props.node.updated_at} />
            </dd>
          </div>
          <Show when={props.node.parent_id === null}>
            <div class="flex items-center gap-2">
              <dt class="text-muted">Rate limit tier</dt>
              <dd class="inline-flex items-center gap-1.5 text-text-2">
                <Show when={props.node.rate_limit_tier} fallback={<span class="text-muted">default</span>}>
                  {(tier) => <code class="text-xs text-text">{tier()}</code>}
                </Show>
                <Show when={canSetTier()}>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null)
                      setDraftTier(props.node.rate_limit_tier ?? "")
                      setTierOpen(true)
                    }}
                    class="text-accent-text hover:underline underline-offset-2 cursor-pointer"
                  >
                    Edit
                  </button>
                </Show>
              </dd>
            </div>
          </Show>
          <Show when={props.node.deleted_at}>
            <div class="flex items-center gap-2">
              <dt class="text-muted">Deleted</dt>
              <dd class="text-text-2">
                <When at={props.node.deleted_at} />
              </dd>
            </div>
          </Show>
          <Show when={props.node.purge_after}>
            <div class="flex items-center gap-2">
              <dt class="text-muted">Purge after</dt>
              <dd class="text-text-2">
                <When at={props.node.purge_after} />
                <Show when={graceExpired()}>
                  <span class="ml-1.5 text-danger">· grace expired</span>
                </Show>
              </dd>
            </div>
          </Show>
        </dl>
      </div>

      {/* Rename dialog */}
      <Dialog open={renameOpen()} onOpenChange={setRenameOpen}>
        <DialogBackdrop />
        <DialogContent>
          <form onSubmit={onRenameSubmit}>
            <DialogHeader>
              <DialogTitle>Rename {props.node.kind}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <ErrorAlert error={error()} onDismiss={() => setError(null)} />
              <Field name="node_display_name">
                <FieldLabel>Display name</FieldLabel>
                <Input
                  value={draftName()}
                  onValueChange={setDraftName}
                  maxlength={128}
                  required
                  autofocus
                />
              </Field>
            </DialogBody>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <Button
                type="submit"
                variant="primary"
                disabled={
                  renameMutation.isPending ||
                  !draftName().trim() ||
                  draftName().trim() === props.node.display_name
                }
              >
                {renameMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rate limit tier dialog */}
      <Dialog open={tierOpen()} onOpenChange={setTierOpen}>
        <DialogBackdrop />
        <DialogContent>
          <form onSubmit={onTierSubmit}>
            <DialogHeader>
              <DialogTitle>Rate limit tier</DialogTitle>
              <DialogDescription>
                Set an opaque tier name matched against gateway rate-limit policies, or leave blank to clear.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <ErrorAlert error={error()} onDismiss={() => setError(null)} />
              <Field name="rate_limit_tier">
                <FieldLabel>Tier</FieldLabel>
                <Input
                  mono
                  value={draftTier()}
                  onValueChange={setDraftTier}
                  maxlength={64}
                  placeholder="e.g. pro, enterprise (blank to clear)"
                  autofocus
                />
              </Field>
            </DialogBody>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <Button
                type="submit"
                variant="primary"
                disabled={tierMutation.isPending || (draftTier().trim() || null) === props.node.rate_limit_tier}
              >
                {tierMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog (requires typing the slug) */}
      <Dialog open={deleteOpen()} onOpenChange={setDeleteOpen}>
        <DialogBackdrop />
        <DialogContent>
          <form onSubmit={onDeleteSubmit}>
            <DialogHeader>
              <DialogTitle>Delete {props.node.display_name}?</DialogTitle>
              <DialogDescription>
                Deletes this {props.node.kind} and every node below it. It can be restored until it is purged.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <ErrorAlert error={error()} onDismiss={() => setError(null)} />
              <Show when={props.node.slug !== null}>
                <Field name="confirm_slug">
                  <FieldLabel>
                    Type <code class="rounded bg-surface-2 px-1 py-0.5 text-text">{props.node.slug}</code> to confirm
                  </FieldLabel>
                  <Input
                    mono
                    value={confirmSlug()}
                    onValueChange={setConfirmSlug}
                    placeholder={props.node.slug ?? ""}
                    required
                    autofocus
                  />
                </Field>
              </Show>
            </DialogBody>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <Button
                type="submit"
                variant="danger"
                disabled={
                  deleteMutation.isPending ||
                  (props.node.slug !== null && confirmSlug().trim() !== props.node.slug)
                }
              >
                {deleteMutation.isPending ? "Deleting…" : `Delete ${props.node.kind}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

const childStatuses: [NodeStatus, string][] = [
  ["active", "Live"],
  ["deleted", "Deleted"],
  ["purged", "Purged"],
]

/** Children of one kind, with status segmented control, ActAs Combobox, and Create dialog. */
function ChildrenTab(props: {
  node: Node
  kind: string
  memberId?: string
  onPurged: () => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [status, setStatus] = createSignal<NodeStatus>("active")
  const [createOpen, setCreateOpen] = createSignal(false)
  const [displayName, setDisplayName] = createSignal("")
  const [slug, setSlug] = createSignal("")
  const [error, setError] = createSignal<unknown>(null)
  const [parentDeleted, setParentDeleted] = createSignal(false)

  // Reset status if acting as a member (purged isn't valid when listing children as a member)
  createEffect(
    () => [props.node.id, props.kind, props.memberId] as const,
    ([, , mid]) => {
      if (mid && status() === "purged") setStatus("active")
      setParentDeleted(false)
      setError(null)
    },
  )

  const statuses = createMemo(() =>
    props.memberId ? childStatuses.filter(([s]) => s !== "purged") : childStatuses,
  )

  const at = () => path`/nodes/${props.node.id}/children/${props.kind}`
  const listQuery = useInfiniteQuery(() =>
    queries.children(props.node.id, props.kind, status(), props.memberId),
  )
  const items = createMemo(() => (listQuery.isSuccess ? listQuery.data.pages.flatMap((p) => p.items) : []))

  const createMutation = useMutation(() => ({
    mutationFn: (vars: { displayName: string; slug: string }) => {
      const body = vars.slug
        ? { display_name: vars.displayName, slug: vars.slug }
        : { display_name: vars.displayName }
      return api<Node>("POST", at(), body, { asMember: props.memberId })
    },
    onSuccess: async (created) => {
      setDisplayName("")
      setSlug("")
      setError(null)
      setCreateOpen(false)
      toast.success(`Created ${props.kind} "${created.display_name}"`)
      await queryClient.invalidateQueries({ queryKey: queryKeys.allChildren(props.node.id) })
      void navigate({ to: "/nodes/$nodeId", params: { nodeId: created.id } })
    },
    onError: (err) => {
      if (hasCode(err, "PARENT_DELETED")) setParentDeleted(true)
      if (hasCode(err, "NODE_PURGED")) props.onPurged()
      setError(err)
    },
  }))

  const canCreate = () => writable(props.node) && props.node.status !== "deleted" && !parentDeleted()

  function onCreate(e: SubmitEvent) {
    e.preventDefault()
    const name = displayName().trim()
    if (!name) return
    setError(null)
    void createMutation.mutate({ displayName: name, slug: slug().trim() })
  }

  return (
    <div class="space-y-4">
      <ActAsBanner node={props.node} memberId={props.memberId} at={at()} />

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <SegmentedControl
            aria-label="Child status"
            value={status()}
            onValueChange={(next) => {
              if (next === "active" || next === "deleted" || next === "purged") setStatus(next)
            }}
          >
            <For each={statuses()}>
              {([val, label]) => <SegmentedControlItem value={val}>{label}</SegmentedControlItem>}
            </For>
          </SegmentedControl>

          <ActAsPicker node={props.node} memberId={props.memberId} at={at()} />
        </div>

        <Show when={canCreate()}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setError(null)
              setDisplayName("")
              setSlug("")
              setCreateOpen(true)
            }}
          >
            <Icon name="plus" class="h-3.5 w-3.5" />
            Create {props.kind}
            {props.memberId ? " as member" : ""}
          </Button>
        </Show>
      </div>

      <Show when={!canCreate()}>
        <p class="text-xs text-muted">
          {!writable(props.node)
            ? `Nothing can be created under a purged ${props.node.kind}.`
            : `Nothing can be created under a deleted ${props.node.kind}: restore it first.`}
        </p>
      </Show>

      <Show when={listQuery.isError}>
        <ErrorAlert error={listQuery.error} />
      </Show>

      <NodeTable
        items={items()}
        loading={listQuery.isPending}
        hasMore={listQuery.hasNextPage}
        loadingMore={listQuery.isFetchingNextPage}
        onLoadMore={() => void listQuery.fetchNextPage()}
        empty={`No ${plural(props.kind).toLowerCase()}.`}
      />

      <Dialog open={createOpen()} onOpenChange={setCreateOpen}>
        <DialogBackdrop />
        <DialogContent>
          <form onSubmit={onCreate}>
            <DialogHeader>
              <DialogTitle>
                Create {props.kind}
                {props.memberId ? " as member" : ""}
              </DialogTitle>
              <DialogDescription>
                {props.memberId
                  ? "This member will receive the creator role on the new node."
                  : `Creates a new ${props.kind} under ${props.node.display_name}.`}
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <ErrorAlert error={error()} onDismiss={() => setError(null)} />
              <Field name="child_display_name">
                <FieldLabel>Display name</FieldLabel>
                <Input
                  value={displayName()}
                  onValueChange={setDisplayName}
                  maxlength={128}
                  placeholder={`New ${props.kind}'s display name`}
                  required
                  autofocus
                />
              </Field>
              <Field name="child_slug">
                <FieldLabel>Slug (optional)</FieldLabel>
                <Input
                  mono
                  value={slug()}
                  onValueChange={setSlug}
                  placeholder="auto-generated if blank"
                />
              </Field>
            </DialogBody>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <Button
                type="submit"
                variant="primary"
                disabled={createMutation.isPending || !displayName().trim()}
              >
                {createMutation.isPending ? "Creating…" : `Create ${props.kind}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MemberCell(props: {
  rootId: string
  id: string
  name: string | null
  principal: Member["principal"]
  children?: JSX.Element
}) {
  const isPerson = () => props.principal === "person"
  return (
    <div class="flex items-center gap-3">
      <Avatar text={isPerson() ? initials(props.name ?? "?") : "SA"} square={!isPerson()} />
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-1.5">
          <Link
            to="/nodes/$nodeId/members/$memberId"
            params={{ nodeId: props.rootId, memberId: props.id }}
            class="font-medium text-text no-underline hover:text-accent-text hover:underline underline-offset-2"
          >
            {props.name ?? <span class="font-normal text-muted">(no name yet)</span>}
          </Link>
          {props.children}
        </div>
        <div class="truncate font-mono text-[0.6875rem] text-muted">{props.id}</div>
      </div>
    </div>
  )
}

/** Every binding effective at this node (direct + inherited), with Add binding dialog. */
function BindingsTab(props: { node: Node; onPurged: () => void }) {
  const queryClient = useQueryClient()
  const base = () => path`/nodes/${props.node.id}/bindings`
  const canWrite = () => writable(props.node)

  const listQuery = useInfiniteQuery(() => queries.bindings(props.node.id))
  const rolesQuery = useQuery(() => queries.roles(props.node.id))
  const membersQuery = useQuery(() => ({
    ...queries.membersSample(props.node.root_id),
    enabled: canWrite(),
  }))

  const items = createMemo(() => (listQuery.isSuccess ? listQuery.data.pages.flatMap((p) => p.items) : []))
  const roles = createMemo(() => (rolesQuery.isSuccess ? rolesQuery.data.roles : []))
  const ancestorNames = createMemo(() => new Map(props.node.ancestors.map((a) => [a.id, a.display_name])))

  const memberItems = createMemo(() =>
    (membersQuery.isSuccess ? membersQuery.data : [])
      .filter((m) => m.status === "active")
      .map((m) => ({
        value: m.id,
        label: `${m.name ?? m.id}${m.principal === "service_account" ? " (service account)" : ""}`,
        keywords: [m.id, m.principal],
        member: m,
      })),
  )

  const [addOpen, setAddOpen] = createSignal(false)
  const [selectedMemberId, setSelectedMemberId] = createSignal("")
  const [selectedRole, setSelectedRole] = createSignal("")
  const [error, setError] = createSignal<unknown>(null)

  function onWriteError(err: unknown) {
    if (hasCode(err, "NODE_PURGED")) props.onPurged()
    setError(err)
  }

  const addMutation = useMutation(() => ({
    mutationFn: (vars: { memberId: string; role: string }) =>
      api("POST", base(), { member_id: vars.memberId, role: vars.role }),
    onSuccess: async () => {
      setSelectedMemberId("")
      setSelectedRole("")
      setAddOpen(false)
      setError(null)
      toast.success("Binding added")
      await queryClient.invalidateQueries({ queryKey: queryKeys.bindings(props.node.id) })
    },
    onError: onWriteError,
  }))

  const changeMutation = useMutation(() => ({
    mutationFn: (vars: { bindingId: string; role: string }) =>
      api("PATCH", base() + path`/${vars.bindingId}`, { role: vars.role }),
    onSuccess: async () => {
      setError(null)
      toast.success("Role updated")
      await queryClient.invalidateQueries({ queryKey: queryKeys.bindings(props.node.id) })
    },
    onError: onWriteError,
  }))

  const removeMutation = useMutation(() => ({
    mutationFn: (bindingId: string) => api("DELETE", base() + path`/${bindingId}`),
    onSuccess: async () => {
      setError(null)
      toast.success("Binding removed")
      await queryClient.invalidateQueries({ queryKey: queryKeys.bindings(props.node.id) })
    },
    onError: onWriteError,
  }))

  function onAddSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!selectedMemberId() || !selectedRole()) return
    setError(null)
    void addMutation.mutate({ memberId: selectedMemberId(), role: selectedRole() })
  }

  function bindingSubjectLabel(b: Binding): string {
    return b.name ?? b.member_id ?? b.group_id ?? b.id
  }

  async function onRemove(b: Binding) {
    const yes = await confirm({
      title: `Remove ${bindingSubjectLabel(b)}'s "${b.role}" binding?`,
      description: `This direct role on ${props.node.display_name} will be removed.`,
      confirmLabel: "Remove binding",
      danger: true,
    })
    if (!yes) return
    setError(null)
    void removeMutation.mutate(b.id)
  }

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-xs text-muted">
          Direct and inherited role bindings effective on this {props.node.kind}.
        </p>
        <Show when={canWrite()}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setError(null)
              setSelectedMemberId("")
              setSelectedRole("")
              setAddOpen(true)
            }}
          >
            <Icon name="plus" class="h-3.5 w-3.5" />
            Add binding
          </Button>
        </Show>
      </div>

      <Show when={listQuery.isError}>
        <ErrorAlert error={listQuery.error} />
      </Show>
      <ErrorAlert error={error()} onDismiss={() => setError(null)} />

      <Switch>
        <Match when={listQuery.isPending && items().length === 0}>
          <LoadingState />
        </Match>
        <Match when={items().length === 0 && !listQuery.isError}>
          <EmptyState title="No bindings" />
        </Match>
        <Match when={items().length > 0}>
          <div class="overflow-x-auto rounded-xl border border-rule bg-surface">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-rule text-left font-mono text-[0.71875rem] font-medium text-muted">
                  <th class="px-4 py-2.5 font-medium">subject</th>
                  <th class="px-4 py-2.5 font-medium">role</th>
                  <th class="px-4 py-2.5 font-medium">on</th>
                  <th class="px-4 py-2.5 font-medium">expires</th>
                  <th class="px-4 py-2.5 font-medium">added</th>
                  <th class="px-4 py-2.5 text-right font-medium" />
                </tr>
              </thead>
              <tbody class="divide-y divide-rule">
                <For each={items()}>
                  {(b) => (
                    <tr>
                      <td class="px-4 py-3">
                        <Switch>
                          <Match when={b.member_id !== null}>
                            <MemberCell
                              rootId={props.node.root_id}
                              id={b.member_id!}
                              name={b.name}
                              principal={b.principal === "service_account" ? "service_account" : "person"}
                            >
                              <Show when={b.guest}>
                                <Badge variant="accent">guest</Badge>
                              </Show>
                            </MemberCell>
                          </Match>
                          <Match when={b.group_id !== null}>
                            <div class="flex items-center gap-3">
                              <Avatar text="GR" square />
                              <div class="min-w-0">
                                <div class="flex flex-wrap items-center gap-1.5">
                                  <span class="font-medium text-text">{b.name ?? "Group"}</span>
                                  <Badge variant="muted">group</Badge>
                                </div>
                                <div class="truncate font-mono text-[0.6875rem] text-muted">{b.group_id}</div>
                              </div>
                            </div>
                          </Match>
                        </Switch>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <Show
                          when={!b.inherited && canWrite()}
                          fallback={<Badge>{b.role}</Badge>}
                        >
                          <RoleSelect
                            size="sm"
                            roles={roles().length ? roles() : [{ slug: b.role, permissions: [] }]}
                            value={b.role}
                            disabled={changeMutation.isPending}
                            onChange={(nextRole) => {
                              if (nextRole !== b.role) {
                                setError(null)
                                void changeMutation.mutate({ bindingId: b.id, role: nextRole })
                              }
                            }}
                          />
                        </Show>
                      </td>
                      <td class="px-4 py-3 text-xs whitespace-nowrap">
                        <Show
                          when={b.inherited}
                          fallback={<span class="text-muted">this node</span>}
                        >
                          <Link
                            to="/nodes/$nodeId/bindings"
                            params={{ nodeId: b.node_id }}
                            class="text-accent-text hover:underline underline-offset-2"
                          >
                            {ancestorNames().get(b.node_id) ?? b.node_id}
                          </Link>
                        </Show>
                      </td>
                      <td class="px-4 py-3 text-xs text-text-2 whitespace-nowrap">
                        <When at={b.expires_at} />
                      </td>
                      <td class="px-4 py-3 text-xs text-text-2 whitespace-nowrap">
                        <When at={b.created_at} />
                      </td>
                      <td class="px-4 py-3 text-right whitespace-nowrap">
                        <Show when={!b.inherited && canWrite()}>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={removeMutation.isPending}
                            onClick={() => void onRemove(b)}
                          >
                            Remove
                          </Button>
                        </Show>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Match>
      </Switch>

      <LoadMore
        show={listQuery.hasNextPage}
        loading={listQuery.isFetchingNextPage}
        onClick={() => void listQuery.fetchNextPage()}
      />

      <Dialog open={addOpen()} onOpenChange={setAddOpen}>
        <DialogBackdrop />
        <DialogContent>
          <form onSubmit={onAddSubmit}>
            <DialogHeader>
              <DialogTitle>Add binding</DialogTitle>
              <DialogDescription>
                Bind a member of this tree to a role on {props.node.display_name}.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <ErrorAlert error={error()} onDismiss={() => setError(null)} />
              <div class="grid gap-1.5">
                <span class="text-xs font-medium text-text">Member</span>
                <Combobox
                  items={memberItems()}
                  value={selectedMemberId() || null}
                  onValueChange={(v) => setSelectedMemberId(typeof v === "string" ? v : "")}
                >
                  <ComboboxInput aria-label="Member" placeholder="Search members of this tree…" />
                  <ComboboxContent>
                    <ComboboxList>
                      <For each={memberItems()}>
                        {(item) => (
                          <ComboboxItem value={item.value}>
                            <div class="min-w-0">
                              <div class="truncate text-sm font-medium text-text">{item.label}</div>
                              <div class="truncate font-mono text-[0.6875rem] text-muted">{item.member.id}</div>
                            </div>
                          </ComboboxItem>
                        )}
                      </For>
                      <ComboboxEmpty>No matching members</ComboboxEmpty>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
              <div class="grid gap-1.5">
                <span class="text-xs font-medium text-text">Role</span>
                <RoleSelect roles={roles()} value={selectedRole()} onChange={setSelectedRole} />
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <Button
                type="submit"
                variant="primary"
                disabled={addMutation.isPending || !selectedMemberId() || !selectedRole()}
              >
                {addMutation.isPending ? "Adding…" : "Add binding"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** A root's members, with Add member dialog (resolves person by IdP issuer + subject). */
function MembersTab(props: { node: Node; onPurged: () => void }) {
  const queryClient = useQueryClient()
  const base = () => path`/nodes/${props.node.id}/members`
  const canWrite = () => writable(props.node)

  const listQuery = useInfiniteQuery(() => queries.members(props.node.id))
  const rolesQuery = useQuery(() => queries.roles(props.node.id))

  const items = createMemo(() => (listQuery.isSuccess ? listQuery.data.pages.flatMap((p) => p.items) : []))
  const roles = createMemo(() => (rolesQuery.isSuccess ? rolesQuery.data.roles : []))

  const [addOpen, setAddOpen] = createSignal(false)
  const [issuer, setIssuer] = createSignal("")
  const [subject, setSubject] = createSignal("")
  const [role, setRole] = createSignal("")
  const [error, setError] = createSignal<unknown>(null)

  const addMutation = useMutation(() => ({
    mutationFn: (vars: { issuer: string; subject: string; role: string }) =>
      api("POST", base(), { idp: { issuer: vars.issuer, subject: vars.subject }, role: vars.role }),
    onSuccess: async () => {
      setSubject("")
      setRole("")
      setAddOpen(false)
      setError(null)
      toast.success("Member added")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.members(props.node.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.membersSample(props.node.id) }),
      ])
    },
    onError: (err) => {
      if (hasCode(err, "NODE_PURGED")) props.onPurged()
      setError(err)
    },
  }))

  function onAddSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!issuer().trim() || !subject().trim() || !role()) return
    setError(null)
    void addMutation.mutate({ issuer: issuer().trim(), subject: subject().trim(), role: role() })
  }

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-xs text-muted">
          Everyone who belongs to this tree (people, guests, and service accounts).
        </p>
        <Show when={canWrite()}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setError(null)
              setAddOpen(true)
            }}
          >
            <Icon name="plus" class="h-3.5 w-3.5" />
            Add member
          </Button>
        </Show>
      </div>

      <Show when={listQuery.isError}>
        <ErrorAlert error={listQuery.error} />
      </Show>

      <Switch>
        <Match when={listQuery.isPending && items().length === 0}>
          <LoadingState />
        </Match>
        <Match when={items().length === 0 && !listQuery.isError}>
          <EmptyState title="No members" />
        </Match>
        <Match when={items().length > 0}>
          <div class="overflow-x-auto rounded-xl border border-rule bg-surface">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-rule text-left font-mono text-[0.71875rem] font-medium text-muted">
                  <th class="px-4 py-2.5 font-medium">member</th>
                  <th class="px-4 py-2.5 font-medium">principal</th>
                  <th class="px-4 py-2.5 font-medium">status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-rule">
                <For each={items()}>
                  {(m) => (
                    <tr class="transition-colors hover:bg-surface-2/50">
                      <td class="px-4 py-3">
                        <MemberCell rootId={props.node.id} id={m.id} name={m.name} principal={m.principal}>
                          <Show when={m.guest}>
                            <Badge variant="accent">guest</Badge>
                          </Show>
                        </MemberCell>
                      </td>
                      <td class="px-4 py-3 text-xs text-text-2 whitespace-nowrap">
                        {m.principal === "person" ? "person" : "service account"}
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <Status value={m.status} />
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Match>
      </Switch>

      <LoadMore
        show={listQuery.hasNextPage}
        loading={listQuery.isFetchingNextPage}
        onClick={() => void listQuery.fetchNextPage()}
      />

      <Dialog open={addOpen()} onOpenChange={setAddOpen}>
        <DialogBackdrop />
        <DialogContent>
          <form onSubmit={onAddSubmit}>
            <DialogHeader>
              <DialogTitle>Add member</DialogTitle>
              <DialogDescription>
                Resolves the person by IdP link (creating their record if new) and binds a role at this root.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <ErrorAlert error={error()} onDismiss={() => setError(null)} />
              <Field name="add_member_issuer">
                <FieldLabel>IdP issuer</FieldLabel>
                <Input
                  mono
                  value={issuer()}
                  onValueChange={setIssuer}
                  placeholder="https://…"
                  required
                  autofocus
                />
              </Field>
              <Field name="add_member_subject">
                <FieldLabel>IdP subject</FieldLabel>
                <Input
                  mono
                  value={subject()}
                  onValueChange={setSubject}
                  placeholder="sub claim"
                  required
                />
              </Field>
              <div class="grid gap-1.5">
                <span class="text-xs font-medium text-text">Role</span>
                <RoleSelect roles={roles()} value={role()} onChange={setRole} />
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <Button
                type="submit"
                variant="primary"
                disabled={addMutation.isPending || !issuer().trim() || !subject().trim() || !role()}
              >
                {addMutation.isPending ? "Adding…" : "Add member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Service accounts belonging to this node. */
function ServiceAccountsTab(props: { node: Node }) {
  const listQuery = useInfiniteQuery(() => queries.serviceAccounts(props.node.id))
  const items = createMemo(() => (listQuery.isSuccess ? listQuery.data.pages.flatMap((p) => p.items) : []))

  return (
    <div class="space-y-4">
      <p class="text-xs text-muted">
        Customers create service accounts and their keys; operators can inspect, rename, delete, or revoke keys.
      </p>

      <Show when={listQuery.isError}>
        <ErrorAlert error={listQuery.error} />
      </Show>

      <Switch>
        <Match when={listQuery.isPending && items().length === 0}>
          <LoadingState />
        </Match>
        <Match when={items().length === 0 && !listQuery.isError}>
          <EmptyState title="No service accounts belong here" />
        </Match>
        <Match when={items().length > 0}>
          <div class="overflow-x-auto rounded-xl border border-rule bg-surface">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-rule text-left font-mono text-[0.71875rem] font-medium text-muted">
                  <th class="px-4 py-2.5 font-medium">name</th>
                  <th class="px-4 py-2.5 font-medium">id</th>
                  <th class="px-4 py-2.5 font-medium">created</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-rule">
                <For each={items()}>
                  {(sa) => (
                    <tr class="transition-colors hover:bg-surface-2/50">
                      <td class="px-4 py-3">
                        <Link
                          to="/nodes/$nodeId/service-accounts/$serviceAccountId"
                          params={{ nodeId: props.node.id, serviceAccountId: sa.id }}
                          class="font-medium text-text no-underline hover:text-accent-text hover:underline underline-offset-2"
                        >
                          {sa.name}
                        </Link>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <Id value={sa.id} />
                      </td>
                      <td class="px-4 py-3 text-xs text-text-2 whitespace-nowrap">
                        <When at={sa.created_at} />
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Match>
      </Switch>

      <LoadMore
        show={listQuery.hasNextPage}
        loading={listQuery.isFetchingNextPage}
        onClick={() => void listQuery.fetchNextPage()}
      />
    </div>
  )
}

/** Invites on this node: list + revoke only (invite tokens are customer secrets). */
function InvitesTab(props: { node: Node; onPurged: () => void }) {
  const queryClient = useQueryClient()
  const base = () => path`/nodes/${props.node.id}/invites`
  const canWrite = () => writable(props.node)
  const [error, setError] = createSignal<unknown>(null)

  const listQuery = useInfiniteQuery(() => queries.invites(props.node.id))
  const items = createMemo(() => (listQuery.isSuccess ? listQuery.data.pages.flatMap((p) => p.items) : []))

  const revokeMutation = useMutation(() => ({
    mutationFn: (inviteId: string) => api("DELETE", base() + path`/${inviteId}`),
    onSuccess: async () => {
      setError(null)
      toast.success("Invite revoked")
      await queryClient.invalidateQueries({ queryKey: queryKeys.invites(props.node.id) })
    },
    onError: (err) => {
      if (hasCode(err, "NODE_PURGED")) props.onPurged()
      setError(err)
    },
  }))

  async function onRevoke(inv: Invite) {
    const yes = await confirm({
      title: `Revoke invite ${inv.token_prefix}…?`,
      description: "Anyone holding this invite link will no longer be able to redeem it.",
      confirmLabel: "Revoke invite",
      danger: true,
    })
    if (!yes) return
    setError(null)
    void revokeMutation.mutate(inv.id)
  }

  return (
    <div class="space-y-4">
      <p class="text-xs text-muted">
        Invites are listed and revoked only; invite tokens are one-time secrets operators never create.
      </p>

      <Show when={listQuery.isError}>
        <ErrorAlert error={listQuery.error} />
      </Show>
      <ErrorAlert error={error()} onDismiss={() => setError(null)} />

      <Switch>
        <Match when={listQuery.isPending && items().length === 0}>
          <LoadingState />
        </Match>
        <Match when={items().length === 0 && !listQuery.isError}>
          <EmptyState title="No invites" />
        </Match>
        <Match when={items().length > 0}>
          <div class="overflow-x-auto rounded-xl border border-rule bg-surface">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-rule text-left font-mono text-[0.71875rem] font-medium text-muted">
                  <th class="px-4 py-2.5 font-medium">prefix</th>
                  <th class="px-4 py-2.5 font-medium">role</th>
                  <th class="px-4 py-2.5 font-medium">status</th>
                  <th class="px-4 py-2.5 font-medium">uses</th>
                  <th class="px-4 py-2.5 font-medium">expires</th>
                  <th class="px-4 py-2.5 text-right font-medium" />
                </tr>
              </thead>
              <tbody class="divide-y divide-rule">
                <For each={items()}>
                  {(inv) => (
                    <tr>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <code class="text-xs text-text">{inv.token_prefix}…</code>
                      </td>
                      <td class="px-4 py-3 text-xs">
                        <span class="font-medium text-text">{inv.role}</span>
                        <Show when={inv.grants.length > 0}>
                          <div class="mt-0.5 text-muted">
                            {inv.grants.length} grant{inv.grants.length === 1 ? "" : "s"} below
                          </div>
                        </Show>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <Status value={inv.status} />
                      </td>
                      <td class="px-4 py-3 font-mono text-xs text-text-2 whitespace-nowrap">
                        {inv.use_count} / {inv.max_uses ?? "∞"}
                      </td>
                      <td class="px-4 py-3 text-xs text-text-2 whitespace-nowrap">
                        <When at={inv.expires_at} />
                      </td>
                      <td class="px-4 py-3 text-right whitespace-nowrap">
                        <Show when={inv.status === "active" && canWrite()}>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={revokeMutation.isPending}
                            onClick={() => void onRevoke(inv)}
                          >
                            Revoke
                          </Button>
                        </Show>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Match>
      </Switch>

      <LoadMore
        show={listQuery.hasNextPage}
        loading={listQuery.isFetchingNextPage}
        onClick={() => void listQuery.fetchNextPage()}
      />
    </div>
  )
}

/** The roles bindable at this node's kind, with resolved permissions. */
function RolesTab(props: { node: Node }) {
  const rolesQuery = useQuery(() => queries.roles(props.node.id))

  return (
    <Switch>
      <Match when={rolesQuery.isPending}>
        <LoadingState />
      </Match>
      <Match when={rolesQuery.isError}>
        <ErrorAlert error={rolesQuery.error} />
      </Match>
      <Match when={rolesQuery.isSuccess}>
        <div class="overflow-x-auto rounded-xl border border-rule bg-surface">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="border-b border-rule text-left font-mono text-[0.71875rem] font-medium text-muted">
                <th class="px-4 py-2.5 font-medium">role</th>
                <th class="px-4 py-2.5 font-medium">permissions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-rule">
              <For each={rolesQuery.data!.roles}>
                {(r) => (
                  <tr>
                    <td class="px-4 py-3 align-top whitespace-nowrap">
                      <div class="flex items-center gap-2">
                        <Show
                          when={r.display_name && r.display_name !== r.slug}
                          fallback={<code class="text-xs font-medium text-text">{r.slug}</code>}
                        >
                          <span class="font-medium text-text">{r.display_name}</span>
                        </Show>
                        <Show when={r.source === "custom"}>
                          <Badge variant="muted">custom</Badge>
                        </Show>
                        <Show when={r.slug === rolesQuery.data!.creator_role}>
                          <Badge variant="accent">creator role</Badge>
                        </Show>
                      </div>
                      <Show when={r.display_name && r.display_name !== r.slug}>
                        <div class="mt-0.5 font-mono text-[0.6875rem] text-muted">{r.slug}</div>
                      </Show>
                      <Show when={r.description}>
                        <div class="mt-0.5 max-w-xs text-xs text-muted whitespace-normal">{r.description}</div>
                      </Show>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex flex-wrap gap-1.5">
                        <For each={r.permissions}>{(p) => <Chip>{p}</Chip>}</For>
                      </div>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Match>
    </Switch>
  )
}
