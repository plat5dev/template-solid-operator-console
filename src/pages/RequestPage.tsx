import { Link, useLocation, useNavigate } from "@tanstack/solid-router"
import { createMemo, createSignal, For, Show } from "solid-js"
import { send, type RawResponse } from "../api/client"
import { ErrorAlert } from "../components/ErrorAlert"
import { Badge, Card, CardBody, CardHead, CopyButton, PageHead } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { Input, Textarea } from "../components/ui/Field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/Select"
import { Tabs, TabsList, TabsPanel, TabsTab } from "../components/ui/Tabs"
import { config } from "../config"

const methods = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"] as const
const methodItems = methods.map((m) => ({ value: m, label: m }))
const withBody = new Set<string>(["POST", "PUT", "PATCH", "DELETE"])

/**
 * Any method, any path, through the operator gateway with your token.
 * `?method=&path=` prefills the workbench.
 */
export function RequestPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const search = createMemo(() => location().search as { method?: string; path?: string })

  const initialMethod = methods.includes(search().method as (typeof methods)[number])
    ? search().method!
    : "GET"

  const [method, setMethod] = createSignal(initialMethod)
  const [rawTarget, setRawTarget] = createSignal(search().path ?? "/nodes?kind=organization")
  const [body, setBody] = createSignal("")
  const [busy, setBusy] = createSignal(false)
  const [res, setRes] = createSignal<RawResponse | null>(null)
  const [error, setError] = createSignal<unknown>(null)

  async function executeRequest() {
    setError(null)
    setRes(null)

    let target = rawTarget().trim()
    if (target.startsWith(config.gatewayUrl)) {
      target = target.slice(config.gatewayUrl.length) || "/"
      setRawTarget(target)
    }
    if (!target.startsWith("/")) {
      setError(
        new Error(
          `Enter a path on the gateway starting with / (like /nodes), or a URL on ${config.gatewayUrl}.`,
        ),
      )
      return
    }

    let payload: string | undefined
    if (withBody.has(method()) && body().trim() !== "") {
      try {
        JSON.parse(body())
      } catch {
        setError(new Error("Request body is not valid JSON."))
        return
      }
      payload = body()
    }

    void navigate({ to: "/request", search: { method: method(), path: target }, replace: true })
    setBusy(true)
    try {
      setRes(await send(method(), target, payload))
    } catch (err) {
      setError(
        new Error(
          `No response from ${config.gatewayUrl}. Is it running, and is this origin in its ALLOWED_ORIGINS?`,
        ),
      )
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: SubmitEvent) {
    e.preventDefault()
    void executeRequest()
  }

  function formatBody() {
    if (!body().trim()) return
    try {
      setBody(JSON.stringify(JSON.parse(body()), null, 2))
      setError(null)
    } catch {
      setError(new Error("Request body is not valid JSON."))
    }
  }

  const formattedResponse = createMemo(() => {
    const r = res()
    if (!r) return ""
    return r.body !== null ? JSON.stringify(r.body, null, 2) : r.text || "(empty)"
  })

  const responseHeaders = createMemo(() => {
    const r = res()
    if (!r) return []
    return [...r.headers.entries()].sort(([a], [b]) => a.localeCompare(b))
  })

  return (
    <>
      <PageHead
        eyebrow="any route"
        title="Request"
        lede="Send any method and path through the operator gateway with your operator token. Prefix with /as/{member_id} to act as a member where the route allows it."
      />

      <Card>
        <CardBody>
          <form
            onSubmit={onSubmit}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !busy()) {
                e.preventDefault()
                void executeRequest()
              }
            }}
            class="space-y-3"
          >
            <div class="flex flex-wrap items-center gap-2">
              <div class="w-28 shrink-0">
                <Select
                  items={methodItems}
                  value={method()}
                  onValueChange={(next) => {
                    if (next) setMethod(next)
                  }}
                >
                  <SelectTrigger aria-label="HTTP method" class="font-mono font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <For each={methodItems}>
                      {(item) => (
                        <SelectItem value={item.value}>
                          <span class="font-mono text-xs">{item.label}</span>
                        </SelectItem>
                      )}
                    </For>
                  </SelectContent>
                </Select>
              </div>

              <div class="flex min-w-60 flex-1 items-center rounded-md border border-rule-strong bg-field focus-within:border-accent focus-within:ring-3 focus-within:ring-accent-wash">
                <span
                  class="hidden shrink-0 border-r border-rule bg-surface-2/70 px-2.5 py-1.5 font-mono text-xs text-muted sm:inline-block"
                  title="Operator gateway origin"
                >
                  {config.gatewayUrl}
                </span>
                <Input
                  mono
                  value={rawTarget()}
                  onValueChange={setRawTarget}
                  aria-label="Path on the gateway"
                  placeholder="/nodes"
                  spellcheck={false}
                  class="border-0 bg-transparent focus:ring-0"
                />
              </div>

              <Button type="submit" variant="primary" disabled={busy()}>
                {busy() ? "Sending…" : "Send"}
              </Button>
            </div>

            <Show when={withBody.has(method())}>
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-medium text-text">JSON body</label>
                  <Button type="button" variant="ghost" size="sm" onClick={formatBody}>
                    Format JSON
                  </Button>
                </div>
                <Textarea
                  mono
                  rows={6}
                  placeholder='{ "display_name": "..." }'
                  value={body()}
                  onValueChange={setBody}
                  spellcheck={false}
                  aria-label="JSON body"
                />
              </div>
            </Show>

            <p class="text-[0.71875rem] text-muted">
              Tip: press <kbd class="rounded border border-rule bg-surface-2 px-1 py-0.5 font-mono">⌘/Ctrl</kbd> +{" "}
              <kbd class="rounded border border-rule bg-surface-2 px-1 py-0.5 font-mono">Enter</kbd> to send.
            </p>
          </form>
        </CardBody>
      </Card>

      <ErrorAlert error={error()} onDismiss={() => setError(null)} />

      <Show when={res()}>
        {(r) => (
          <Card>
            <CardHead>
              <div class="flex flex-wrap items-center gap-3 text-xs">
                <Badge variant={r().status < 400 ? "default" : "danger"}>{r().status}</Badge>
                <span class="font-mono text-text-2">{r().ms} ms</span>
                <Show when={r().requestId}>
                  {(rid) => (
                    <span class="inline-flex items-center gap-1 font-mono text-text-2">
                      <span class="text-muted">request_id</span>
                      <Link
                        to="/operator-audit-events"
                        search={{ request_id: rid() }}
                        class="text-accent-text hover:underline underline-offset-2 select-all"
                        title="Open in operator log"
                      >
                        {rid()}
                      </Link>
                      <CopyButton value={rid()} label="Request ID" />
                    </span>
                  )}
                </Show>
              </div>
              <Show when={r().headers.get("Content-Type")}>
                {(ct) => <span class="font-mono text-xs text-muted">{ct()}</span>}
              </Show>
            </CardHead>

            <CardBody class="pt-3">
              <Tabs defaultValue="body">
                <div class="flex items-center justify-between gap-2">
                  <TabsList class="flex-1">
                    <TabsTab value="body">Body</TabsTab>
                    <TabsTab value="headers">
                      Headers <Badge variant="muted">{responseHeaders().length}</Badge>
                    </TabsTab>
                  </TabsList>
                  <CopyButton value={formattedResponse()} label="Response body" text="Copy body" />
                </div>

                <TabsPanel value="body">
                  <pre class="max-h-[60vh] overflow-auto rounded-lg bg-code-bg p-4 text-xs text-code-text">
                    {formattedResponse()}
                  </pre>
                </TabsPanel>

                <TabsPanel value="headers">
                  <div class="overflow-x-auto rounded-lg border border-rule">
                    <table class="w-full border-collapse text-xs">
                      <tbody class="divide-y divide-rule">
                        <For each={responseHeaders()}>
                          {([name, value]) => (
                            <tr>
                              <td class="bg-surface-2/40 px-3 py-2 font-mono font-medium text-text whitespace-nowrap">
                                {name}
                              </td>
                              <td class="px-3 py-2 font-mono text-text-2 break-all">{value}</td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </TabsPanel>
              </Tabs>
            </CardBody>
          </Card>
        )}
      </Show>
    </>
  )
}
