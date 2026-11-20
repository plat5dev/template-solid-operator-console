import {
  Tabs as SdkTabs,
  TabsList as SdkTabsList,
  TabsPanel as SdkTabsPanel,
  TabsTab as SdkTabsTab,
} from "@ui-sdk/solid/tabs"
import type { ComponentProps } from "@solidjs/web"
import { omit } from "solid-js"
import { cx } from "./className"

export function Tabs(props: ComponentProps<typeof SdkTabs>) {
  const rest = omit(props, "class")
  return <SdkTabs {...rest} class={cx("space-y-4", props.class) as never} />
}

export function TabsList(props: ComponentProps<typeof SdkTabsList>) {
  const rest = omit(props, "class")
  return (
    <SdkTabsList
      {...rest}
      class={cx("flex items-center gap-5 overflow-x-auto border-b border-rule", props.class) as never}
    />
  )
}

export function TabsTab(props: ComponentProps<typeof SdkTabsTab>) {
  const rest = omit(props, "class")
  return (
    <SdkTabsTab
      {...rest}
      class={
        cx(
          "relative inline-flex items-center gap-2 pb-2.5 text-sm text-muted whitespace-nowrap cursor-pointer transition-colors hover:text-text data-selected:text-text data-selected:font-medium after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-transparent data-selected:after:bg-accent",
          props.class,
        ) as never
      }
    />
  )
}

export function TabsPanel(props: ComponentProps<typeof SdkTabsPanel>) {
  const rest = omit(props, "class")
  return <SdkTabsPanel {...rest} class={cx("outline-none", props.class) as never} />
}
