import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/solid-query"
import { Link, useNavigate, useParams } from "@tanstack/solid-router"
import { createMemo, createSignal, For, Match, Show, Switch } from "solid-js"
import { api, path } from "../api/client"
import type { User } from "../api/identity"
import { queries, queryKeys } from "../api/queries"
import { AuditLog } from "../components/AuditLog"
import { ErrorAlert } from "../components/ErrorAlert"
import { Icon } from "../components/icons"
import { KeysTable } from "../components/KeysTable"
import {
  EmptyState,
  Id,
  LoadingState,
  LoadMore,
  PageHead,
  Status,
  When,
} from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import {
  Dialog,
  DialogBackdrop,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/Dialog"
import { Field, FieldLabel, Input } from "../components/ui/Field"
import { confirm, toast } from "../components/ui/overlays"
import { SegmentedControl, SegmentedControlItem } from "../components/ui/SegmentedControl"
import { Tabs, TabsList, TabsTab } from "../components/ui/Tabs"

export type UserTab = "nodes" | "keys" | "audit-events"

/** A person, by user id: edit/clear name, suspend/reactivate, delete account, plus Nodes, Personal keys, and Audit log tabs. */
export function UserPage(props: { tab?: UserTab }) {
  const params = useParams({ strict: false }) as () => { userId?: string }
  const userId = () => params().userId ?? ""
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const activeTab = (): UserTab => props.tab ?? "nodes"
  const routeBase = () => path`/users/${userId()}`
  const apiBase = () => path`/services/identity/users/${userId()}`
  const userQuery = useQuery(() => queries.user(userId()))

  const [nameOpen, setNameOpen] = createSignal(false)
  const [draftName, setDraftName] = createSignal("")
  const [error, setError] = createSignal<unknown>(null)

  const saveNameMutation = useMutation(() => ({
    mutationFn: (name: string | null) => api<User>("PATCH", apiBase(), { name }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.user(userId()), updated)
      setNameOpen(false)
      setError(null)
      toast.success(updated.name ? "Name updated" : "Name cleared")
    },
    onError: (err) => setError(err),
  }))

  const statusMutation = useMutation(() => ({
    mutationFn: (status: User["status"]) => api<User>("PATCH", apiBase() + "/status", { status }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.user(userId()), updated)
      setError(null)
      toast.success(updated.status === "suspended" ? "Account suspended" : "Account reactivated")
    },
    onError: (err) => setError(err),
  }))

  const deleteMutation = useMutation(() => ({
    mutationFn: () => api("DELETE", apiBase()),
    onSuccess: () => {
      setError(null)
      toast.success("Account deleted")
      void navigate({ to: "/users", search: {} })
    },
    onError: (err) => setError(err),
  }))

  function onSaveName(e: SubmitEvent) {
    e.preventDefault()
    const trimmed = draftName().trim()
    if (!trimmed) return
    setError(null)
    void saveNameMutation.mutate(trimmed)
  }

  async function onClearName() {
    const yes = await confirm({
      title: "Clear this person's name?",
      description: "A later sign-in may set it again from their identity token.",
      confirmLabel: "Clear name",
    })
    if (!yes) return
    setError(null)
    void saveNameMutation.mutate(null)
  }

  async function onDelete() {
    const yes = await confirm({
      title: "Delete this account?",
      description:
        "The person is removed from every tree, and their personal keys and IdP links are permanently deleted.",
      confirmLabel: "Delete account",
      danger: true,
    })
    if (!yes) return
    setError(null)
    void deleteMutation.mutate()
  }

  return (
    <>
      <PageHead
        crumbs={
          <>
            <Link
              to="/users"
              search={{}}
              class="text-muted transition-colors hover:text-text no-underline hover:underline underline-offset-2"
            >
              Users
            </Link>
            <Icon name="chevronRight" class="h-3 w-3 text-muted/70" />
            <span class="font-medium text-text-2">User</span>
          </>
        }
        eyebrow={<Id value={userId()} copy />}
        title={
          <span class="inline-flex flex-wrap items-center gap-2.5">
            <span>{userQuery.isSuccess ? (userQuery.data.name ?? "User") : "User"}</span>
            <Show when={userQuery.isSuccess}>
              <Status value={userQuery.data!.status} />
            </Show>
          </span>
        }
        actions={
          <Show when={userQuery.isSuccess}>
            {(() => {
              const u = () => userQuery.data!
              return (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      setError(null)
                      setDraftName(u().name ?? "")
                      setNameOpen(true)
                    }}
                  >
                    {u().name === null ? "Set name" : "Edit name"}
                  </Button>
                  <Show when={u().name !== null}>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={saveNameMutation.isPending}
                      onClick={() => void onClearName()}
                    >
                      Clear name
                    </Button>
                  </Show>
                  <Show when={u().status === "active"}>
                    <Button
                      size="sm"
                      disabled={statusMutation.isPending}
                      onClick={() => void statusMutation.mutate("suspended")}
                    >
                      Suspend
                    </Button>
                  </Show>
                  <Show when={u().status === "suspended"}>
                    <Button
                      size="sm"
                      disabled={statusMutation.isPending}
                      onClick={() => void statusMutation.mutate("active")}
                    >
                      Reactivate
                    </Button>
                  </Show>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={deleteMutation.isPending}
                    onClick={() => void onDelete()}
                  >
                    Delete account
                  </Button>
                </>
              )
            })()}
          </Show>
        }
      />

      <Show when={userQuery.isError}>
        <ErrorAlert error={userQuery.error} />
      </Show>
      <ErrorAlert error={error()} onDismiss={() => setError(null)} />

      <Tabs
        value={activeTab()}
        onValueChange={(next) => {
          if (next === "nodes" || next === "keys" || next === "audit-events") {
            void navigate({ to: `${routeBase()}/${next}` as never })
          }
        }}
      >
        <TabsList>
          <TabsTab value="nodes">Nodes</TabsTab>
          <TabsTab value="keys">Personal keys</TabsTab>
          <TabsTab value="audit-events">Audit log</TabsTab>
        </TabsList>
      </Tabs>

      <Switch>
        <Match when={activeTab() === "nodes"}>
          <UserNodes userId={userId()} />
        </Match>
        <Match when={activeTab() === "keys"}>
          <KeysTable base={apiBase() + "/keys"} />
        </Match>
        <Match when={activeTab() === "audit-events"}>
          <AuditLog base={routeBase()} />
        </Match>
      </Switch>

      <Dialog open={nameOpen()} onOpenChange={setNameOpen}>
        <DialogBackdrop />
        <DialogContent>
          <form onSubmit={onSaveName}>
            <DialogHeader>
              <DialogTitle>{userQuery.data?.name ? "Edit name" : "Set name"}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <ErrorAlert error={error()} onDismiss={() => setError(null)} />
              <Field name="user_name">
                <FieldLabel>Name</FieldLabel>
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
                  saveNameMutation.isPending ||
                  !draftName().trim() ||
                  draftName().trim() === userQuery.data?.name
                }
              >
                {saveNameMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function UserNodes(props: { userId: string }) {
  const [scope, setScope] = createSignal<"active" | "deleted">("active")
  const listQuery = useInfiniteQuery(() => queries.userNodes(props.userId, scope() === "deleted"))
  const items = createMemo(() => (listQuery.isSuccess ? listQuery.data.pages.flatMap((p) => p.items) : []))

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <SegmentedControl
          aria-label="Node status"
          value={scope()}
          onValueChange={(next) => {
            if (next === "active" || next === "deleted") setScope(next)
          }}
        >
          <SegmentedControlItem value="active">Live</SegmentedControlItem>
          <SegmentedControlItem value="deleted">Deleted</SegmentedControlItem>
        </SegmentedControl>
      </div>

      <Show when={listQuery.isError}>
        <ErrorAlert error={listQuery.error} />
      </Show>

      <Switch>
        <Match when={listQuery.isPending && items().length === 0}>
          <LoadingState />
        </Match>
        <Match when={items().length === 0 && !listQuery.isError}>
          <EmptyState title={scope() === "deleted" ? "No deleted nodes" : "No nodes"} />
        </Match>
        <Match when={items().length > 0}>
          <div class="overflow-x-auto rounded-xl border border-rule bg-surface">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-rule text-left font-mono text-[0.71875rem] font-medium text-muted">
                  <th class="px-4 py-2.5 font-medium">node</th>
                  <th class="px-4 py-2.5 font-medium">kind</th>
                  <th class="px-4 py-2.5 font-medium">status</th>
                  <th class="px-4 py-2.5 font-medium">created</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-rule">
                <For each={items()}>
                  {(n) => (
                    <tr class="transition-colors hover:bg-surface-2/50">
                      <td class="px-4 py-3">
                        <Link
                          to="/nodes/$nodeId"
                          params={{ nodeId: n.id }}
                          class="font-medium text-text hover:text-accent-text hover:underline underline-offset-2"
                        >
                          {n.display_name}
                        </Link>
                        <Show when={n.ancestors.length > 0}>
                          <div class="mt-0.5 text-xs text-muted">
                            in {n.ancestors.map((a) => a.display_name).join(" / ")}
                          </div>
                        </Show>
                      </td>
                      <td class="px-4 py-3 font-mono text-xs text-text-2 whitespace-nowrap">{n.kind}</td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <Status value={n.status} />
                      </td>
                      <td class="px-4 py-3 text-xs text-text-2 whitespace-nowrap">
                        <When at={n.created_at} />
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
