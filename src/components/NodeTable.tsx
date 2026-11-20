import { Link } from "@tanstack/solid-router"
import { For, Match, Switch } from "solid-js"
import type { Node } from "../api/identity"
import { initials } from "./initials"
import { Avatar, EmptyState, Id, LoadingState, LoadMore, Slug, Status, When } from "./ui/Badge"

/** A table of nodes, each linking to its `/nodes/$nodeId` page. */
export function NodeTable(props: {
  items: Node[]
  loading: boolean
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  empty: string
  emptyDescription?: string
}) {
  return (
    <div class="space-y-4">
      <Switch>
        <Match when={props.loading && props.items.length === 0}>
          <LoadingState />
        </Match>
        <Match when={props.items.length === 0}>
          <EmptyState title={props.empty} description={props.emptyDescription} />
        </Match>
        <Match when={props.items.length > 0}>
          <div class="overflow-x-auto rounded-xl border border-rule bg-surface">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-rule text-left font-mono text-[0.71875rem] font-medium text-muted">
                  <th class="px-4 py-2.5 font-medium">name</th>
                  <th class="px-4 py-2.5 font-medium">slug</th>
                  <th class="px-4 py-2.5 font-medium">status</th>
                  <th class="px-4 py-2.5 font-medium">id</th>
                  <th class="px-4 py-2.5 font-medium">created</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-rule">
                <For each={props.items}>
                  {(c) => (
                    <tr class="transition-colors hover:bg-surface-2/50">
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                          <Avatar text={initials(c.display_name)} square />
                          <Link
                            to="/nodes/$nodeId"
                            params={{ nodeId: c.id }}
                            class="font-medium text-text no-underline hover:text-accent-text hover:underline underline-offset-2"
                          >
                            {c.display_name}
                          </Link>
                        </div>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <Slug value={c.slug} />
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <Status value={c.status} />
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <Id value={c.id} />
                      </td>
                      <td class="px-4 py-3 text-xs text-text-2 whitespace-nowrap">
                        <When at={c.created_at} />
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Match>
      </Switch>

      <LoadMore show={props.hasMore} loading={props.loadingMore} onClick={props.onLoadMore} />
    </div>
  )
}
