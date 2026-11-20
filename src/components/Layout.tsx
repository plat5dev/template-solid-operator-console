import { Link, Outlet, useLocation } from "@tanstack/solid-router"
import { createEffect, createSignal, For, Show } from "solid-js"
import { plural, rootKinds } from "../api/kinds"
import { useAuth } from "../auth/AuthContext"
import { config } from "../config"
import { applyTheme, loadTheme, type Theme } from "../theme"
import { Icon, type IconName } from "./icons"
import { initials } from "./initials"
import { Avatar } from "./ui/Badge"
import { Button } from "./ui/Button"
import { Drawer, DrawerBackdrop, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "./ui/Drawer"
import { Menu, MenuContent, MenuGroup, MenuGroupLabel, MenuItem, MenuSeparator, MenuTrigger } from "./ui/Menu"
import { toast } from "./ui/overlays"
import { SegmentedControl, SegmentedControlItem } from "./ui/SegmentedControl"
import { Wordmark } from "./Wordmark"

/**
 * Operator plane shell:
 * - Persistent amber operator strip at the very top (never scrolls away)
 * - Grouped sidebar navigation + mobile Drawer
 * - Theme switch + compact operator identity & connection menu at the sidebar foot
 */
export function Layout() {
  const { session, login, logout } = useAuth()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = createSignal(false)

  // Close mobile drawer on route navigation.
  createEffect(
    () => location().pathname,
    () => {
      setDrawerOpen(false)
    },
  )

  const gatewayHost = () => {
    try {
      return new URL(config.gatewayUrl).host
    } catch {
      return config.gatewayUrl
    }
  }

  const operatorLabel = () => {
    const s = session()
    return s ? (s.email ?? s.name ?? s.sub) : ""
  }

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch {
      toast.error("Couldn't copy to clipboard")
    }
  }

  function SidebarBody(props: { hideBrand?: boolean }) {
    return (
      <div class="flex h-full flex-col gap-5 p-3">
        <Show when={!props.hideBrand}>
          <div class="flex items-center justify-between px-2 pt-1">
            <Brand />
          </div>
        </Show>

        <div class="flex-1 space-y-5 overflow-y-auto">
          <Show when={session()}>
            <nav aria-label="Directory" class="space-y-0.5">
              <h2 class="px-2 pb-1 font-mono text-[0.6875rem] font-medium text-muted">directory</h2>
              <For each={rootKinds}>
                {(k) => (
                  <NavLinkItem to="/nodes" search={{ kind: k }} icon="orgs">
                    {plural(k)}
                  </NavLinkItem>
                )}
              </For>
              <NavLinkItem to="/users" icon="profile">
                Users
              </NavLinkItem>
            </nav>

            <nav aria-label="Operator" class="space-y-0.5">
              <h2 class="px-2 pb-1 font-mono text-[0.6875rem] font-medium text-muted">operator</h2>
              <NavLinkItem to="/operator-audit-events" icon="audit">
                Operator log
              </NavLinkItem>
              <NavLinkItem to="/request" icon="terminal">
                Request
              </NavLinkItem>
            </nav>
          </Show>
        </div>

        <div class="flex flex-col gap-3 border-t border-rule pt-3">
          <ThemeSwitch />

          <Show
            when={session()}
            fallback={
              <Button variant="primary" size="sm" block onClick={() => void login("/")}>
                Sign in
              </Button>
            }
          >
            <div>
              <Menu>
                <MenuTrigger class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-text-2 transition-colors hover:bg-surface-2 hover:text-text data-open:bg-surface-2 data-open:text-text cursor-pointer">
                  <Avatar text={initials(operatorLabel())} accent />
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium text-text">{operatorLabel()}</div>
                    <div class="truncate font-mono text-[0.6875rem] text-muted">{gatewayHost()}</div>
                  </div>
                  <Icon name="chevronUp" class="text-muted" />
                </MenuTrigger>

                <MenuContent side="top" align="start" class="min-w-60">
                  <MenuGroup>
                    <MenuGroupLabel>connection</MenuGroupLabel>
                    <MenuItem
                      onSelect={() => void copy("Gateway URL", config.gatewayUrl)}
                      title="Copy gateway URL"
                    >
                      <div class="min-w-0 flex-1">
                        <div class="text-[0.6875rem] text-muted">Gateway</div>
                        <div class="truncate font-mono text-xs text-text">{config.gatewayUrl}</div>
                      </div>
                      <Icon name="copy" class="h-3.5 w-3.5 text-muted" />
                    </MenuItem>
                    <MenuItem
                      onSelect={() => void copy("Issuer URL", config.issuer)}
                      title="Copy issuer URL"
                    >
                      <div class="min-w-0 flex-1">
                        <div class="text-[0.6875rem] text-muted">Issuer</div>
                        <div class="truncate font-mono text-xs text-text">{config.issuer}</div>
                      </div>
                      <Icon name="copy" class="h-3.5 w-3.5 text-muted" />
                    </MenuItem>
                  </MenuGroup>
                  <MenuSeparator />
                  <MenuItem onSelect={() => logout()}>Sign out</MenuItem>
                </MenuContent>
              </Menu>
            </div>
          </Show>
        </div>
      </div>
    )
  }

  return (
    <div class="flex min-h-full flex-col">
      {/* Persistent amber operator-plane strip */}
      <div class="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 bg-accent px-4 py-1.5 font-mono text-[0.71875rem] text-on-accent">
        <span class="flex items-center gap-1.5">
          <strong class="font-semibold tracking-wide uppercase">operator</strong>
          <span aria-hidden="true" class="opacity-65">·</span>
          <span>operator plane</span>
          <span aria-hidden="true" class="opacity-65">·</span>
          <span class="truncate">{gatewayHost()}</span>
        </span>
        <span class="truncate opacity-95">
          <Show when={session()} fallback="not signed in">
            {operatorLabel()} · every request is in the operator log
          </Show>
        </span>
      </div>

      {/* Mobile header bar + navigation Drawer */}
      <div class="sticky top-7 z-30 flex items-center justify-between gap-3 border-b border-rule bg-surface px-4 py-2.5 lg:hidden">
        <Brand />
        <Drawer side="left" open={drawerOpen()} onOpenChange={setDrawerOpen}>
          <DrawerTrigger
            aria-label="Open navigation"
            class="inline-grid h-8 w-8 place-items-center rounded-md border border-rule bg-bg text-text cursor-pointer"
          >
            <Icon name="menu" />
          </DrawerTrigger>
          <DrawerBackdrop />
          <DrawerContent>
            <div class="flex items-center justify-between border-b border-rule px-4 py-3">
              <DrawerTitle class="sr-only">Navigation</DrawerTitle>
              <Brand />
              <DrawerClose
                aria-label="Close navigation"
                class="inline-grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-text cursor-pointer"
              >
                ×
              </DrawerClose>
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto">
              <SidebarBody hideBrand />
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop sidebar + main content */}
      <div class="flex-1 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside class="hidden lg:sticky lg:top-7 lg:block lg:h-[calc(100dvh-1.75rem)] lg:border-r lg:border-rule lg:bg-surface">
          <SidebarBody />
        </aside>

        <main class="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
          <div class="mx-auto max-w-5xl space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function Brand() {
  return (
    <Link to="/" class="inline-flex items-center gap-2 text-text no-underline" aria-label="Operator console home">
      <Wordmark />
      <span class="rounded border border-accent bg-accent-wash px-1.5 py-0.5 font-mono text-[0.6875rem] font-medium leading-none text-accent-text">
        operator
      </span>
    </Link>
  )
}

function NavLinkItem(props: {
  to: string
  search?: Record<string, string>
  icon: IconName
  exact?: boolean
  children: string
}) {
  return (
    <Link
      to={props.to as never}
      search={props.search as never}
      activeOptions={{ exact: props.exact, includeSearch: Boolean(props.search) }}
      class="relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-text-2 no-underline transition-colors hover:bg-surface-2 hover:text-text"
      activeProps={{
        class:
          "bg-surface-2 font-medium text-text before:absolute before:inset-y-1.5 before:-left-3 before:w-[3px] before:rounded-r before:bg-accent",
      }}
    >
      <Icon name={props.icon} />
      <span class="truncate">{props.children}</span>
    </Link>
  )
}

function ThemeSwitch() {
  const [theme, setTheme] = createSignal<Theme>(loadTheme())
  return (
    <div class="px-1">
      <SegmentedControl
        aria-label="Theme"
        value={theme()}
        onValueChange={(next) => {
          if (next === "system" || next === "light" || next === "dark") {
            applyTheme(next)
            setTheme(next)
          }
        }}
        class="grid w-full grid-cols-3"
      >
        <SegmentedControlItem value="system">System</SegmentedControlItem>
        <SegmentedControlItem value="light">Light</SegmentedControlItem>
        <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
      </SegmentedControl>
    </div>
  )
}
