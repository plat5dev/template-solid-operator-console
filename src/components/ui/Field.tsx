import {
  Field as SdkField,
  FieldDescription as SdkFieldDescription,
  FieldError as SdkFieldError,
  FieldLabel as SdkFieldLabel,
} from "@ui-sdk/solid/field"
import { Input as SdkInput } from "@ui-sdk/solid/input"
import { Textarea as SdkTextarea } from "@ui-sdk/solid/textarea"
import type { ComponentProps } from "@solidjs/web"
import { omit } from "solid-js"
import { cx } from "./className"

export function Field(props: ComponentProps<typeof SdkField>) {
  const rest = omit(props, "class")
  return <SdkField {...rest} class={cx("grid min-w-0 gap-1.5", props.class) as never} />
}

export function FieldLabel(props: ComponentProps<typeof SdkFieldLabel>) {
  const rest = omit(props, "class")
  return <SdkFieldLabel {...rest} class={cx("text-xs font-medium text-text", props.class) as never} />
}

export function FieldDescription(props: ComponentProps<typeof SdkFieldDescription>) {
  const rest = omit(props, "class")
  return <SdkFieldDescription {...rest} class={cx("text-xs text-muted", props.class) as never} />
}

export function FieldError(props: ComponentProps<typeof SdkFieldError>) {
  const rest = omit(props, "class")
  return <SdkFieldError {...rest} class={cx("text-xs text-danger", props.class) as never} />
}

export type InputProps = ComponentProps<typeof SdkInput> & {
  size?: "sm" | "md"
  mono?: boolean
}

export function Input(props: InputProps) {
  const rest = omit(props, "class", "size", "mono")
  const base = () =>
    [
      "w-full min-w-0 rounded-md border border-rule-strong bg-field text-text placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent-wash disabled:opacity-55 read-only:bg-surface-2/60",
      props.size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
      props.mono ? "font-mono text-xs" : "",
    ]
      .filter(Boolean)
      .join(" ")

  return <SdkInput {...rest} class={cx(base(), props.class) as never} />
}

export type TextareaProps = ComponentProps<typeof SdkTextarea> & {
  mono?: boolean
}

export function Textarea(props: TextareaProps) {
  const rest = omit(props, "class", "mono")
  const base = () =>
    [
      "w-full min-w-0 resize-y rounded-md border border-rule-strong bg-field px-3 py-2 text-sm text-text placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent-wash disabled:opacity-55",
      props.mono ? "font-mono text-xs" : "",
    ]
      .filter(Boolean)
      .join(" ")

  return <SdkTextarea {...rest} class={cx(base(), props.class) as never} />
}
