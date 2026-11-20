import { Link } from "@tanstack/solid-router"
import { Show } from "solid-js"
import { ApiError } from "../api/client"
import { CopyButton } from "./ui/Badge"

function reason(body: unknown): string | null {
  const details = (body as { error?: { details?: { reason?: unknown } } } | null)?.error?.details
  return typeof details?.reason === "string" ? details.reason : null
}

const hints: Record<number, string> = {
  502: "The service behind the gateway didn't answer.",
  503: "The gateway's IdP keys, the operator log, identity, or the service behind it is unavailable.",
}

/** Shows the Plat5 error envelope and X-Request-ID (linked to the operator log). */
export function ErrorAlert(props: { error: unknown; onDismiss?: () => void }) {
  const apiErr = () => (props.error instanceof ApiError ? props.error : null)
  const plainMessage = () => (props.error instanceof Error ? props.error.message : String(props.error))

  return (
    <Show when={props.error}>
      <div
        role="alert"
        class={[
          "relative grid min-w-0 gap-1.5 rounded-lg border border-danger border-l-[3px] bg-danger-wash px-4 py-3 text-sm text-text",
          props.onDismiss ? "pr-10" : "",
        ]}
      >
        <Show
          when={apiErr()}
          fallback={<div class="font-medium text-danger break-words">{plainMessage()}</div>}
        >
          {(err) => {
            const errReason = () => reason(err().body)
            const hint = () => hints[err().status]
            return (
              <>
                <div class="break-words">
                  <span class="mr-2 font-mono text-xs font-semibold text-danger">{err().code}</span>
                  <span class="font-medium text-text">{err().message}</span>
                </div>
                <Show when={hint()}>
                  <div class="text-xs text-text-2">{hint()}</div>
                </Show>
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-text-2">
                  <span>HTTP {err().status}</span>
                  <Show when={errReason()}>
                    <span>·</span>
                    <span>reason={errReason()}</span>
                  </Show>
                  <Show when={err().requestId}>
                    {(rid) => (
                      <>
                        <span>·</span>
                        <span class="inline-flex items-center gap-1">
                          request_id=
                          <Link
                            to="/operator-audit-events"
                            search={{ request_id: rid() }}
                            class="text-accent-text hover:underline underline-offset-2 select-all"
                            title="Inspect in operator log"
                          >
                            {rid()}
                          </Link>
                          <CopyButton value={rid()} label="Request ID" />
                        </span>
                      </>
                    )}
                  </Show>
                </div>
              </>
            )
          }}
        </Show>

        <Show when={props.onDismiss}>
          <button
            type="button"
            aria-label="Close"
            onClick={() => props.onDismiss?.()}
            class="absolute top-2 right-2 inline-grid h-6 w-6 place-items-center rounded text-base leading-none text-muted hover:bg-surface-2 hover:text-text cursor-pointer"
          >
            ×
          </button>
        </Show>
      </div>
    </Show>
  )
}
