import { createCliRenderer } from "@opentui/core"
import { mount } from "./app"
export * from "./components/message"

export async function run() {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
  })
  mount(renderer)
  return renderer
}

if (import.meta.main) await run()
