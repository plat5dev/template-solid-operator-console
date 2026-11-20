import type { JSX } from "@solidjs/web"
import { Link } from "@tanstack/solid-router"
import { For, Show } from "solid-js"
import type { Node } from "../api/identity"
import { plural } from "../api/kinds"
import { Icon } from "./icons"

/** A node's chain as breadcrumbs, from its `ancestors`: the roots list, each ancestor,
 *  then the node. `tail` follows the node, turning the node into a link. */
export function NodeCrumbs(props: { node: Node; tail?: JSX.Element }) {
  const rootKind = () => props.node.ancestors[0]?.kind ?? props.node.kind

  return (
    <>
      <Link
        to="/nodes"
        search={{ kind: rootKind() }}
        class="text-muted transition-colors hover:text-text no-underline hover:underline underline-offset-2"
      >
        {plural(rootKind())}
      </Link>
      <For each={props.node.ancestors}>
        {(a) => (
          <>
            <Icon name="chevronRight" class="h-3 w-3 text-muted/70" />
            <Link
              to="/nodes/$nodeId"
              params={{ nodeId: a.id }}
              class="text-muted transition-colors hover:text-text no-underline hover:underline underline-offset-2"
            >
              {a.display_name}
            </Link>
          </>
        )}
      </For>
      <Icon name="chevronRight" class="h-3 w-3 text-muted/70" />
      <Show
        when={props.tail}
        fallback={<span class="font-medium text-text-2">{props.node.display_name}</span>}
      >
        <Link
          to="/nodes/$nodeId"
          params={{ nodeId: props.node.id }}
          class="text-muted transition-colors hover:text-text no-underline hover:underline underline-offset-2"
        >
          {props.node.display_name}
        </Link>
        <Icon name="chevronRight" class="h-3 w-3 text-muted/70" />
        <span class="font-medium text-text-2">{props.tail}</span>
      </Show>
    </>
  )
}
