import type { JSX } from "@solidjs/web"
import { useLocation } from "@tanstack/solid-router"
import { createSignal, Show } from "solid-js"
import { useAuth } from "../auth/AuthContext"
import { ErrorAlert } from "./ErrorAlert"
import { Button } from "./ui/Button"
import { Card, CardBody } from "./ui/Badge"

/** Requires an operator session before rendering the protected route. */
export function RequireAuth(props: { children: JSX.Element }) {
  const { session, login } = useAuth()
  const location = useLocation()
  const [error, setError] = createSignal<unknown>(null)

  return (
    <Show
      when={session()}
      fallback={
        <div class="grid min-h-[55vh] place-items-center py-8">
          <Card class="w-[min(26rem,100%)]">
            <CardBody>
              <div class="space-y-1">
                <p class="font-mono text-xs text-accent-text">operator plane</p>
                <h1 class="text-lg font-semibold tracking-tight text-text">Sign in required</h1>
              </div>
              <p class="text-sm text-text-2">
                Sign in with your operator IdP to continue to{" "}
                <code class="rounded bg-surface-2 px-1 py-0.5 text-xs text-text">{location().pathname}</code>.
              </p>
              <ErrorAlert error={error()} onDismiss={() => setError(null)} />
              <Button
                variant="primary"
                size="lg"
                block
                onClick={() => {
                  setError(null)
                  void login(location().href).catch(setError)
                }}
              >
                Sign in with your operator IdP
              </Button>
            </CardBody>
          </Card>
        </div>
      }
    >
      {props.children}
    </Show>
  )
}
