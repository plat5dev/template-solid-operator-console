import { useNavigate } from "@tanstack/solid-router"
import { createSignal, onSettled, Show } from "solid-js"
import { useAuth } from "../auth/AuthContext"
import { completeLogin } from "../auth/oidc"
import { ErrorAlert } from "../components/ErrorAlert"
import { Card, CardBody, LoadingState } from "../components/ui/Badge"
import { buttonClass } from "../components/ui/Button"

/** Completes the OIDC / OAuth 2.0 authorization code + PKCE exchange on `/callback`. */
export function CallbackPage() {
  const { refresh } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = createSignal<unknown>(null)

  onSettled(() => {
    void completeLogin(window.location.href)
      .then((returnTo) => {
        refresh()
        const target = returnTo && returnTo.startsWith("/") ? returnTo : "/"
        void navigate({ to: target as never, replace: true })
      })
      .catch((err: unknown) => {
        setError(err)
      })
  })

  return (
    <Show when={error()} fallback={<LoadingState full>Completing sign-in…</LoadingState>}>
      <div class="grid min-h-[60vh] place-items-center py-8">
        <Card class="w-[min(26rem,100%)]">
          <CardBody>
            <h1 class="text-lg font-semibold tracking-tight text-text">Sign-in failed</h1>
            <ErrorAlert error={error()} />
            <div class="flex flex-wrap items-center gap-2">
              <a class={buttonClass("primary")} href="/">
                Back to home
              </a>
            </div>
          </CardBody>
        </Card>
      </div>
    </Show>
  )
}
