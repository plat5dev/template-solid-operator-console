import { useInfiniteQuery } from "@tanstack/solid-query"
import { Link, useLocation, useNavigate } from "@tanstack/solid-router"
import { createEffect, createMemo, createSignal, For, Match, Show, Switch } from "solid-js"
import type { OperatorAuditEvent } from "../api/audit"
import { queries } from "../api/queries"
import { useMemberNames } from "../api/useMemberNames"
import { METHODS, NodeIds, OUTCOMES, outcomeVariant, toLocal, toRfc3339 } from "../components/auditValues"
import { ErrorAlert } from "../components/ErrorAlert"
import { Icon } from "../components/icons"
import {
  Badge,
  CopyButton,
  DetailList,
  DetailRow,
  EmptyState,
  Id,
  LoadingState,
  LoadMore,
  PageHead,
  When,
} from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "../components/ui/Collapsible"
import {
  createDrawerController,
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "../components/ui/Drawer"
import { Field, FieldLabel, Input } from "../components/ui/Field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/Select"

export type OperatorLogSearch = {
  node_id?: string
  operator_id?: string
  acting_as_member_id?: string
  service?: string
  route?: string
  request_id?: string
  created_id?: string
  method?: string
  outcome?: string
  occurred_after?: string
  occurred_before?: string
}

const FILTER_LABELS: Record<keyof OperatorLogSearch, string> = {
  node_id: "Node",
  operator_id: "Operator",
  acting_as_member_id: "Acting as",
  service: "Service",
  route: "Route",
  request_id: "Request ID",
  created_id: "Created ID",
  method: "Method",
  outcome: "Outcome",
  occurred_after: "From",
  occurred_before: "Before",
}

const ADVANCED_KEYS: (keyof OperatorLogSearch)[] = [
  "operator_id",
  "acting_as_member_id",
  "route",
  "request_id",
  "created_id",
  "occurred_after",
  "occurred_before",
]

const methodItems = [
  { value: "", label: "Any method" },
  ...METHODS.map((m) => ({ value: m, label: m })),
]

const outcomeItems = [
  { value: "", label: "Any outcome" },
  ...OUTCOMES.map((o) => ({ value: o, label: o })),
]

function searchToDraft(s: OperatorLogSearch): Record<keyof OperatorLogSearch, string> {
  return {
    node_id: s.node_id ?? "",
    operator_id: s.operator_id ?? "",
    acting_as_member_id: s.acting_as_member_id ?? "",
    service: s.service ?? "",
    route: s.route ?? "",
    request_id: s.request_id ?? "",
    created_id: s.created_id ?? "",
    method: s.method ?? "",
    outcome: s.outcome ?? "",
    occurred_after: s.occurred_after ? toLocal(s.occurred_after) : "",
    occurred_before: s.occurred_before ? toLocal(s.occurred_before) : "",
  }
}

function searchToQuery(s: OperatorLogSearch): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(s)) {
    if (typeof v === "string" && v.trim()) q.set(k, v.trim())
  }
  return q.toString()
}

/** The operator log (`GET /operator-audit-events`): every authenticated call through the operator gateway. */
export function OperatorLogPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const search = createMemo(() => location().search as OperatorLogSearch)

  const [draft, setDraft] = createSignal(searchToDraft(search()))
  const [moreOpen, setMoreOpen] = createSignal(false)
  const detailDrawer = createDrawerController<OperatorAuditEvent>()

  // Sync draft when URL search changes (e.g. clicking a deep link like ?node_id= or ?request_id=).
  createEffect(
    () => search(),
    (s) => {
      setDraft(searchToDraft(s))
    },
  )

  const queryStr = createMemo(() => searchToQuery(search()))
  const listQuery = useInfiniteQuery(() => queries.operatorAudit(queryStr()))
  const items = createMemo(() => (listQuery.isSuccess ? listQuery.data.pages.flatMap((p) => p.items) : []))

  const names = useMemberNames(() =>
    items().flatMap((e) =>
      e.acting_as && e.root_id ? [{ rootId: e.root_id, memberId: e.acting_as.member_id }] : [],
    ),
  )

  const activeEntries = createMemo(() =>
    (Object.entries(search()) as [keyof OperatorLogSearch, string | undefined][]).filter(
      ([, v]) => typeof v === "string" && v.trim() !== "",
    ) as [keyof OperatorLogSearch, string][],
  )

  const advancedCount = createMemo(
    () => ADVANCED_KEYS.filter((k) => Boolean(search()[k]?.trim())).length,
  )

  function patch(key: keyof OperatorLogSearch, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function onApply(e: SubmitEvent) {
    e.preventDefault()
    const d = draft()
    const next: OperatorLogSearch = {}
    for (const [key, raw] of Object.entries(d) as [keyof OperatorLogSearch, string][]) {
      const v = key.startsWith("occurred_") ? toRfc3339(raw) : raw.trim()
      if (v) next[key] = v
    }
    void navigate({ to: "/operator-audit-events", search: next })
  }

  function removeFilter(key: keyof OperatorLogSearch) {
    const next: OperatorLogSearch = { ...search() }
    delete next[key]
    void navigate({ to: "/operator-audit-events", search: next })
  }

  function onClear() {
    setDraft(searchToDraft({}))
    void navigate({ to: "/operator-audit-events", search: {} })
  }

  return (
    <>
      <PageHead
        eyebrow="/operator-audit-events"
        title="Operator log"
        lede="Every call an operator made through the operator gateway, newest first. Customers' own requests are in each node's and person's audit log."
      />

      {/* Primary filter bar + collapsible advanced filters */}
      <form onSubmit={onApply} class="space-y-3 rounded-xl border border-rule bg-surface p-3.5">
        <div class="flex flex-wrap items-end gap-2.5">
          <div class="min-w-44 flex-1">
            <Field name="op_node_id">
              <FieldLabel>Node ID</FieldLabel>
              <Input
                size="sm"
                mono
                value={draft().node_id}
                onValueChange={(v) => patch("node_id", v)}
                placeholder="01j…"
              />
            </Field>
          </div>

          <div class="min-w-32 flex-1">
            <Field name="op_service">
              <FieldLabel>Service</FieldLabel>
              <Input
                size="sm"
                mono
                value={draft().service}
                onValueChange={(v) => patch("service", v)}
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
                onValueChange={(v) => patch("method", v ?? "")}
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
                onValueChange={(v) => patch("outcome", v ?? "")}
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
            <Show when={activeEntries().length > 0}>
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
              <Field name="op_operator_id">
                <FieldLabel>Operator ID</FieldLabel>
                <Input
                  size="sm"
                  mono
                  value={draft().operator_id}
                  onValueChange={(v) => patch("operator_id", v)}
                />
              </Field>
              <Field name="op_acting_as">
                <FieldLabel>Acting as member ID</FieldLabel>
                <Input
                  size="sm"
                  mono
                  value={draft().acting_as_member_id}
                  onValueChange={(v) => patch("acting_as_member_id", v)}
                />
              </Field>
              <Field name="op_route">
                <FieldLabel>Route</FieldLabel>
                <Input
                  size="sm"
                  mono
                  value={draft().route}
                  onValueChange={(v) => patch("route", v)}
                />
              </Field>
              <Field name="op_request_id">
                <FieldLabel>Request ID</FieldLabel>
                <Input
                  size="sm"
                  mono
                  value={draft().request_id}
                  onValueChange={(v) => patch("request_id", v)}
                />
              </Field>
              <Field name="op_created_id">
                <FieldLabel>Created ID</FieldLabel>
                <Input
                  size="sm"
                  mono
                  value={draft().created_id}
                  onValueChange={(v) => patch("created_id", v)}
                />
              </Field>
              <Field name="op_after">
                <FieldLabel>From</FieldLabel>
                <Input
                  size="sm"
                  type="datetime-local"
                  value={draft().occurred_after}
                  onValueChange={(v) => patch("occurred_after", v)}
                />
              </Field>
              <Field name="op_before">
                <FieldLabel>Before</FieldLabel>
                <Input
                  size="sm"
                  type="datetime-local"
                  value={draft().occurred_before}
                  onValueChange={(v) => patch("occurred_before", v)}
                />
              </Field>
            </div>
          </CollapsiblePanel>
        </Collapsible>
      </form>

      {/* Active filter chips (especially helpful for deep links like ?node_id= or ?request_id=) */}
      <Show when={activeEntries().length > 0}>
        <div class="flex flex-wrap items-center gap-2">
          <For each={activeEntries()}>
            {([key, value]) => (
              <span class="inline-flex items-center gap-1.5 rounded-full border border-rule-strong bg-surface px-2.5 py-0.5 text-xs text-text-2">
                <span class="text-muted">{FILTER_LABELS[key]}:</span>
                <code class="max-w-48 truncate text-text">{value}</code>
                <button
                  type="button"
                  aria-label={`Remove ${FILTER_LABELS[key]} filter`}
                  onClick={() => removeFilter(key)}
                  class="ml-0.5 rounded-full px-1 text-muted hover:bg-surface-2 hover:text-text cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
          </For>
        </div>
      </Show>

      <Show when={listQuery.isError}>
        <ErrorAlert error={listQuery.error} />
      </Show>

      <Switch>
        <Match when={listQuery.isPending && items().length === 0}>
          <LoadingState />
        </Match>
        <Match when={items().length === 0 && !listQuery.isError}>
          <EmptyState
            title={
              queryStr() ? "No operator audit events match these filters" : "No operator audit events yet"
            }
          />
        </Match>
        <Match when={items().length > 0}>
          <div class="overflow-x-auto rounded-xl border border-rule bg-surface">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-rule text-left font-mono text-[0.71875rem] font-medium text-muted">
                  <th class="px-4 py-2.5 font-medium">when</th>
                  <th class="px-4 py-2.5 font-medium">operator</th>
                  <th class="px-4 py-2.5 font-medium">request</th>
                  <th class="px-4 py-2.5 font-medium">service</th>
                  <th class="px-4 py-2.5 font-medium">outcome</th>
                  <th class="px-4 py-2.5 text-right font-medium" />
                </tr>
              </thead>
              <tbody class="divide-y divide-rule">
                <For each={items()}>
                  {(event) => {
                    const actingName = () =>
                      event.acting_as ? names().get(event.acting_as.member_id)?.name : null
                    return (
                      <tr class="transition-colors hover:bg-surface-2/50">
                        <td class="px-4 py-3 text-xs text-text-2 whitespace-nowrap">
                          <When at={event.occurred_at} />
                        </td>
                        <td class="px-4 py-3 text-xs">
                          <div class="font-medium text-text">
                            {event.actor.email ?? <code class="text-xs">{event.actor.operator_id}</code>}
                          </div>
                          <Show when={event.actor.client_id}>
                            <div class="mt-0.5 font-mono text-[0.6875rem] text-muted">{event.actor.client_id}</div>
                          </Show>
                          <Show when={event.acting_as && event.root_id}>
                            <div class="mt-0.5 text-[0.71875rem] text-accent-text">
                              as{" "}
                              <Link
                                to="/nodes/$nodeId/members/$memberId"
                                params={{ nodeId: event.root_id!, memberId: event.acting_as!.member_id }}
                                class="hover:underline underline-offset-2"
                                title={event.acting_as!.member_id}
                              >
                                {actingName() ?? event.acting_as!.member_id}
                              </Link>
                            </div>
                          </Show>
                        </td>
                        <td class="px-4 py-3 text-xs">
                          <div class="flex flex-wrap items-center gap-1.5">
                            <code class="rounded bg-surface-2 px-1.5 py-0.5 font-medium text-text">
                              {event.method}
                            </code>
                            <code class="text-text-2 break-all">{event.route ?? event.path}</code>
                          </div>
                          <div class="mt-0.5 font-mono text-[0.6875rem] text-muted">{event.request_id}</div>
                        </td>
                        <td class="px-4 py-3 font-mono text-xs text-text-2 whitespace-nowrap">
                          {event.service ?? <span class="text-muted">no route</span>}
                        </td>
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
        <DrawerContent<OperatorAuditEvent> class="w-[min(34rem,94vw)]">
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
                          <span class="font-mono text-xs text-muted">{ev().service ?? "no route"}</span>
                        </div>
                        <DrawerTitle class="font-mono text-sm font-semibold text-text break-all">
                          {ev().method} {ev().route ?? ev().path}
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
                        <DetailRow label="Operator">
                          <div class="space-y-0.5 text-xs">
                            <Show when={ev().actor.email}>
                              <div class="font-medium text-text">{ev().actor.email}</div>
                            </Show>
                            <Id value={ev().actor.operator_id} copy />
                            <Show when={ev().actor.client_id}>
                              <div class="font-mono text-muted">client: {ev().actor.client_id}</div>
                            </Show>
                          </div>
                        </DetailRow>
                        <DetailRow label="Issuer">
                          <code class="text-xs text-text-2 break-all">{ev().actor.issuer}</code>
                        </DetailRow>
                        <Show when={ev().acting_as}>
                          {(acting) => (
                            <DetailRow label="Acting as">
                              <Show
                                when={ev().root_id}
                                fallback={<Id value={acting().member_id} copy />}
                              >
                                <Link
                                  to="/nodes/$nodeId/members/$memberId"
                                  params={{ nodeId: ev().root_id!, memberId: acting().member_id }}
                                  class="font-mono text-xs text-accent-text hover:underline underline-offset-2"
                                >
                                  {names().get(acting().member_id)?.name ?? acting().member_id}
                                </Link>
                              </Show>
                            </DetailRow>
                          )}
                        </Show>
                        <Show when={ev().nodes.length > 0}>
                          <DetailRow label="Nodes">
                            <NodeIds nodes={ev().nodes} />
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
                        <DetailRow label="Response bytes">
                          <span class="font-mono text-xs text-text-2">
                            {ev().response_bytes !== null ? ev().response_bytes : "—"}
                          </span>
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
    </>
  )
}
