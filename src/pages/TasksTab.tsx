import { useInfiniteQuery } from "@tanstack/solid-query"
import { Link } from "@tanstack/solid-router"
import { createMemo, For, Match, Show, Switch } from "solid-js"
import { ApiError, path } from "../api/client"
import type { Node } from "../api/identity"
import { queries } from "../api/queries"
import type { TaskStatus } from "../api/tasks"
import { useMemberNames } from "../api/useMemberNames"
import { ActAsBanner, ActAsPicker } from "../components/ActAs"
import { ErrorAlert } from "../components/ErrorAlert"
import { Badge, EmptyState, Id, LoadingState, LoadMore, When } from "../components/ui/Badge"

const taskStatusLabel: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
}

/** The project's tasks from the starter API (`GET /projects/{project_id}/tasks`).
 *  A 404 means the operator gateway hasn't routed the API's paths yet. */
export function TasksTab(props: { node: Node; memberId?: string }) {
  const at = () => path`/projects/${props.node.id}/tasks`
  const listQuery = useInfiniteQuery(() => queries.tasks(props.node.id, props.memberId))
  const items = createMemo(() => (listQuery.isSuccess ? listQuery.data.pages.flatMap((p) => p.items) : []))

  const names = useMemberNames(() =>
    items().map((t) => ({ rootId: props.node.root_id, memberId: t.created_by })),
  )

  const isNotRouted = () => listQuery.error instanceof ApiError && listQuery.error.status === 404

  return (
    <div class="space-y-4">
      <ActAsBanner node={props.node} memberId={props.memberId} at={at()} />

      <Show when={!props.memberId}>
        <div class="flex flex-wrap items-center justify-end gap-3">
          <ActAsPicker node={props.node} memberId={props.memberId} at={at()} />
        </div>
      </Show>

      <Show when={listQuery.isError}>
        <Show
          when={isNotRouted()}
          fallback={<ErrorAlert error={listQuery.error} />}
        >
          <EmptyState
            title="Tasks route not configured"
            description={
              <>
                The operator gateway has no route for <code class="text-text">{at()}</code>. Add the API&apos;s{" "}
                <code class="text-text">routes.operator.yml</code> to the project&apos;s{" "}
                <code class="text-text">operator.routes.yml</code>.
              </>
            }
          />
        </Show>
      </Show>

      <Switch>
        <Match when={listQuery.isPending && items().length === 0}>
          <LoadingState />
        </Match>
        <Match when={items().length === 0 && !listQuery.isError}>
          <EmptyState title="No tasks" />
        </Match>
        <Match when={items().length > 0}>
          <div class="overflow-x-auto rounded-xl border border-rule bg-surface">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-rule text-left font-mono text-[0.71875rem] font-medium text-muted">
                  <th class="px-4 py-2.5 font-medium">title</th>
                  <th class="px-4 py-2.5 font-medium">status</th>
                  <th class="px-4 py-2.5 font-medium">created by</th>
                  <th class="px-4 py-2.5 font-medium">id</th>
                  <th class="px-4 py-2.5 font-medium">updated</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-rule">
                <For each={items()}>
                  {(t) => (
                    <tr>
                      <td class="px-4 py-3 font-medium text-text">{t.title}</td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <Badge variant={t.status === "done" ? "muted" : t.status === "in_progress" ? "accent" : "default"}>
                          {taskStatusLabel[t.status]}
                        </Badge>
                      </td>
                      <td class="px-4 py-3 text-xs whitespace-nowrap">
                        <Link
                          to="/nodes/$nodeId/members/$memberId"
                          params={{ nodeId: props.node.root_id, memberId: t.created_by }}
                          class="text-accent-text hover:underline underline-offset-2"
                        >
                          {names().get(t.created_by)?.name ?? <code>{t.created_by}</code>}
                        </Link>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <Id value={t.id} />
                      </td>
                      <td class="px-4 py-3 text-xs text-text-2 whitespace-nowrap">
                        <When at={t.updated_at} />
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
