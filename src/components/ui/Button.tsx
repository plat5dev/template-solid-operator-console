import { Button as SdkButton } from "@ui-sdk/solid/button"
import type { ComponentProps } from "@solidjs/web"
import { omit } from "solid-js"
import { cx } from "./className"

export type ButtonVariant = "default" | "primary" | "danger" | "ghost"
export type ButtonSize = "sm" | "md" | "lg"

const variantClasses: Record<ButtonVariant, string> = {
  default: "border-rule-strong bg-surface text-text hover:border-text-2",
  primary: "border-accent bg-accent text-on-accent hover:bg-accent-hover hover:border-accent-hover",
  danger: "border-rule-strong bg-surface text-danger hover:border-danger hover:bg-danger-wash",
  ghost: "border-transparent bg-transparent text-text-2 hover:bg-surface-2 hover:text-text",
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3.5 py-1.5 text-sm",
  lg: "px-4.5 py-2.5 text-[0.9375rem]",
}

export function buttonClass(variant: ButtonVariant = "default", size: ButtonSize = "md", block = false): string {
  return [
    "inline-flex items-center justify-center gap-1.5 rounded-md border font-medium leading-snug whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 disabled:pointer-events-none data-pending:opacity-65 no-underline",
    variantClasses[variant],
    sizeClasses[size],
    block ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ")
}

export type ButtonProps = ComponentProps<typeof SdkButton> & {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
}

export function Button(props: ButtonProps) {
  const rest = omit(props, "variant", "size", "block", "class")
  return (
    <SdkButton
      {...rest}
      class={cx(buttonClass(props.variant ?? "default", props.size ?? "md", props.block ?? false), props.class) as never}
    />
  )
}
