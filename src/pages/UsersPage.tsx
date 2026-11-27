import { useQuery } from "@tanstack/solid-query"
import { Link, useLocation, useNavigate } from "@tanstack/solid-router"
import { createEffect, createMemo, createSignal, For, Match, Show, Switch } from "solid-js"
import { queries } from "../api/queries"
import { ErrorAlert } from "../components/ErrorAlert"
import {
  Card,
  CardBody,
  CardHead,
  EmptyState,
  Id,
  LoadingState,
  PageHead,
  Status,
} from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { Field, FieldLabel, Input } from "../components/ui/Field"

/** Find a person by exact IdP link (`GET /users?issuer=&subject=`), or jump straight to a user by ID. */
export function UsersPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const search = createMemo(() => location().search as { issuer?: string; subject?: string })

  const [issuer, setIssuer] = createSignal(search().issuer ?? "")
  const [subject, setSubject] = createSignal(search().subject ?? "")
  const [userId, setUserId] = createSignal("")

  createEffect(
    () => [search().issuer, search().subject] as const,
    ([iss, sub]) => {
      if (iss !== undefined) setIssuer(iss)
      if (sub !== undefined) setSubject(sub)
    },
  )

  const asked = createMemo(() => Boolean(search().issuer && search().subject))

  function onFind(e: SubmitEvent) {
    e.preventDefault()
    void navigate({
      to: "/users",
      search: { issuer: issuer().trim(), subject: subject().trim() },
    })
  }

  function onOpen(e: SubmitEvent) {
    e.preventDefault()
    const id = userId().trim()
    if (!id) return
    void navigate({ to: "/users/$userId", params: { userId: id } })
  }

  return (
    <>
      <PageHead
        eyebrow="/services/identity/users"
        title="Users"
        lede="People aren't listed in bulk. Look someone up by their IdP issuer and subject, or open directly by user ID."
      />

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHead>
            <h2 class="text-sm font-semibold text-text">Lookup by IdP link</h2>
          </CardHead>
          <CardBody>
            <form onSubmit={onFind} class="space-y-3">
              <Field name="lookup_issuer">
                <FieldLabel>IdP issuer</FieldLabel>
                <Input
                  mono
                  value={issuer()}
                  onValueChange={setIssuer}
                  placeholder="https://…"
                  required
                />
              </Field>
              <Field name="lookup_subject">
                <FieldLabel>IdP subject</FieldLabel>
                <Input
                  mono
                  value={subject()}
                  onValueChange={setSubject}
                  placeholder="sub claim"
                  required
                />
              </Field>
              <div class="flex items-center gap-2 pt-1">
                <Button type="submit" variant="primary" size="sm">
                  Find person
                </Button>
                <Show when={asked()}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIssuer("")
                      setSubject("")
                      void navigate({ to: "/users", search: {} })
                    }}
                  >
                    Clear
                  </Button>
                </Show>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHead>
            <h2 class="text-sm font-semibold text-text">Open by user ID</h2>
          </CardHead>
          <CardBody>
            <form onSubmit={onOpen} class="space-y-3">
              <Field name="open_user_id">
                <FieldLabel>User ID</FieldLabel>
                <Input
                  mono
                  value={userId()}
                  onValueChange={setUserId}
                  placeholder="01j…"
                  required
                />
              </Field>
              <div class="pt-1">
                <Button type="submit" size="sm" disabled={!userId().trim()}>
                  Open user
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>

      <Show when={asked()}>
        <FoundUsers issuer={search().issuer!} subject={search().subject!} />
      </Show>
    </>
  )
}

function FoundUsers(props: { issuer: string; subject: string }) {
  const foundQuery = useQuery(() => queries.usersLookup(props.issuer, props.subject))

  return (
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-text">Lookup results</h2>
      <Switch>
        <Match when={foundQuery.isPending}>
          <LoadingState />
        </Match>
        <Match when={foundQuery.isError}>
          <ErrorAlert error={foundQuery.error} />
        </Match>
        <Match when={foundQuery.isSuccess && foundQuery.data.length === 0}>
          <EmptyState title="Nobody with that IdP link" />
        </Match>
        <Match when={foundQuery.isSuccess}>
          <div class="overflow-x-auto rounded-xl border border-rule bg-surface">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-rule text-left font-mono text-[0.71875rem] font-medium text-muted">
                  <th class="px-4 py-2.5 font-medium">name</th>
                  <th class="px-4 py-2.5 font-medium">id</th>
                  <th class="px-4 py-2.5 font-medium">status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-rule">
                <For each={foundQuery.data}>
                  {(u) => (
                    <tr class="transition-colors hover:bg-surface-2/50">
                      <td class="px-4 py-3">
                        <Link
                          to="/users/$userId"
                          params={{ userId: u.id }}
                          class="font-medium text-text hover:text-accent-text hover:underline underline-offset-2"
                        >
                          {u.name ?? <span class="font-normal text-muted">(no name yet)</span>}
                        </Link>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <Id value={u.id} />
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <Status value={u.status} />
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Match>
      </Switch>
    </section>
  )
}
