import type { JSX } from "@solidjs/web"
import { Show } from "solid-js"
import { Button } from "./Button"
import { toast } from "./overlays"

export type BadgeVariant = "default" | "accent" | "danger" | "dashed" | "muted"

const badgeClasses: Record<BadgeVariant, string> = {
  default: "border-rule-strong text-text-2",
  accent: "border-accent text-accent-text bg-accent-wash",
  danger: "border-danger text-danger bg-danger-wash",
  dashed: "border-rule-strong border-dashed text-muted",
  muted: "border-rule bg-surface-2 text-muted",
}

export function Badge(props: { variant?: BadgeVariant; class?: string; children: JSX.Element }) {
  return (
    <span
      class={[
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[0.6875rem] font-medium leading-tight whitespace-nowrap align-middle",
        badgeClasses[props.variant ?? "default"],
        props.class,
      ]}
    >
      {props.children}
    </span>
  )
}

/** State is shape, not color: filled is active, hollow is paused/pending, struck is over. */
export function Status(props: { value: string }) {
  const hollow = () => props.value === "suspended" || props.value === "pending"
  const struck = () =>
    props.value === "removed" ||
    props.value === "revoked" ||
    props.value === "expired" ||
    props.value === "deleted" ||
    props.value === "purged"
  const doubleRing = () => props.value === "redeemed"

  return (
    <span
      class={[
        "inline-flex items-center gap-1.5 text-xs whitespace-nowrap",
        hollow() ? "text-muted" : struck() ? "text-muted line-through" : "text-text-2",
      ]}
    >
      <span
        aria-hidden="true"
        class={[
          "inline-block rounded-full",
          doubleRing()
            ? "h-1.5 w-1.5 border border-text bg-transparent ring-1 ring-text ring-offset-2 ring-offset-surface"
            : hollow()
              ? "h-1.75 w-1.75 border-[1.5px] border-muted bg-transparent"
              : struck()
                ? "h-1.75 w-1.75 bg-rule-strong"
                : "h-1.75 w-1.75 bg-text",
        ]}
      />
      {props.value}
    </span>
  )
}

export function Avatar(props: {
  text: string
  square?: boolean
  size?: "sm" | "md"
  accent?: boolean
  class?: string
}) {
  return (
    <span
      aria-hidden="true"
      class={[
        "grid shrink-0 place-items-center border font-semibold uppercase select-none",
        props.accent
          ? "border-accent bg-accent-wash text-accent-text"
          : "border-rule bg-surface-2 text-text-2",
        props.square ? "rounded-md font-mono text-[0.625rem]" : "rounded-full text-[0.6875rem]",
        props.size === "sm" ? "h-6 w-6" : "h-7 w-7",
        props.class,
      ]}
    >
      {props.text}
    </span>
  )
}

export function When(props: { at: string | null | undefined }) {
  return (
    <Show when={props.at} fallback={<span class="text-muted">—</span>}>
      {(at) => (
        <time datetime={at()} title={at()}>
          {new Date(at()).toLocaleString()}
        </time>
      )}
    </Show>
  )
}

export function Id(props: { value: string | null | undefined; copy?: boolean }) {
  return (
    <Show when={props.value} fallback={<span class="text-muted">—</span>}>
      {(val) => (
        <span class="inline-flex items-center gap-1">
          <code class="text-xs text-text-2 select-all break-all">{val()}</code>
          <Show when={props.copy}>
            <CopyButton value={val()} label="ID" />
          </Show>
        </span>
      )}
    </Show>
  )
}

/** A node's slug, or a dash once it's freed (`null`). */
export function Slug(props: { value: string | null }) {
  return (
    <Show when={props.value !== null} fallback={<span class="text-muted">—</span>}>
      <code class="text-xs text-text-2">{props.value}</code>
    </Show>
  )
}

export function Card(props: { danger?: boolean; class?: string; children: JSX.Element }) {
  return (
    <section
      class={[
        "min-w-0 rounded-xl border bg-surface",
        props.danger ? "border-danger/45" : "border-rule",
        props.class,
      ]}
    >
      {props.children}
    </section>
  )
}

export function CardHead(props: { children: JSX.Element; class?: string }) {
  return (
    <div class={["flex flex-wrap items-center justify-between gap-2 border-b border-rule px-5 py-3.5", props.class]}>
      {props.children}
    </div>
  )
}

export function CardBody(props: { children: JSX.Element; class?: string }) {
  return <div class={["space-y-4 p-5", props.class]}>{props.children}</div>
}

export function CardFoot(props: { children: JSX.Element; class?: string }) {
  return (
    <div class={["flex flex-wrap items-center gap-2 border-t border-rule px-5 py-3.5", props.class]}>
      {props.children}
    </div>
  )
}

export function PageHead(props: {
  crumbs?: JSX.Element
  eyebrow?: JSX.Element
  title: JSX.Element
  lede?: JSX.Element
  actions?: JSX.Element
}) {
  return (
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0 space-y-1">
        <Show when={props.crumbs}>
          <nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-1.5 text-xs text-muted pb-0.5">
            {props.crumbs}
          </nav>
        </Show>
        <Show when={props.eyebrow}>
          <p class="font-mono text-xs text-muted break-all">{props.eyebrow}</p>
        </Show>
        <h1 class="text-2xl font-semibold tracking-tight text-text leading-tight">{props.title}</h1>
        <Show when={props.lede}>
          <p class="max-w-2xl pt-0.5 text-sm text-text-2">{props.lede}</p>
        </Show>
      </div>
      <Show when={props.actions}>
        <div class="flex flex-wrap items-center gap-2">{props.actions}</div>
      </Show>
    </header>
  )
}

export function LoadingState(props: { children?: JSX.Element; full?: boolean }) {
  return (
    <div
      class={
        props.full
          ? "flex min-h-[50vh] items-center justify-center px-4 text-sm text-muted"
          : "py-6 text-sm text-muted"
      }
    >
      {props.children ?? "Loading…"}
    </div>
  )
}

export function EmptyState(props: { title: JSX.Element; description?: JSX.Element; action?: JSX.Element }) {
  return (
    <div class="flex flex-col items-start gap-2 rounded-xl border border-rule bg-surface px-5 py-8 text-sm">
      <div class="font-medium text-text">{props.title}</div>
      <Show when={props.description}>
        <div class="max-w-md text-xs text-muted">{props.description}</div>
      </Show>
      <Show when={props.action}>
        <div class="pt-1">{props.action}</div>
      </Show>
    </div>
  )
}

export function LoadMore(props: { show: boolean; loading: boolean; onClick: () => void; label?: string }) {
  return (
    <Show when={props.show}>
      <div>
        <Button size="sm" disabled={props.loading} onClick={props.onClick}>
          {props.loading ? "Loading…" : (props.label ?? "Load more")}
        </Button>
      </div>
    </Show>
  )
}

/** Two-column key/value metadata list for entity details and audit drawers. */
export function DetailList(props: { children: JSX.Element; class?: string }) {
  return (
    <dl class={["grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]", props.class]}>
      {props.children}
    </dl>
  )
}

export function DetailRow(props: { label: string; children: JSX.Element }) {
  return (
    <>
      <dt class="text-xs font-medium text-muted sm:pt-0.5">{props.label}</dt>
      <dd class="min-w-0 text-text break-words">{props.children}</dd>
    </>
  )
}

export function Chip(props: { children: JSX.Element; class?: string }) {
  return (
    <code
      class={[
        "inline-flex items-center rounded border border-rule bg-surface-2 px-1.5 py-0.5 text-[0.71875rem] text-text-2",
        props.class,
      ]}
    >
      {props.children}
    </code>
  )
}

/** Small inline button to copy an ID, slug, or response. */
export function CopyButton(props: { value: string; label?: string; text?: string }) {
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(props.value)
      toast.success(`${props.label ?? "Value"} copied`)
    } catch {
      toast.error("Couldn't copy to clipboard")
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      class="inline-flex items-center rounded px-1.5 py-0.5 font-sans text-xs text-muted transition-colors hover:bg-surface-2 hover:text-text cursor-pointer"
      title={`Copy ${props.label ?? "value"}`}
    >
      {props.text ?? "Copy"}
    </button>
  )
}
