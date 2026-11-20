import {
  Drawer as SdkDrawer,
  DrawerBackdrop as SdkDrawerBackdrop,
  DrawerClose as SdkDrawerClose,
  DrawerContent as SdkDrawerContent,
  DrawerDescription as SdkDrawerDescription,
  DrawerTitle as SdkDrawerTitle,
  DrawerTrigger as SdkDrawerTrigger,
  createDrawerController,
} from "@ui-sdk/solid/drawer"
import type { ComponentProps } from "@solidjs/web"
import { omit } from "solid-js"
import { cx } from "./className"

export {
  SdkDrawer as Drawer,
  SdkDrawerClose as DrawerClose,
  SdkDrawerDescription as DrawerDescription,
  SdkDrawerTitle as DrawerTitle,
  SdkDrawerTrigger as DrawerTrigger,
  createDrawerController,
}

export function DrawerBackdrop(props: ComponentProps<typeof SdkDrawerBackdrop>) {
  const rest = omit(props, "class")
  return <SdkDrawerBackdrop {...rest} class={cx("fixed inset-0 z-40 bg-black/45", props.class) as never} />
}

export function DrawerContent<Payload = unknown>(props: ComponentProps<typeof SdkDrawerContent<Payload>>) {
  const rest = omit(props, "class")
  return (
    <SdkDrawerContent<Payload>
      {...rest}
      class={
        cx(
          "z-50 flex h-dvh w-[min(17.5rem,85vw)] flex-col border-rule bg-surface text-text shadow-pop data-[side=left]:border-r data-[side=right]:border-l",
          props.class,
        ) as never
      }
    />
  )
}
