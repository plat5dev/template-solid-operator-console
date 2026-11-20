import "@fontsource-variable/inter"
import "@fontsource-variable/jetbrains-mono"
import { render } from "@solidjs/web"
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query"
import { RouterProvider } from "@tanstack/solid-router"
import { missingSettings } from "./config"
import "./index.css"
import { router } from "./router"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

function MissingConfig() {
  return (
    <main class="grid min-h-full place-items-center p-6">
      <div class="w-[min(32rem,100%)] space-y-3 rounded-xl border border-danger/50 bg-surface p-6 text-sm text-text">
        <h1 class="text-base font-semibold text-danger">Console not configured</h1>
        <p class="text-text-2">
          Missing required runtime settings:{" "}
          <code class="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-text">
            {missingSettings.join(", ")}
          </code>
          .
        </p>
        <p class="text-xs text-muted">
          Set them in the container environment (written to <code>/config.js</code> by{" "}
          <code>docker/config.sh</code>) or as build-time <code>VITE_*</code> variables.
        </p>
      </div>
    </main>
  )
}

render(
  () =>
    missingSettings.length > 0 ? (
      <MissingConfig />
    ) : (
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    ),
  document.getElementById("root")!,
)
