import { TextAttributes, type CliRenderer } from "@opentui/core"
import { createRoot, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/react"
import { useState } from "react"

const routes = ["home", "session"] as const

type Route = (typeof routes)[number]

function next(route: Route, dir: 1 | -1) {
  const i = routes.indexOf(route)
  return routes[(i + dir + routes.length) % routes.length]
}

function Screen() {
  const renderer = useRenderer()
  const size = useTerminalDimensions()
  const [route, setRoute] = useState<Route>("home")

  useKeyboard((key) => {
    if (key.name === "escape" || key.sequence === "q") {
      renderer.destroy()
      return
    }

    if (key.name === "tab" || key.name === "right") {
      setRoute((route: Route) => next(route, 1))
      return
    }

    if (key.name === "left") {
      setRoute((route: Route) => next(route, -1))
    }
  })

  return (
    <box flexDirection="column" padding={1} width="100%" height="100%">
      <box borderStyle="rounded" flexDirection="column" flexGrow={1} padding={1} gap={1}>
        <box justifyContent="space-between">
          <text attributes={TextAttributes.BOLD}>kx react tui</text>
          <text fg="gray">
            {size.width}x{size.height}
          </text>
        </box>

        <box gap={1}>
          {routes.map((item) => (
            <box key={item} borderStyle="single" paddingLeft={1} paddingRight={1}>
              <text fg={item === route ? "cyan" : "gray"}>{item}</text>
            </box>
          ))}
        </box>

        <box borderStyle="single" flexDirection="column" flexGrow={1} padding={1}>
          {route === "home" ? (
            <>
              <text attributes={TextAttributes.BOLD}>Foundation ready</text>
              <text>Use this package to port the Solid TUI in small React-first slices.</text>
              <text fg="gray">Next: contexts, dialogs, command palette, and prompt flow.</text>
            </>
          ) : (
            <>
              <text attributes={TextAttributes.BOLD}>Session scaffold</text>
              <text>This route is the future landing spot for the conversation timeline.</text>
              <text fg="gray">Use Tab or arrow keys to compare route shells while the port lands.</text>
            </>
          )}
        </box>

        <text fg="gray">Tab/right: next route | left: previous route | q/esc: quit</text>
      </box>
    </box>
  )
}

export function mount(renderer: CliRenderer) {
  createRoot(renderer).render(<Screen />)
}
