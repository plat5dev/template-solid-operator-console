import { useInfiniteQuery } from "@tanstack/solid-query"
import { Link } from "@tanstack/solid-router"
import { createMemo, createSignal, For, Match, Show, Switch } from "solid-js"
import type { AuditEvent } from "../api/audit"
import { queries } from "../api/queries"
import { useMemberNames } from "../api/useMemberNames"
import { METHODS, NodeIds, OUTCOMES, outcomeVariant, toRfc3339 } from "./auditValues"
import { ErrorAlert } from "./ErrorAlert"
import { Icon } from "./icons"
import {
  Badge,
  CopyButton,
  DetailList,
  DetailRow,
  EmptyState,
  Id,
  LoadingState,
  LoadMore,
  When,
} from "./ui/Badge"
import { Button } from "./ui/Button"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "./ui/Collapsible"
import {
  createDrawerController,
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "./ui/Drawer"
import { Field, FieldLabel, Input } from "./ui/Field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select"

type Filters = {
  service: string
  method: string
  outcome: string
  actor: string
  requestId: string
  createdId: string
  after: string
  before: string
}

const emptyFilters: Filters = {
  service: "",
  method: "",
  outcome: "",
  actor: "",
  requestId: "",
  createdId: "",
  after: "",
  before: "",
}

const methodItems = [
  { value: "", label: "Any method" },
  ...METHODS.map((m) => ({ value: m, label: m })),
]

const outcomeItems = [
  { value: "", label: "Any outcome" },
  ...OUTCOMES.map((o) => ({ value: o, label: o })),
]

function queryOf(f: Filters): string {
  const q = new URLSearchParams()
  const put = (key: string, value: string) => {
    const v = value.trim()
    if (v) q.set(key, v)
  }
  put("service", f.service)
  put("method", f.method)
  put("outcome", f.outcome)
  put("actor_member_id", f.actor)
  put("request_id", f.requestId)
  put("created_id", f.createdId)
  const after = toRfc3339(f.after)
  const before = toRfc3339(f.before)
  if (after) q.set("occurred_after", after)
  if (before) q.set("occurred_before", before)
  const s = q.toString()
  return s ? `?${s}` : ""
}

function timesOk(f: Filters): boolean {
  return (!f.after.trim() || toRfc3339(f.after) !== "") && (!f.before.trim() || toRfc3339(f.before) !== "")
}

/**
 * Plat5 audit log for a node (`base = /nodes/{id}`, with `rootId`) or a person (`base = /users/{id}`).
 * Primary filters stay compact; advanced filters fold behind a Collapsible, and row inspection
 * opens a slide-over Drawer on the right.
 */
export function AuditLog(props: { base: string; rootId?: string }) {
  const person = () => props.rootId === undefined
  const [draft, setDraft] = createSignal<Filters>(emptyFilters)
  const [applied, setApplied] = createSignal<Filters>(emptyFilters)
  const [moreOpen, setMoreOpen] = createSignal(false)
  const [filterError, setFilterError] = createSignal<string | null>(null)
  const detailDrawer = createDrawerController<AuditEvent>()

  const queryStr = createMemo(() => queryOf(applied()))
  const listQuery = useInfiniteQuery(() => queries.auditEvents(props.base, queryStr()))
  const items = createMemo(() => (listQuery.isSuccess ? listQuery.data.pages.flatMap((p) => p.items) : []))

  const names = useMemberNames(() => {
    const rid = props.rootId
    if (!rid) return []
    return items().flatMap((e) => (e.actor.member_id ? [{ rootId: rid, memberId: e.actor.member_id }] : []))
  })

  const advancedCount = createMemo(() => {
    const f = applied()
    return [f.actor, f.requestId, f.createdId, f.after, f.before].filter((v) => v.trim() !== "").length
  })

  const activeCount = createMemo(() => Object.values(applied()).filter((v) => v.trim() !== "").length)

  function patch(partial: Partial<Filters>) {
    setDraft((prev) => ({ ...prev, ...partial }))
  }

  function onApply(e: SubmitEvent) {
    e.preventDefault()
    const d = draft()
    if (!timesOk(d)) {
      setFilterError("From and before must be valid times.")
      return
    }
    setFilterError(null)
    setApplied(d)
  }

  function onClear() {
    setDraft(emptyFilters)
    setApplied(emptyFilters)
    setFilterError(null)
  }

  return (
    <div class="space-y-4">
      <p class="text-xs text-muted">
        {person()
          ? "Account activity through user routes. Activity inside a tree is in that tree's audit log. "
          : "Every customer request on this node and below it. "}
        Newest first. Operator calls through this console live in the{" "}
        <Link to="/operator-audit-events" class="font-medium text-accent-text hover:underline underline-offset-2">
          operator log
        </Link>
        .
      </p>

      {/* Compact filter bar + collapsible advanced filters */}
      <form
        onSubmit={onApply}
        class="space-y-3 rounded-xl border border-rule bg-surface p-3.5"
      >
        <Show when={filterError()}>
          <ErrorAlert error={new Error(filterError()!)} onDismiss={() => setFilterError(null)} />
        </Show>

        <div class="flex flex-wrap items-end gap-2.5">
          <div class="min-w-36 flex-1">
            <Field name="audit_service">
              <FieldLabel>Service</FieldLabel>
              <Input
                size="sm"
                mono
                value={draft().service}
                onValueChange={(v) => patch({ service: v })}
                placeholder="identity, api…"
              />
            </Field>
          </div>

          <div class="w-34">
            <div class="grid gap-1.5">
              <span class="text-xs font-medium text-text">Method</span>
              <Select
                items={methodItems}
                value={draft().method}
                onValueChange={(v) => patch({ method: v ?? "" })}
              >
                <SelectTrigger size="sm" aria-label="Method" class="w-full">
                  <SelectValue placeholder="Any method" />
                </SelectTrigger>
                <SelectContent>
                  <For each={methodItems}>
                    {(item) => <SelectItem value={item.value}>{item.label}</SelectItem>}
                  </For>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="w-36">
            <div class="grid gap-1.5">
              <span class="text-xs font-medium text-text">Outcome</span>
              <Select
                items={outcomeItems}
                value={draft().outcome}
                onValueChange={(v) => patch({ outcome: v ?? "" })}
              >
                <SelectTrigger size="sm" aria-label="Outcome" class="w-full">
                  <SelectValue placeholder="Any outcome" />
                </SelectTrigger>
                <SelectContent>
                  <For each={outcomeItems}>
                    {(item) => <SelectItem value={item.value}>{item.label}</SelectItem>}
                  </For>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <Button type="submit" variant="primary" size="sm">
              Filter
            </Button>
            <Show when={activeCount() > 0}>
              <Button type="button" variant="ghost" size="sm" onClick={onClear}>
                Clear
              </Button>
            </Show>
          </div>
        </div>

        <Collapsible open={moreOpen()} onOpenChange={setMoreOpen}>
          <CollapsibleTrigger class="pt-0.5">
            {(state) => (
              <>
                <Icon name="filter" class="h-3.5 w-3.5 text-muted" />
                <span>{state.open ? "Hide filters" : "More filters"}</span>
                <Show when={advancedCount() > 0}>
                  <Badge variant="accent">{advancedCount()}</Badge>
                </Show>
              </>
            )}
          </CollapsibleTrigger>
          <CollapsiblePanel>
            <div class="mt-3 grid grid-cols-1 gap-2.5 border-t border-rule pt-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field name="audit_actor">
                <FieldLabel>Actor member ID</FieldLabel>
                <Input
                  size="sm"
                  mono
                  value={draft().actor}
                  onValueChange={(v) => patch({ actor: v })}
                  placeholder="member_id"
                />
              </Field>
              <Field name="audit_request_id">
                <FieldLabel>Request ID</FieldLabel>
                <Input
                  size="sm"
                  mono
                  value={draft().requestId}
                  onValueChange={(v) => patch({ requestId: v })}
                />
              </Field>
              <Field name="audit_created_id">
                <FieldLabel>Created ID</FieldLabel>
                <Input
                  size="sm"
                  mono
                  value={draft().createdId}
                  onValueChange={(v) => patch({ createdId: v })}
                />
              </Field>
              <Field name="audit_after">
                <FieldLabel>From</FieldLabel>
                <Input
                  size="sm"
                  type="datetime-local"
                  value={draft().after}
                  onValueChange={(v) => patch({ after: v })}
                />
              </Field>
              <Field name="audit_before">
                <FieldLabel>Before</FieldLabel>
                <Input
                  size="sm"
                  type="datetime-local"
                  value={draft().before}
                  onValueChange={(v) => patch({ before: v })}
                />
              </Field>
            </div>
          </CollapsiblePanel>
        </Collapsible>
      </form>

      <Show when={listQuery.isError}>
        <ErrorAlert error={listQuery.error} />
      </Show>

      <Switch>
        <Match when={listQuery.isPending && items().length === 0}>
          <LoadingState />
        </Match>
        <Match when={items().length === 0 && !listQuery.isError}>
          <EmptyState
            title={activeCount() > 0 ? "No audit events match these filters" : "No audit events yet"}
          />
        </Match>
        <Match when={items().length > 0}>
          <div class="overflow-x-auto rounded-xl border border-rule bg-surface">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-rule text-left font-mono text-[0.71875rem] font-medium text-muted">
                  <th class="px-4 py-2.5 font-medium">when</th>
                  <th class="px-4 py-2.5 font-medium">actor</th>
                  <th class="px-4 py-2.5 font-medium">request</th>
                  <th class="px-4 py-2.5 font-medium">service</th>
                  <th class="px-4 py-2.5 font-medium">outcome</th>
                  <th class="px-4 py-2.5 text-right font-medium" />
                </tr>
              </thead>
              <tbody class="divide-y divide-rule">
                <For each={items()}>
                  {(event) => {
                    const actorName = () =>
                      event.actor.member_id ? names().get(event.actor.member_id)?.name : null
                    return (
                      <tr class="transition-colors hover:bg-surface-2/50">
                        <td class="px-4 py-3 text-xs text-text-2 whitespace-nowrap">
                          <When at={event.occurred_at} />
                        </td>
                        <td class="px-4 py-3 text-xs">
                          <Show
                            when={event.actor.member_id && props.rootId}
                            fallback={
                              <span class="font-medium text-text">
                                {event.actor.principal === "anonymous" ? "anonymous" : "the person"}
                              </span>
                            }
                          >
                            <Link
                              to="/nodes/$nodeId/members/$memberId"
                              params={{ nodeId: props.rootId!, memberId: event.actor.member_id! }}
                              class="font-medium text-text hover:text-accent-text hover:underline underline-offset-2"
                              title={event.actor.member_id!}
                            >
                              {actorName() ?? <code class="text-xs">{event.actor.member_id}</code>}
                            </Link>
                          </Show>
                          <div class="mt-0.5 text-[0.71875rem] text-muted">
                            {event.actor.principal === "service_account"
                              ? "service account"
                              : event.actor.principal}{" "}
                            · {event.actor.auth_type}
                          </div>
                        </td>
                        <td class="px-4 py-3 text-xs">
                          <div class="flex flex-wrap items-center gap-1.5">
                            <code class="rounded bg-surface-2 px-1.5 py-0.5 font-medium text-text">
                              {event.method}
                            </code>
                            <code class="text-text-2 break-all">{event.route}</code>
                          </div>
                          <div class="mt-0.5 font-mono text-[0.6875rem] text-muted">{event.request_id}</div>
                        </td>
                        <td class="px-4 py-3 font-mono text-xs text-text-2 whitespace-nowrap">{event.service}</td>
                        <td class="px-4 py-3 whitespace-nowrap">
                          <Badge variant={outcomeVariant(event.outcome, event.status)}>
                            {event.outcome}
                            {event.status !== null ? ` ${event.status}` : ""}
                          </Badge>
                        </td>
                        <td class="px-4 py-3 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void detailDrawer.open({ payload: event })}
                          >
                            Inspect
                          </Button>
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
        label="Load older events"
      />

      {/* Slide-over detail drawer */}
      <Drawer side="right" controller={detailDrawer}>
        <DrawerBackdrop />
        <DrawerContent<AuditEvent> class="w-[min(34rem,94vw)]">
          {(state) => (
            <Show when={state.payload}>
              {(ev) => {
                const sortedParams = () =>
                  Object.entries(ev().params).sort(([a], [b]) => a.localeCompare(b))
                return (
                  <>
                    <div class="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
                      <div class="min-w-0 space-y-1">
                        <div class="flex flex-wrap items-center gap-2">
                          <Badge variant={outcomeVariant(ev().outcome, ev().status)}>
                            {ev().outcome}
                            {ev().status !== null ? ` ${ev().status}` : ""}
                          </Badge>
                          <span class="font-mono text-xs text-muted">{ev().service}</span>
                        </div>
                        <DrawerTitle class="font-mono text-sm font-semibold text-text break-all">
                          {ev().method} {ev().route}
                        </DrawerTitle>
                        <DrawerDescription class="text-xs text-muted">
                          <When at={ev().occurred_at} />
                        </DrawerDescription>
                      </div>
                      <DrawerClose
                        aria-label="Close"
                        class="inline-grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-text cursor-pointer"
                      >
                        ×
                      </DrawerClose>
                    </div>

                    <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
                      <DetailList>
                        <DetailRow label="Event ID">
                          <Id value={ev().id} copy />
                        </DetailRow>
                        <DetailRow label="Request ID">
                          <Id value={ev().request_id} copy />
                        </DetailRow>
                        <DetailRow label="Actor">
                          <div class="space-y-0.5 text-xs">
                            <Show
                              when={ev().actor.member_id && props.rootId}
                              fallback={
                                <span>{ev().actor.principal === "anonymous" ? "anonymous" : "the person"}</span>
                              }
                            >
                              <Link
                                to="/nodes/$nodeId/members/$memberId"
                                params={{ nodeId: props.rootId!, memberId: ev().actor.member_id! }}
                                class="font-mono text-accent-text hover:underline underline-offset-2"
                              >
                                {names().get(ev().actor.member_id!)?.name ?? ev().actor.member_id}
                              </Link>
                            </Show>
                            <div class="text-muted">
                              {ev().actor.principal} · {ev().actor.auth_type}
                              {ev().actor.key_id ? ` · key ${ev().actor.key_id}` : ""}
                            </div>
                          </div>
                        </DetailRow>
                        <Show when={ev().nodes.length > 0}>
                          <DetailRow label="Nodes">
                            <NodeIds nodes={ev().nodes} />
                          </DetailRow>
                        </Show>
                        <Show when={ev().named_node_ids.length > 0}>
                          <DetailRow label="Named nodes">
                            <NodeIds nodes={ev().named_node_ids.map((id) => ({ id }))} />
                          </DetailRow>
                        </Show>
                        <Show when={ev().created_id}>
                          <DetailRow label="Created ID">
                            <Id value={ev().created_id} copy />
                          </DetailRow>
                        </Show>
                        <DetailRow label="IP">
                          <Id value={ev().ip} />
                        </DetailRow>
                        <DetailRow label="User agent">
                          <span class="text-xs text-text-2 break-all">{ev().user_agent ?? "—"}</span>
                        </DetailRow>
                        <DetailRow label="Params">
                          <Show when={sortedParams().length > 0} fallback={<span class="text-muted">—</span>}>
                            <div class="space-y-1 text-xs">
                              <For each={sortedParams()}>
                                {([k, v]) => (
                                  <div>
                                    <code class="rounded bg-surface-2 px-1 py-0.5 text-text">{k}</code>{" "}
                                    <span class="font-mono text-text-2 break-all">{v}</span>
                                  </div>
                                )}
                              </For>
                            </div>
                          </Show>
                        </DetailRow>
                      </DetailList>

                      <div class="space-y-2 border-t border-rule pt-4">
                        <div class="flex items-center justify-between">
                          <span class="text-xs font-medium text-muted">Details payload</span>
                          <Show when={ev().details != null}>
                            <CopyButton value={JSON.stringify(ev().details, null, 2)} label="JSON details" />
                          </Show>
                        </div>
                        <Show
                          when={ev().details != null}
                          fallback={<p class="text-xs text-muted">No details recorded.</p>}
                        >
                          <pre class="overflow-x-auto rounded-lg bg-code-bg p-3.5 text-xs text-code-text whitespace-pre-wrap break-words">
                            {JSON.stringify(ev().details, null, 2)}
                          </pre>
                        </Show>
                      </div>
                    </div>
                  </>
                )
              }}
            </Show>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}
