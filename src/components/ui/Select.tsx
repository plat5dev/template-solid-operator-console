import {
  Select as SdkSelect,
  SelectContent as SdkSelectContent,
  SelectGroup as SdkSelectGroup,
  SelectGroupLabel as SdkSelectGroupLabel,
  SelectItem as SdkSelectItem,
  SelectItemIndicator as SdkSelectItemIndicator,
  SelectLabel as SdkSelectLabel,
  SelectSeparator as SdkSelectSeparator,
  SelectTrigger as SdkSelectTrigger,
  SelectValue as SdkSelectValue,
} from "@ui-sdk/solid/select"
import type { ComponentProps, JSX } from "@solidjs/web"
import { omit } from "solid-js"
import { cx } from "./className"

export { SdkSelect as Select, SdkSelectGroup as SelectGroup, SdkSelectValue as SelectValue }

export function SelectLabel(props: ComponentProps<typeof SdkSelectLabel>) {
  const rest = omit(props, "class")
  return <SdkSelectLabel {...rest} class={cx("text-xs font-medium text-text", props.class) as never} />
}

export function SelectTrigger(
  props: Omit<ComponentProps<typeof SdkSelectTrigger>, "children"> & {
    size?: "sm" | "md"
    children?: JSX.Element
  },
) {
  const rest = omit(props, "class", "size", "children")
  const base = () =>
    [
      "inline-flex items-center justify-between gap-2 rounded-md border border-rule-strong bg-field text-left text-text transition-colors hover:border-text-2 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent-wash disabled:opacity-55 disabled:pointer-events-none cursor-pointer",
      props.size === "sm" ? "px-2.5 py-1 text-xs" : "w-full px-3 py-1.5 text-sm",
    ].join(" ")

  return (
    <SdkSelectTrigger {...rest} class={cx(base(), props.class) as never}>
      <span class="min-w-0 truncate">{props.children}</span>
      <svg
        class="h-3.5 w-3.5 shrink-0 text-muted"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m4 6 4 4 4-4" />
      </svg>
    </SdkSelectTrigger>
  )
}

export function SelectContent(props: ComponentProps<typeof SdkSelectContent>) {
  const rest = omit(props, "class")
  return (
    <SdkSelectContent
      sideOffset={4}
      {...rest}
      class={
        cx(
          "z-50 min-w-(--anchor-width) max-h-[min(18rem,var(--available-height))] overflow-y-auto rounded-lg border border-rule bg-surface p-1 text-text shadow-pop origin-(--transform-origin) transition-[opacity,scale] duration-120 data-starting-style:scale-97 data-starting-style:opacity-0 data-ending-style:scale-97 data-ending-style:opacity-0",
          props.class,
        ) as never
      }
    />
  )
}

export function SelectItem(
  props: Omit<ComponentProps<typeof SdkSelectItem>, "children"> & { children?: JSX.Element },
) {
  const rest = omit(props, "class", "children")
  return (
    <SdkSelectItem
      {...rest}
      class={
        cx(
          "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-text-2 cursor-pointer select-none data-highlighted:bg-surface-2 data-highlighted:text-text data-selected:text-text data-selected:font-medium data-disabled:opacity-45 data-disabled:pointer-events-none",
          props.class,
        ) as never
      }
    >
      <span class="min-w-0 flex-1">{props.children}</span>
      <SdkSelectItemIndicator class="ms-auto shrink-0 text-accent-text">
        <svg
          class="h-3.5 w-3.5"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M3 8.5 6.5 12 13 4.5" />
        </svg>
      </SdkSelectItemIndicator>
    </SdkSelectItem>
  )
}

export function SelectGroupLabel(props: ComponentProps<typeof SdkSelectGroupLabel>) {
  const rest = omit(props, "class")
  return (
    <SdkSelectGroupLabel
      {...rest}
      class={cx("px-2.5 py-1 font-mono text-[0.6875rem] font-medium text-muted", props.class) as never}
    />
  )
}

export function SelectSeparator(props: ComponentProps<typeof SdkSelectSeparator>) {
  const rest = omit(props, "class")
  return <SdkSelectSeparator {...rest} class={cx("my-1 h-px bg-rule", props.class) as never} />
}
