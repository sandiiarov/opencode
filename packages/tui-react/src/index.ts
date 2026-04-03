import { createCliRenderer } from "@opentui/core"
import { mount } from "./app"

export async function run() {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
  })

  mount(renderer)
  return renderer
}

if (import.meta.main) {
  await run()
}
