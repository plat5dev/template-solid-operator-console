import { useQuery } from "@tanstack/solid-query"
import { Link, useNavigate } from "@tanstack/solid-router"
import { createMemo, For, Show } from "solid-js"
import { asMember } from "../api/client"
import type { Member, Node } from "../api/identity"
import { queries } from "../api/queries"
import { useMemberNames } from "../api/useMemberNames"
import { Button } from "./ui/Button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./ui/Combobox"

function memberLabel(m: Member): string {
  const base = m.name ?? m.id
  return m.principal === "service_account" ? `${base} (service account)` : base
}

/**
 * Acting as a member on routes that allow `/as/{member_id}/…`.
 * - When active, renders a prominent amber warning banner with a Stop button.
 * - When inactive, renders a searchable Combobox inline in the tab toolbar.
 */
export function ActAsBanner(props: { node: Node; memberId?: string; at: string }) {
  const navigate = useNavigate()
  const names = useMemberNames(() =>
    props.memberId ? [{ rootId: props.node.root_id, memberId: props.memberId }] : [],
  )

  return (
    <Show when={props.memberId}>
      {(mid) => {
        const name = () => names().get(mid())?.name
        return (
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warn/50 border-l-[3px] border-l-accent bg-warn-wash px-4 py-2.5 text-sm text-text">
            <div class="min-w-0 leading-relaxed">
              Acting as{" "}
              <Link
                to="/nodes/$nodeId/members/$memberId"
                params={{ nodeId: props.node.root_id, memberId: mid() }}
                class="font-medium text-accent-text hover:underline underline-offset-2"
              >
                {name() ?? <code class="text-xs">{mid()}</code>}
              </Link>
              : requests go to <code class="rounded bg-surface-2 px-1 py-0.5 text-xs">/as/{mid()}</code> and the
              service sees that member. Access is still yours.
            </div>
            <Button
              size="sm"
              onClick={() => void navigate({ to: props.at as never })}
            >
              Stop acting as
            </Button>
          </div>
        )
      }}
    </Show>
  )
}

export function ActAsPicker(props: { node: Node; memberId?: string; at: string }) {
  const navigate = useNavigate()
  const membersQuery = useQuery(() => ({
    ...queries.membersSample(props.node.root_id),
    enabled: !props.memberId,
  }))

  const items = createMemo(() =>
    (membersQuery.isSuccess ? membersQuery.data : []).map((m) => ({
      value: m.id,
      label: memberLabel(m),
      keywords: [m.id, m.principal],
      member: m,
    })),
  )

  return (
    <Show when={!props.memberId}>
      <div class="w-56">
        <Combobox
          items={items()}
          value={null}
          onValueChange={(next) => {
            if (typeof next === "string" && next) {
              void navigate({ to: asMember(next, props.at) as never })
            }
          }}
        >
          <ComboboxInput
            size="sm"
            aria-label="Act as a member"
            placeholder="Act as member…"
          />
          <ComboboxContent>
            <ComboboxList>
              <For each={items()}>
                {(item) => (
                  <ComboboxItem value={item.value}>
                    <div class="min-w-0">
                      <div class="truncate text-xs font-medium text-text">{item.label}</div>
                      <div class="truncate font-mono text-[0.6875rem] text-muted">{item.member.id}</div>
                    </div>
                  </ComboboxItem>
                )}
              </For>
              <ComboboxEmpty>No matching members</ComboboxEmpty>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </Show>
  )
}
