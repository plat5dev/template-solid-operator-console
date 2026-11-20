import type { JSX } from "@solidjs/web"
import { useQueryClient } from "@tanstack/solid-query"
import { createContext, createSignal, onCleanup, useContext, type Accessor } from "solid-js"
import { setUnauthorizedHandler } from "../api/client"
import { login as startLogin } from "./oidc"
import { clearSession, readSession, type Session } from "./session"

export type AuthState = {
  session: Accessor<Session | null>
  login: (returnTo?: string) => Promise<void>
  logout: () => void
  refresh: () => void
}

const AuthContext = createContext<AuthState>()

export function AuthProvider(props: { children: JSX.Element }) {
  const queryClient = useQueryClient()
  const [session, setSession] = createSignal<Session | null>(readSession())

  const logout = () => {
    clearSession()
    queryClient.clear()
    setSession(null)
  }

  // Register immediately so a 401 from any gateway call clears the session.
  setUnauthorizedHandler(logout)
  onCleanup(() => setUnauthorizedHandler(() => {}))

  const refresh = () => {
    setSession(readSession())
  }

  const login = async (returnTo?: string) => {
    await startLogin(returnTo ?? window.location.pathname + window.location.search)
  }

  return (
    <AuthContext value={{ session, login, logout, refresh }}>
      {props.children}
    </AuthContext>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
