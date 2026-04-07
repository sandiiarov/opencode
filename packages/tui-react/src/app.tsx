import { type CliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { Session } from "./components/session"
import { mockMessages } from "./mock-data"

function Screen() {
  return (
    <box width="100%" height="100%" padding={1}>
      <Session messages={mockMessages} />
    </box>
  )
}

export function mount(renderer: CliRenderer) {
  createRoot(renderer).render(<Screen />)
}
