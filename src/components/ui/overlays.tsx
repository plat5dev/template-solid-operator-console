import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  createConfirm,
} from "@ui-sdk/solid/alert-dialog"
import { createOverlays, OverlayHost } from "@ui-sdk/solid/overlays"
import {
  createToaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastTitle,
} from "@ui-sdk/solid/toast"
import { Show } from "solid-js"

export type ConfirmInput = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

const overlays = createOverlays()

/** App-wide toast notifications (rendered by `<AppOverlays />`). */
export const toast = createToaster({ overlays, duration: 4000 })

/** App-wide confirmation dialog (`await confirm({ title, description, ... })`). */
export const confirm = createConfirm<ConfirmInput>({ overlays })

/** Mount once near the app root to render toasts and confirmation alert dialogs. */
export function AppOverlays() {
  return (
    <>
      <OverlayHost
        overlays={overlays}
        toast={{
          side: "bottom",
          align: "end",
          maxVisible: 3,
          children: () => (
            <Toast class="flex items-start gap-3 rounded-lg border border-rule bg-surface px-3.5 py-2.5 text-sm text-text shadow-pop data-[type=error]:border-danger/60 data-[type=success]:border-ok/50">
              <div class="min-w-0 flex-1 space-y-0.5">
                <ToastTitle class="font-medium text-text" />
                <ToastDescription class="text-xs text-text-2" />
              </div>
              <ToastAction class="shrink-0 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-on-accent hover:bg-accent-hover cursor-pointer" />
              <ToastClose
                aria-label="Dismiss"
                class="shrink-0 rounded p-0.5 text-muted hover:bg-surface-2 hover:text-text cursor-pointer"
              >
                ×
              </ToastClose>
            </Toast>
          ),
        }}
      />

      <AlertDialog controller={confirm.controller}>
        <AlertDialogBackdrop class="fixed inset-0 z-50 bg-black/45 transition-opacity duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0" />
        <AlertDialogContent<ConfirmInput> class="fixed top-1/2 left-1/2 z-50 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-rule bg-surface p-0 text-text shadow-pop transition-[opacity,scale] duration-150 data-starting-style:scale-96 data-starting-style:opacity-0 data-ending-style:scale-96 data-ending-style:opacity-0">
          {(state) => (
            <div>
              <div class="space-y-2 p-5">
                <AlertDialogTitle class="text-base font-semibold tracking-tight text-text">
                  {state.payload?.title}
                </AlertDialogTitle>
                <Show when={state.payload?.description}>
                  <AlertDialogDescription class="text-sm text-text-2">
                    {state.payload?.description}
                  </AlertDialogDescription>
                </Show>
              </div>
              <div class="flex items-center justify-end gap-2 border-t border-rule px-5 py-3.5">
                <AlertDialogClose class="inline-flex items-center justify-center rounded-md border border-rule-strong bg-surface px-3 py-1.5 text-sm font-medium text-text transition-colors hover:border-text-2 cursor-pointer">
                  {state.payload?.cancelLabel ?? "Cancel"}
                </AlertDialogClose>
                <AlertDialogClose
                  value="confirm"
                  class={[
                    "inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                    state.payload?.danger
                      ? "border-danger bg-danger text-white hover:opacity-90"
                      : "border-accent bg-accent text-on-accent hover:bg-accent-hover",
                  ]}
                >
                  {state.payload?.confirmLabel ?? "Confirm"}
                </AlertDialogClose>
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
