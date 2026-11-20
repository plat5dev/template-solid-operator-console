import { Link } from "@tanstack/solid-router"
import { For } from "solid-js"
import type { Outcome } from "../api/audit"
import type { BadgeVariant } from "./ui/Badge"

export const METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"] as const
export const OUTCOMES: Outcome[] = ["pending", "rejected", "responded", "no_response"]

/** Maps an audit event outcome (+ optional HTTP status) to a badge variant. */
export function outcomeVariant(outcome: Outcome, status?: number | null): BadgeVariant {
  if (outcome === "rejected") return "danger"
  if (outcome === "pending" || outcome === "no_response") return "dashed"
  if (status != null && status >= 400) return "danger"
  return "default"
}

/** A datetime-local value as RFC 3339 UTC, or "" when empty or invalid. */
export function toRfc3339(local: string): string {
  const v = local.trim()
  if (!v) return ""
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? "" : d.toISOString()
}

/** An RFC 3339 timestamp formatted for a `datetime-local` input. */
export function toLocal(rfc3339: string): string {
  const d = new Date(rfc3339)
  if (Number.isNaN(d.getTime())) return ""
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

/** The nodes an audit event touched, root first, each linking to `/nodes/$nodeId`. */
export function NodeIds(props: { nodes: { kind?: string; id: string }[] }) {
  return (
    <div class="space-y-1">
      <For each={props.nodes}>
        {(n) => (
          <div class="flex flex-wrap items-center gap-1.5 text-xs">
            {n.kind && <span class="text-muted">{n.kind}</span>}
            <Link
              to="/nodes/$nodeId"
              params={{ nodeId: n.id }}
              class="font-mono text-accent-text hover:underline underline-offset-2"
            >
              {n.id}
            </Link>
          </div>
        )}
      </For>
    </div>
  )
}
