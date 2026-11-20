import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query"
import { Link, useParams } from "@tanstack/solid-router"
import { createSignal, For, Match, Show, Switch } from "solid-js"
import { api, hasCode, path } from "../api/client"
import { writable } from "../api/identity"
import { queries, queryKeys } from "../api/queries"
import { ErrorAlert } from "../components/ErrorAlert"
import { NodeCrumbs } from "../components/NodeCrumbs"
import {
  Card,
  CardBody,
  CardHead,
  Chip,
  DetailList,
  DetailRow,
  EmptyState,
  Id,
  LoadingState,
  PageHead,
  Status,
} from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { confirm, toast } from "../components/ui/overlays"

/** A member of a tree, by its root: who it is, what it holds at the root, and removal while writable. */
export function MemberPage() {
  const params = useParams({ strict: false }) as () => { nodeId?: string; memberId?: string }
  const nodeId = () => params().nodeId ?? ""
  const memberId = () => params().memberId ?? ""
  const queryClient = useQueryClient()

  const rootQuery = useQuery(() => queries.node(nodeId()))
  const memberQuery = useQuery(() => queries.member(nodeId(), memberId()))
  const [error, setError] = createSignal<unknown>(null)

  const removeMutation = useMutation(() => ({
    mutationFn: () => api("DELETE", path`/nodes/${nodeId()}/members/${memberId()}`),
    onSuccess: async () => {
      setError(null)
      toast.success("Member removed")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.member(nodeId(), memberId()) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.members(nodeId()) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.membersSample(nodeId()) }),
      ])
    },
    onError: (err) => {
      if (hasCode(err, "NODE_PURGED")) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.node(nodeId()) })
      }
      setError(err)
    },
  }))

  async function onRemove() {
    const yes = await confirm({
      title: "Remove this member from the tree?",
      description: "All of their bindings in this tree will be deleted. Removal is final.",
      confirmLabel: "Remove member",
      danger: true,
    })
    if (!yes) return
    setError(null)
    void removeMutation.mutate()
  }

  return (
    <Switch>
      <Match when={memberQuery.isPending}>
        <LoadingState />
      </Match>
      <Match when={memberQuery.isError}>
        <ErrorAlert error={memberQuery.error} />
      </Match>
      <Match when={memberQuery.isSuccess}>
        {(() => {
          const m = () => memberQuery.data!
          const canRemove = () =>
            m().status === "active" &&
            m().principal === "person" &&
            rootQuery.isSuccess &&
            writable(rootQuery.data)

          return (
            <>
              <PageHead
                crumbs={rootQuery.isSuccess && <NodeCrumbs node={rootQuery.data} tail="Member" />}
                eyebrow={<Id value={m().id} copy />}
                title={
                  <span class="inline-flex flex-wrap items-center gap-2.5">
                    <span>{m().name ?? "Member"}</span>
                    <Status value={m().status} />
                  </span>
                }
                actions={
                  <Show when={canRemove()}>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={removeMutation.isPending}
                      onClick={() => void onRemove()}
                    >
                      Remove member
                    </Button>
                  </Show>
                }
              />

              <ErrorAlert error={error()} onDismiss={() => setError(null)} />

              <Card>
                <CardBody>
                  <DetailList>
                    <DetailRow label="Member ID">
                      <Id value={m().id} copy />
                    </DetailRow>
                    <DetailRow label="Principal">
                      <Show when={m().principal === "person"} fallback="service account">
                        <span class="inline-flex flex-wrap items-center gap-2">
                          <span>person</span>
                          <PersonLink memberId={m().id} />
                        </span>
                      </Show>
                    </DetailRow>
                    <DetailRow label="Guest">
                      {m().guest ? "yes — bound only below the root" : "no"}
                    </DetailRow>
                    <DetailRow label="Status">
                      <Status value={m().status} />
                    </DetailRow>
                  </DetailList>
                </CardBody>
              </Card>

              <Show when={m().status === "active"}>
                <AtRoot rootId={nodeId()} memberId={m().id} />
              </Show>
            </>
          )
        })()}
      </Match>
    </Switch>
  )
}

/** The person behind a member (`GET /members/{member_id}/user`). Gone once deleted. */
function PersonLink(props: { memberId: string }) {
  const personQuery = useQuery(() => queries.memberUser(props.memberId))

  return (
    <Show when={!personQuery.isPending}>
      <Show
        when={personQuery.isSuccess}
        fallback={<span class="text-xs text-muted">(account deleted)</span>}
      >
        <Link
          to="/users/$userId"
          params={{ userId: personQuery.data!.id }}
          class="font-medium text-accent-text hover:underline underline-offset-2"
        >
          {personQuery.data!.name ?? personQuery.data!.id}
        </Link>
      </Show>
    </Show>
  )
}

/** What the member holds at the root (`GET /nodes/{root_id}/memberships/{member_id}`). */
function AtRoot(props: { rootId: string; memberId: string }) {
  const membershipQuery = useQuery(() => queries.membership(props.rootId, props.memberId))

  return (
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-text">At the root</h2>
      <Switch>
        <Match when={membershipQuery.isPending}>
          <LoadingState />
        </Match>
        <Match when={membershipQuery.isError}>
          <ErrorAlert error={membershipQuery.error} />
        </Match>
        <Match when={membershipQuery.isSuccess}>
          <Show
            when={membershipQuery.data!.bindings.length > 0}
            fallback={
              <EmptyState
                title="No binding at the root"
                description="Bindings below the root are listed on each node's Bindings tab."
              />
            }
          >
            <Card>
              <CardHead>
                <span class="text-xs font-medium text-muted">Effective root access</span>
              </CardHead>
              <CardBody>
                <DetailList>
                  <DetailRow label="Roles">
                    <div class="flex flex-wrap gap-1.5">
                      <For each={membershipQuery.data!.bindings}>
                        {(b) => <Chip>{b.role}</Chip>}
                      </For>
                    </div>
                  </DetailRow>
                  <DetailRow label="Permissions">
                    <div class="flex flex-wrap gap-1.5">
                      <For each={membershipQuery.data!.permissions}>
                        {(p) => <Chip>{p}</Chip>}
                      </For>
                    </div>
                  </DetailRow>
                </DetailList>
              </CardBody>
            </Card>
          </Show>
        </Match>
      </Switch>
    </section>
  )
}
