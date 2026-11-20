import {
  Dialog as SdkDialog,
  DialogBackdrop as SdkDialogBackdrop,
  DialogClose as SdkDialogClose,
  DialogContent as SdkDialogContent,
  DialogDescription as SdkDialogDescription,
  DialogTitle as SdkDialogTitle,
  DialogTrigger as SdkDialogTrigger,
  createDialogController,
} from "@ui-sdk/solid/dialog"
import type { ComponentProps, JSX } from "@solidjs/web"
import { omit } from "solid-js"
import { cx } from "./className"

export { SdkDialog as Dialog, SdkDialogTrigger as DialogTrigger, createDialogController }

export function DialogBackdrop(props: ComponentProps<typeof SdkDialogBackdrop>) {
  const rest = omit(props, "class")
  return (
    <SdkDialogBackdrop
      {...rest}
      class={
        cx(
          "fixed inset-0 z-50 bg-black/45 transition-opacity duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0",
          props.class,
        ) as never
      }
    />
  )
}

export function DialogContent(props: ComponentProps<typeof SdkDialogContent>) {
  const rest = omit(props, "class")
  return (
    <SdkDialogContent
      {...rest}
      class={
        cx(
          "fixed top-1/2 left-1/2 z-50 w-[min(30rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-xl border border-rule bg-surface p-0 text-text shadow-pop transition-[opacity,scale] duration-150 data-starting-style:scale-96 data-starting-style:opacity-0 data-ending-style:scale-96 data-ending-style:opacity-0",
          props.class,
        ) as never
      }
    />
  )
}

export function DialogHeader(props: { children: JSX.Element; class?: string }) {
  return (
    <div class={["flex items-start justify-between gap-4 border-b border-rule px-5 py-4", props.class]}>
      <div class="min-w-0 space-y-1">{props.children}</div>
      <SdkDialogClose
        aria-label="Close"
        class="inline-grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-text cursor-pointer"
      >
        ×
      </SdkDialogClose>
    </div>
  )
}

export function DialogTitle(props: ComponentProps<typeof SdkDialogTitle>) {
  const rest = omit(props, "class")
  return (
    <SdkDialogTitle
      {...rest}
      class={cx("text-base font-semibold tracking-tight text-text", props.class) as never}
    />
  )
}

export function DialogDescription(props: ComponentProps<typeof SdkDialogDescription>) {
  const rest = omit(props, "class")
  return <SdkDialogDescription {...rest} class={cx("text-sm text-text-2", props.class) as never} />
}

export function DialogBody(props: { children: JSX.Element; class?: string }) {
  return <div class={["space-y-4 p-5", props.class]}>{props.children}</div>
}

export function DialogFooter(props: { children: JSX.Element; class?: string }) {
  return (
    <div class={["flex flex-wrap items-center justify-end gap-2 border-t border-rule px-5 py-3.5", props.class]}>
      {props.children}
    </div>
  )
}

export function DialogClose(props: ComponentProps<typeof SdkDialogClose>) {
  const rest = omit(props, "class")
  return (
    <SdkDialogClose
      {...rest}
      class={
        cx(
          "inline-flex items-center justify-center rounded-md border border-rule-strong bg-surface px-3.5 py-1.5 text-sm font-medium text-text transition-colors hover:border-text-2 cursor-pointer",
          props.class,
        ) as never
      }
    />
  )
}
