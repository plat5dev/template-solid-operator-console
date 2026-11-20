import { createSignal, Show } from "solid-js"
import { useAuth } from "../auth/AuthContext"
import { ErrorAlert } from "../components/ErrorAlert"
import { Card, CardBody, CardHead, DetailList, DetailRow } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { config } from "../config"
import { NodesPage } from "./NodesPage"

export function HomePage() {
  const { session, login } = useAuth()
  const [error, setError] = createSignal<unknown>(null)

  return (
    <Show
      when={!session()}
      fallback={<NodesPage />}
    >
      <div class="mx-auto max-w-xl space-y-6 py-8 sm:py-14">
        <section class="space-y-4">
          <p class="font-mono text-xs font-medium text-accent-text">operator console</p>
          <h1 class="text-3xl font-semibold tracking-tight text-text leading-tight">
            Every tree and person, for the people who run this deployment
          </h1>
          <p class="text-sm leading-relaxed text-text-2">
            Every page calls the operator gateway with your operator token. The gateway enforces access and records
            every request in the operator log; this console holds no secrets.
          </p>
          <ErrorAlert error={error()} onDismiss={() => setError(null)} />
          <div class="pt-1">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setError(null)
                void login("/").catch(setError)
              }}
            >
              Sign in with your operator IdP
            </Button>
          </div>
        </section>

        <Card>
          <CardHead>
            <h2 class="text-sm font-semibold text-text">Connection</h2>
          </CardHead>
          <CardBody>
            <DetailList>
              <DetailRow label="Gateway">
                <code class="text-xs text-text-2 break-all">{config.gatewayUrl}</code>
              </DetailRow>
              <DetailRow label="Issuer">
                <code class="text-xs text-text-2 break-all">{config.issuer}</code>
              </DetailRow>
              <DetailRow label="Client">
                <code class="text-xs text-text-2 break-all">{config.clientId}</code>
              </DetailRow>
            </DetailList>
          </CardBody>
        </Card>
      </div>
    </Show>
  )
}
