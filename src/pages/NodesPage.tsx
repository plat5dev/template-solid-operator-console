import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/solid-query"
import { useLocation, useNavigate } from "@tanstack/solid-router"
import { createMemo, createSignal, For, Show } from "solid-js"
import { api } from "../api/client"
import type { Node, NodeStatus } from "../api/identity"
import { plural, rootKinds } from "../api/kinds"
import { queries, queryKeys } from "../api/queries"
import { ErrorAlert } from "../components/ErrorAlert"
import { Icon } from "../components/icons"
import { NodeTable } from "../components/NodeTable"
import { PageHead } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
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
import { Field, FieldDescription, FieldLabel, Input } from "../components/ui/Field"
import { toast } from "../components/ui/overlays"
import { SegmentedControl, SegmentedControlItem } from "../components/ui/SegmentedControl"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/Select"

const statuses: [NodeStatus | "", string][] = [
  ["active", "Live"],
  ["deleted", "Deleted"],
  ["purged", "Purged"],
  ["", "Any"],
]

/** The roots of every tree (`GET /nodes?kind=&status=`), plus root creation (`POST /roots/{kind}`). */
export function NodesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const search = createMemo(() => location().search as { kind?: string; status?: string })
  const kind = createMemo(() => {
    const k = search().kind
    return k && rootKinds.includes(k) ? k : rootKinds[0]!
  })
  const status = createMemo<NodeStatus | "">(() => {
    const s = search().status
    if (s === "active" || s === "deleted" || s === "purged" || s === "") return s
    return "active"
  })

  const listQuery = useInfiniteQuery(() => queries.roots(kind(), status()))
  const items = createMemo(() => (listQuery.isSuccess ? listQuery.data.pages.flatMap((p) => p.items) : []))

  const [createOpen, setCreateOpen] = createSignal(false)
  const [displayName, setDisplayName] = createSignal("")
  const [error, setError] = createSignal<unknown>(null)

  const createMutation = useMutation(() => ({
    mutationFn: (name: string) =>
      api<Node>("POST", `/roots/${encodeURIComponent(kind())}`, { display_name: name }),
    onSuccess: async (root) => {
      setDisplayName("")
      setError(null)
      setCreateOpen(false)
      toast.success(`Created ${kind()} "${root.display_name}"`)
      await queryClient.invalidateQueries({ queryKey: queryKeys.allRoots() })
      void navigate({ to: "/nodes/$nodeId", params: { nodeId: root.id } })
    },
    onError: (err) => setError(err),
  }))

  function setFilter(next: { kind?: string; status?: NodeStatus | "" }) {
    void navigate({
      to: "/nodes",
      search: {
        kind: next.kind ?? kind(),
        status: next.status !== undefined ? next.status : status(),
      },
    })
  }

  function onCreate(e: SubmitEvent) {
    e.preventDefault()
    const trimmed = displayName().trim()
    if (!trimmed) return
    setError(null)
    void createMutation.mutate(trimmed)
  }

  const rootKindItems = rootKinds.map((k) => ({ value: k, label: plural(k) }))

  return (
    <>
      <PageHead
        eyebrow={`/nodes?kind=${kind()}`}
        title={plural(kind())}
        lede={`Every ${kind()} in this deployment: the roots of its trees.`}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setError(null)
              setDisplayName("")
              setCreateOpen(true)
            }}
          >
            <Icon name="plus" class="h-3.5 w-3.5" />
            Create {kind()}
          </Button>
        }
      />

      {/* Unified filter toolbar */}
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <Show when={rootKinds.length > 1}>
            <div class="w-44">
              <Select
                items={rootKindItems}
                value={kind()}
                onValueChange={(next) => {
                  if (next) setFilter({ kind: next })
                }}
              >
                <SelectTrigger size="sm" aria-label="Kind" class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <For each={rootKindItems}>
                    {(item) => <SelectItem value={item.value}>{item.label}</SelectItem>}
                  </For>
                </SelectContent>
              </Select>
            </div>
          </Show>

          <SegmentedControl
            aria-label="Status filter"
            value={status()}
            onValueChange={(next) => {
              if (next === "active" || next === "deleted" || next === "purged" || next === "") {
                setFilter({ status: next })
              }
            }}
          >
            <For each={statuses}>
              {([val, label]) => <SegmentedControlItem value={val}>{label}</SegmentedControlItem>}
            </For>
          </SegmentedControl>
        </div>
      </div>

      <Show when={listQuery.isError}>
        <ErrorAlert error={listQuery.error} />
      </Show>

      <NodeTable
        items={items()}
        loading={listQuery.isPending}
        hasMore={listQuery.hasNextPage}
        loadingMore={listQuery.isFetchingNextPage}
        onLoadMore={() => void listQuery.fetchNextPage()}
        empty={`No ${plural(kind()).toLowerCase()}.`}
      />

      <Dialog open={createOpen()} onOpenChange={setCreateOpen}>
        <DialogBackdrop />
        <DialogContent>
          <form onSubmit={onCreate}>
            <DialogHeader>
              <DialogTitle>Create {kind()}</DialogTitle>
              <DialogDescription>
                Creates a new root node in this deployment.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <ErrorAlert error={error()} onDismiss={() => setError(null)} />
              <Field name="root_display_name">
                <FieldLabel>Display name</FieldLabel>
                <Input
                  value={displayName()}
                  onValueChange={setDisplayName}
                  maxlength={128}
                  placeholder={`New ${kind()}'s display name`}
                  required
                  autofocus
                />
                <FieldDescription>
                  Created by an operator, a root has no members. Add the first from its Members tab.
                </FieldDescription>
              </Field>
            </DialogBody>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <Button
                type="submit"
                variant="primary"
                disabled={createMutation.isPending || !displayName().trim()}
              >
                {createMutation.isPending ? "Creating…" : `Create ${kind()}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
