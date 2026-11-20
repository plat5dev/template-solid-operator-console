import {
  Combobox as SdkCombobox,
  ComboboxContent as SdkComboboxContent,
  ComboboxEmpty as SdkComboboxEmpty,
  ComboboxInput as SdkComboboxInput,
  ComboboxItem as SdkComboboxItem,
  ComboboxItemIndicator as SdkComboboxItemIndicator,
  ComboboxLabel as SdkComboboxLabel,
  ComboboxList as SdkComboboxList,
  ComboboxTrigger as SdkComboboxTrigger,
} from "@ui-sdk/solid/combobox"
import type { ComponentProps, JSX } from "@solidjs/web"
import { omit } from "solid-js"
import { cx } from "./className"

export { SdkCombobox as Combobox, SdkComboboxList as ComboboxList }

export function ComboboxLabel(props: ComponentProps<typeof SdkComboboxLabel>) {
  const rest = omit(props, "class")
  return <SdkComboboxLabel {...rest} class={cx("text-xs font-medium text-text", props.class) as never} />
}

export function ComboboxInput(props: ComponentProps<typeof SdkComboboxInput> & { size?: "sm" | "md" }) {
  const rest = omit(props, "class", "size")
  const base = () =>
    [
      "w-full min-w-0 rounded-md border border-rule-strong bg-field text-text placeholder:text-muted focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent-wash disabled:opacity-55",
      props.size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
    ].join(" ")
  return <SdkComboboxInput {...rest} class={cx(base(), props.class) as never} />
}

export function ComboboxTrigger(props: ComponentProps<typeof SdkComboboxTrigger>) {
  const rest = omit(props, "class")
  return (
    <SdkComboboxTrigger
      {...rest}
      class={
        cx(
          "inline-grid h-8 w-8 shrink-0 place-items-center rounded-md border border-rule-strong bg-surface text-muted hover:border-text-2 hover:text-text cursor-pointer",
          props.class,
        ) as never
      }
    />
  )
}

export function ComboboxContent(props: ComponentProps<typeof SdkComboboxContent>) {
  const rest = omit(props, "class")
  return (
    <SdkComboboxContent
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

export function ComboboxItem(
  props: Omit<ComponentProps<typeof SdkComboboxItem>, "children"> & { children?: JSX.Element },
) {
  const rest = omit(props, "class", "children")
  return (
    <SdkComboboxItem
      {...rest}
      class={
        cx(
          "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-text-2 cursor-pointer select-none data-highlighted:bg-surface-2 data-highlighted:text-text data-selected:text-text data-selected:font-medium data-disabled:opacity-45 data-disabled:pointer-events-none",
          props.class,
        ) as never
      }
    >
      <span class="min-w-0 flex-1">{props.children}</span>
      <SdkComboboxItemIndicator class="ms-auto shrink-0 text-accent-text">
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
      </SdkComboboxItemIndicator>
    </SdkComboboxItem>
  )
}

export function ComboboxEmpty(props: ComponentProps<typeof SdkComboboxEmpty>) {
  const rest = omit(props, "class")
  return (
    <SdkComboboxEmpty
      {...rest}
      class={cx("px-2.5 py-3 text-center text-xs text-muted", props.class) as never}
    />
  )
}
