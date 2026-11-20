// 16px stroke icons for navigation and controls.
const paths = {
  orgs: "M2 3h5v10H2zM9 6h5v7H9z",
  projects: "M2 3.5h12v9.5H2zM2 6.5h12",
  tasks: "M3 4.5h10M3 8h10M3 11.5h6",
  profile: "M8 8.3a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6zM2.5 14c.8-2.8 2.8-4 5.5-4s4.7 1.2 5.5 4",
  members:
    "M6 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM1.5 13.5c.6-2.4 2.3-3.5 4.5-3.5s3.9 1.1 4.5 3.5M11 3a2.5 2.5 0 0 1 0 5M12.5 10.3c1 .5 1.7 1.6 2 3.2",
  audit: "M3 2.5h7l3 3v8H3zM5.5 7.5h5M5.5 10h5",
  terminal: "M2.5 4.5L6 8l-3.5 3.5M7.5 11.5h6",
  menu: "M2.5 4.5h11M2.5 8h11M2.5 11.5h11",
  plus: "M8 3v10M3 8h10",
  filter: "M2 3.5h12l-4.5 5v4l-3-1.5V8.5z",
  chevronDown: "M4.5 6.5L8 10l3.5-3.5",
  chevronUp: "M4.5 9.5L8 6l3.5 3.5",
  chevronRight: "M6.5 4.5L10 8l-3.5 3.5",
  more: "M3.5 8h.01M8 8h.01M12.5 8h.01",
  edit: "M11 2.5l2.5 2.5-8 8H3v-2.5z",
  external: "M6.5 3.5H3.5v9h9v-3M9.5 2.5h4v4M7.5 8.5l6-6",
} as const

export type IconName = keyof typeof paths

export function Icon(props: { name: IconName; class?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class={["h-4 w-4 shrink-0", props.class]}
    >
      <path d={paths[props.name]} />
    </svg>
  )
}
