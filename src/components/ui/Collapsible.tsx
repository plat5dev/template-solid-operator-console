import {
  Collapsible as SdkCollapsible,
  CollapsiblePanel as SdkCollapsiblePanel,
  CollapsibleTrigger as SdkCollapsibleTrigger,
} from "@ui-sdk/solid/collapsible"
import type { ComponentProps } from "@solidjs/web"
import { omit } from "solid-js"
import { cx } from "./className"

export { SdkCollapsible as Collapsible, SdkCollapsiblePanel as CollapsiblePanel }

export function CollapsibleTrigger(props: ComponentProps<typeof SdkCollapsibleTrigger>) {
  const rest = omit(props, "class")
  return (
    <SdkCollapsibleTrigger
      {...rest}
      class={
        cx(
          "inline-flex items-center gap-1.5 text-xs font-medium text-text-2 transition-colors hover:text-text cursor-pointer",
          props.class,
        ) as never
      }
    />
  )
}
