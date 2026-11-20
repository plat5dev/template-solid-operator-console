import { useQuery, useQueryClient } from "@tanstack/solid-query"
import { createMemo, type Accessor } from "solid-js"
import type { Member } from "./identity"
import { queries } from "./queries"

export type MemberRef = { rootId: string; memberId: string }
export type MemberName = { name: string | null; serviceAccount: boolean }

/**
 * Resolves display names for a set of `{ rootId, memberId }` references via TanStack Query.
 * Each individual member lookup is cached under its `queries.member` key and cleared on logout.
 */
export function useMemberNames(refs: Accessor<MemberRef[]>): Accessor<Map<string, MemberName>> {
  const queryClient = useQueryClient()

  const uniqueKeys = createMemo(() => {
    const seen = new Set<string>()
    for (const r of refs()) {
      if (r.rootId && r.memberId) seen.add(`${r.rootId}/${r.memberId}`)
    }
    return [...seen].sort()
  })

  const query = useQuery(() => ({
    queryKey: ["member-names", uniqueKeys()] as const,
    queryFn: async () => {
      const entries = await Promise.all(
        uniqueKeys().map(async (k): Promise<[string, MemberName]> => {
          const [rootId, memberId] = k.split("/") as [string, string]
          try {
            const m: Member = await queryClient.fetchQuery({
              ...queries.member(rootId, memberId),
              staleTime: 5 * 60_000,
            })
            return [memberId, { name: m.name, serviceAccount: m.principal === "service_account" }]
          } catch {
            return [memberId, { name: null, serviceAccount: false }]
          }
        }),
      )
      return new Map(entries)
    },
    enabled: uniqueKeys().length > 0,
    initialData: new Map<string, MemberName>(),
  }))

  return () => query.data
}
