import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/solid-query"
import { createMemo, createSignal, For, Match, Show, Switch } from "solid-js"
import { api, hasCode, path } from "../api/client"
import type { Key } from "../api/identity"
import { queries, queryKeys } from "../api/queries"
import { ErrorAlert } from "./ErrorAlert"
import { Badge, EmptyState, LoadingState, LoadMore, Status, When } from "./ui/Badge"
import { Button } from "./ui/Button"
import { confirm, toast } from "./ui/overlays"

/**
 * A person's or service account's API keys (`base` is the keys list path).
 * Listing and revoking only: operators never create or hold customer secrets.
 * `canRevoke` is false for a service account on a purged node.
 */
export function KeysTable(props: {
  base: string
  canRevoke?: boolean
  onPurged?: () => void
}) {
  const queryClient = useQueryClient()
  const [error, setError] = createSignal<unknown>(null)

  const listQuery = useInfiniteQuery(() => queries.keys(props.base))
  const items = createMemo(() => (listQuery.isSuccess ? listQuery.data.pages.flatMap((p) => p.items) : []))
  const canRevoke = () => props.canRevoke ?? true

  const revokeMutation = useMutation(() => ({
    mutationFn: (keyId: string) => api("DELETE", props.base + path`/${keyId}`),
    onSuccess: async () => {
      setError(null)
      toast.success("API key revoked")
      await queryClient.invalidateQueries({ queryKey: queryKeys.keys(props.base) })
    },
    onError: (err) => {
      if (hasCode(err, "NODE_PURGED")) props.onPurged?.()
      setError(err)
    },
  }))

  async function onRevoke(k: Key) {
    const yes = await confirm({
      title: `Revoke key "${k.name}"?`,
      description: `Key ${k.key_prefix}… will stop working immediately.`,
      confirmLabel: "Revoke key",
      danger: true,
    })
    if (!yes) return
    setError(null)
    void revokeMutation.mutate(k.id)
  }

  return (
    <div class="space-y-4">
      <Show when={listQuery.isError}>
        <ErrorAlert error={listQuery.error} />
      </Show>
      <ErrorAlert error={error()} onDismiss={() => setError(null)} />

      <Switch>
        <Match when={listQuery.isPending && items().length === 0}>
          <LoadingState />
        </Match>
        <Match when={items().length === 0 && !listQuery.isError}>
          <EmptyState title="No API keys" description="Keys are listed and revoked here; operators never create customer keys." />
        </Match>
        <Match when={items().length > 0}>
          <div class="overflow-x-auto rounded-xl border border-rule bg-surface">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-rule text-left font-mono text-[0.71875rem] font-medium text-muted">
                  <th class="px-4 py-2.5 font-medium">name</th>
                  <th class="px-4 py-2.5 font-medium">prefix</th>
                  <th class="px-4 py-2.5 font-medium">restrictions</th>
                  <th class="px-4 py-2.5 font-medium">expires</th>
                  <th class="px-4 py-2.5 font-medium">created</th>
                  <th class="px-4 py-2.5 font-medium">status</th>
                  <th class="px-4 py-2.5 text-right font-medium" />
                </tr>
              </thead>
              <tbody class="divide-y divide-rule">
                <For each={items()}>
                  {(k) => {
                    const expired = () => Boolean(k.expires_at && Date.parse(k.expires_at) <= Date.now())
                    const scopeCount = () => k.scopes?.length ?? 0
                    const cidrCount = () => k.allowed_cidrs?.length ?? 0
                    const rootCount = () => k.allowed_roots?.length ?? 0
                    return (
                      <tr>
                        <td class="px-4 py-3 font-medium text-text">{k.name}</td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <code class="text-xs text-text-2">{k.key_prefix}…</code>
                        </td>
                        <td class="px-4 py-3 text-xs">
                          <Show
                            when={scopeCount() > 0 || cidrCount() > 0 || rootCount() > 0}
                            fallback={<span class="text-muted">unrestricted</span>}
                          >
                            <div class="flex flex-wrap gap-1">
                              <Show when={scopeCount() > 0}>
                                <Badge variant="muted" class="font-mono">
                                  {scopeCount()} scope{scopeCount() === 1 ? "" : "s"}
                                </Badge>
                              </Show>
                              <Show when={cidrCount() > 0}>
                                <Badge variant="muted" class="font-mono">
                                  {cidrCount()} CIDR{cidrCount() === 1 ? "" : "s"}
                                </Badge>
                              </Show>
                              <Show when={rootCount() > 0}>
                                <Badge variant="muted" class="font-mono">
                                  {rootCount()} root{rootCount() === 1 ? "" : "s"}
                                </Badge>
                              </Show>
                            </div>
                          </Show>
                        </td>
                        <td class="px-4 py-3 text-xs text-text-2 whitespace-nowrap">
                          <When at={k.expires_at} />
                        </td>
                        <td class="px-4 py-3 text-xs text-text-2 whitespace-nowrap">
                          <When at={k.created_at} />
                        </td>
                        <td class="px-4 py-3 text-xs text-text-2 whitespace-nowrap">
                          <Show
                            when={k.revoked_at}
                            fallback={<Status value={expired() ? "expired" : "active"} />}
                          >
                            <span class="inline-flex items-center gap-1.5 text-muted">
                              <Status value="revoked" />
                              <span>·</span>
                              <When at={k.revoked_at} />
                            </span>
                          </Show>
                        </td>
                        <td class="px-4 py-3 text-right whitespace-nowrap">
                          <Show when={!k.revoked_at && canRevoke()}>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={revokeMutation.isPending}
                              onClick={() => void onRevoke(k)}
                            >
                              Revoke
                            </Button>
                          </Show>
                        </td>
                      </tr>
                    )
                  }}
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
