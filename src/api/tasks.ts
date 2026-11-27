// The starter API's tasks, as routed by the operator gateway under `/services/api`:
// `GET /services/api/projects/{project_id}/tasks`. Every template-*-api starter serves
// them, and the operator gateway discovers the `api` service and its routes from Plat5's
// control plane. With a starter of your own, change this file and src/appTabs.tsx.

/** The kind whose nodes have tasks. */
export const tasksKind = "project"

export type TaskStatus = "todo" | "in_progress" | "done"

/** `created_by` is the member id of whoever created it. */
export type Task = {
  id: string
  project_id: string
  title: string
  status: TaskStatus
  created_by: string
  created_at: string
  updated_at: string
}
