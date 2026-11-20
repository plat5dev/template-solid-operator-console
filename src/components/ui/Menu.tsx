import {
  Menu as SdkMenu,
  MenuContent as SdkMenuContent,
  MenuGroup as SdkMenuGroup,
  MenuGroupLabel as SdkMenuGroupLabel,
  MenuItem as SdkMenuItem,
  MenuSeparator as SdkMenuSeparator,
  MenuTrigger as SdkMenuTrigger,
  createMenuController,
} from "@ui-sdk/solid/menu"
import type { ComponentProps } from "@solidjs/web"
import { omit } from "solid-js"
import { cx } from "./className"

export { SdkMenu as Menu, SdkMenuGroup as MenuGroup, SdkMenuTrigger as MenuTrigger, createMenuController }

export function MenuContent(props: ComponentProps<typeof SdkMenuContent>) {
  const rest = omit(props, "class")
  return (
    <SdkMenuContent
      sideOffset={6}
      {...rest}
      class={
        cx(
          "z-50 min-w-48 max-w-[min(22rem,calc(100vw-2rem))] max-h-[min(22rem,var(--available-height))] overflow-y-auto rounded-lg border border-rule bg-surface p-1 text-text shadow-pop origin-(--transform-origin) transition-[opacity,scale] duration-120 data-starting-style:scale-97 data-starting-style:opacity-0 data-ending-style:scale-97 data-ending-style:opacity-0",
          props.class,
        ) as never
      }
    />
  )
}

export function MenuItem(props: ComponentProps<typeof SdkMenuItem> & { danger?: boolean }) {
  const rest = omit(props, "class", "danger")
  const base = () =>
    [
      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm cursor-pointer select-none no-underline transition-colors data-disabled:opacity-45 data-disabled:pointer-events-none",
      props.danger
        ? "text-danger data-highlighted:bg-danger-wash data-highlighted:text-danger"
        : "text-text-2 data-highlighted:bg-surface-2 data-highlighted:text-text",
    ].join(" ")

  return <SdkMenuItem {...rest} class={cx(base(), props.class) as never} />
}

export function MenuGroupLabel(props: ComponentProps<typeof SdkMenuGroupLabel>) {
  const rest = omit(props, "class")
  return (
    <SdkMenuGroupLabel
      {...rest}
      class={cx("px-2.5 py-1 font-mono text-[0.6875rem] font-medium text-muted", props.class) as never}
    />
  )
}

export function MenuSeparator(props: ComponentProps<typeof SdkMenuSeparator>) {
  const rest = omit(props, "class")
  return <SdkMenuSeparator {...rest} class={cx("my-1 h-px bg-rule", props.class) as never} />
}
