import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query"
import { Link, useNavigate, useParams } from "@tanstack/solid-router"
import { createSignal, Match, Show, Switch } from "solid-js"
import { api, hasCode, path } from "../api/client"
import { writable, type ServiceAccount } from "../api/identity"
import { queries, queryKeys } from "../api/queries"
import { ErrorAlert } from "../components/ErrorAlert"
import { KeysTable } from "../components/KeysTable"
import { NodeCrumbs } from "../components/NodeCrumbs"
import {
  Card,
  CardBody,
  DetailList,
  DetailRow,
  Id,
  LoadingState,
  PageHead,
  When,
} from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import {
  Dialog,
  DialogBackdrop,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/Dialog"
import { Field, FieldLabel, Input } from "../components/ui/Field"
import { confirm, toast } from "../components/ui/overlays"

/** A service account, by the node it belongs to: rename, delete, and revoke its keys while writable. */
export function ServiceAccountPage() {
  const params = useParams({ strict: false }) as () => { nodeId?: string; serviceAccountId?: string }
  const nodeId = () => params().nodeId ?? ""
  const saId = () => params().serviceAccountId ?? ""
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const base = () => path`/services/identity/nodes/${nodeId()}/service-accounts/${saId()}`
  const nodeQuery = useQuery(() => queries.node(nodeId()))
  const saQuery = useQuery(() => queries.serviceAccount(nodeId(), saId()))

  const [renameOpen, setRenameOpen] = createSignal(false)
  const [draftName, setDraftName] = createSignal("")
  const [error, setError] = createSignal<unknown>(null)

  const canWrite = () => nodeQuery.isSuccess && writable(nodeQuery.data)

  function onWriteError(err: unknown) {
    if (hasCode(err, "NODE_PURGED")) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.node(nodeId()) })
    }
    setError(err)
  }

  const renameMutation = useMutation(() => ({
    mutationFn: (name: string) => api<ServiceAccount>("PATCH", base(), { name }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(queryKeys.serviceAccount(nodeId(), saId()), updated)
      setRenameOpen(false)
      setError(null)
      toast.success("Service account renamed")
      await queryClient.invalidateQueries({ queryKey: queryKeys.serviceAccounts(nodeId()) })
    },
    onError: onWriteError,
  }))

  const deleteMutation = useMutation(() => ({
    mutationFn: () => api("DELETE", base()),
    onSuccess: async () => {
      setError(null)
      toast.success("Service account deleted")
      await queryClient.invalidateQueries({ queryKey: queryKeys.serviceAccounts(nodeId()) })
      void navigate({
        to: "/nodes/$nodeId/service-accounts",
        params: { nodeId: nodeId() },
        replace: true,
      })
    },
    onError: onWriteError,
  }))

  function onRenameSubmit(e: SubmitEvent) {
    e.preventDefault()
    const trimmed = draftName().trim()
    if (!trimmed) return
    setError(null)
    void renameMutation.mutate(trimmed)
  }

  async function onDelete() {
    const yes = await confirm({
      title: "Delete this service account?",
      description: "Its API keys will be deleted and its member removed from the tree.",
      confirmLabel: "Delete service account",
      danger: true,
    })
    if (!yes) return
    setError(null)
    void deleteMutation.mutate()
  }

  return (
    <Switch>
      <Match when={saQuery.isPending}>
        <LoadingState />
      </Match>
      <Match when={saQuery.isError}>
        <ErrorAlert error={saQuery.error} />
      </Match>
      <Match when={saQuery.isSuccess}>
        {(() => {
          const s = () => saQuery.data!
          return (
            <>
              <PageHead
                crumbs={nodeQuery.isSuccess && <NodeCrumbs node={nodeQuery.data} tail="Service account" />}
                eyebrow={<Id value={s().id} copy />}
                title={s().name}
                actions={
                  <Show when={canWrite()}>
                    <Button
                      size="sm"
                      onClick={() => {
                        setError(null)
                        setDraftName(s().name)
                        setRenameOpen(true)
                      }}
                    >
                      Rename
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={deleteMutation.isPending}
                      onClick={() => void onDelete()}
                    >
                      Delete
                    </Button>
                  </Show>
                }
              />

              <ErrorAlert error={error()} onDismiss={() => setError(null)} />

              <Card>
                <CardBody>
                  <DetailList>
                    <DetailRow label="Member">
                      <Show when={nodeQuery.isSuccess} fallback={<Id value={s().id} copy />}>
                        <Link
                          to="/nodes/$nodeId/members/$memberId"
                          params={{ nodeId: nodeQuery.data!.root_id, memberId: s().id }}
                          class="font-mono text-xs text-accent-text hover:underline underline-offset-2"
                        >
                          {s().id}
                        </Link>
                      </Show>
                    </DetailRow>
                    <DetailRow label="Belongs to">
                      <Link
                        to="/nodes/$nodeId"
                        params={{ nodeId: s().node_id }}
                        class="font-medium text-accent-text hover:underline underline-offset-2"
                      >
                        {nodeQuery.isSuccess ? nodeQuery.data.display_name : s().node_id}
                      </Link>
                    </DetailRow>
                    <DetailRow label="Created">
                      <span class="text-xs text-text-2">
                        <When at={s().created_at} />
                      </span>
                    </DetailRow>
                    <DetailRow label="Updated">
                      <span class="text-xs text-text-2">
                        <When at={s().updated_at} />
                      </span>
                    </DetailRow>
                  </DetailList>
                </CardBody>
              </Card>

              <section class="space-y-3">
                <h2 class="text-sm font-semibold text-text">API keys</h2>
                <KeysTable
                  base={base() + "/keys"}
                  canRevoke={canWrite()}
                  onPurged={() => void queryClient.invalidateQueries({ queryKey: queryKeys.node(nodeId()) })}
                />
              </section>

              <Dialog open={renameOpen()} onOpenChange={setRenameOpen}>
                <DialogBackdrop />
                <DialogContent>
                  <form onSubmit={onRenameSubmit}>
                    <DialogHeader>
                      <DialogTitle>Rename service account</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                      <ErrorAlert error={error()} onDismiss={() => setError(null)} />
                      <Field name="sa_name">
                        <FieldLabel>Name</FieldLabel>
                        <Input
                          value={draftName()}
                          onValueChange={setDraftName}
                          maxlength={128}
                          required
                          autofocus
                        />
                      </Field>
                    </DialogBody>
                    <DialogFooter>
                      <DialogClose>Cancel</DialogClose>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={
                          renameMutation.isPending ||
                          !draftName().trim() ||
                          draftName().trim() === s().name
                        }
                      >
                        {renameMutation.isPending ? "Saving…" : "Save"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )
        })()}
      </Match>
    </Switch>
  )
}
