import {
  SegmentedControl as SdkSegmentedControl,
  SegmentedControlIndicator as SdkSegmentedControlIndicator,
  SegmentedControlItem as SdkSegmentedControlItem,
} from "@ui-sdk/solid/segmented-control"
import type { ComponentProps, JSX } from "@solidjs/web"
import { omit } from "solid-js"
import { cx } from "./className"

export function SegmentedControl(
  props: Omit<ComponentProps<typeof SdkSegmentedControl>, "children"> & { children?: JSX.Element },
) {
  const rest = omit(props, "class", "children")
  return (
    <SdkSegmentedControl
      {...rest}
      class={
        cx(
          "relative inline-flex items-center rounded-lg border border-rule bg-bg p-0.5 isolate",
          props.class,
        ) as never
      }
    >
      <SdkSegmentedControlIndicator class="rounded-md bg-surface shadow-xs ring-1 ring-rule" />
      {props.children}
    </SdkSegmentedControl>
  )
}

export function SegmentedControlItem(props: ComponentProps<typeof SdkSegmentedControlItem>) {
  const rest = omit(props, "class")
  return (
    <SdkSegmentedControlItem
      {...rest}
      class={
        cx(
          "relative z-1 inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-muted whitespace-nowrap cursor-pointer transition-colors hover:text-text data-checked:text-text",
          props.class,
        ) as never
      }
    />
  )
}
