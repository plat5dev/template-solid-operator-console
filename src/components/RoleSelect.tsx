import { For } from "solid-js"
import type { Role } from "../api/identity"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select"

function summary(r: Role): string {
  if (r.permissions.includes("*")) return "every permission"
  if (r.permissions.length === 0) return "no permissions"
  return r.permissions.join(", ")
}

/**
 * Picks a role bindable at a node (`GET /nodes/{id}/roles`), built on `@ui-sdk/solid/select`.
 * Shows each role's resolved permissions right in the dropdown.
 */
export function RoleSelect(props: {
  roles: Role[]
  value: string
  onChange: (role: string) => void
  disabled?: boolean
  size?: "sm" | "md"
  ariaLabel?: string
  placeholder?: string
}) {
  const items = () => props.roles.map((r) => ({ value: r.slug, label: r.display_name || r.slug }))

  return (
    <Select
      items={items()}
      value={props.value || null}
      disabled={props.disabled}
      onValueChange={(next) => {
        if (next !== null) props.onChange(next)
      }}
    >
      <SelectTrigger size={props.size ?? "md"} aria-label={props.ariaLabel ?? "Role"}>
        <SelectValue placeholder={props.placeholder ?? "Choose a role"} />
      </SelectTrigger>
      <SelectContent>
        <For each={props.roles}>
          {(r) => (
            <SelectItem value={r.slug}>
              <div class="min-w-0">
                <div class="font-medium text-text">
                  {r.display_name || r.slug}
                  {r.source === "custom" ? " (custom)" : ""}
                </div>
                <div class="truncate font-mono text-[0.6875rem] text-muted">{summary(r)}</div>
              </div>
            </SelectItem>
          )}
        </For>
      </SelectContent>
    </Select>
  )
}
