import { RGBA } from "@opentui/core"

export namespace Terminal {
  export type Colors = Awaited<ReturnType<typeof colors>>
  /**
   * Query terminal colors including background, foreground, and palette (0-15).
   * Uses OSC escape sequences to retrieve actual terminal color values.
   *
   * Note: OSC 4 (palette) queries may not work through tmux as responses are filtered.
   * OSC 10/11 (foreground/background) typically work in most environments.
   *
   * Returns an object with background, foreground, and colors array.
   * Any query that fails will be null/empty.
   */
  export async function colors(): Promise<{
    background: RGBA | null
    foreground: RGBA | null
    colors: RGBA[]
  }> {
    if (!process.stdin.isTTY) return { background: null, foreground: null, colors: [] }

    return new Promise((resolve) => {
      let background: RGBA | null = null
      let foreground: RGBA | null = null
      const paletteColors: RGBA[] = []
      let timeout: NodeJS.Timeout

      const cleanup = () => {
        process.stdin.setRawMode(false)
        process.stdin.removeListener("data", handler)
        clearTimeout(timeout)
      }

      const parseColor = (colorStr: string): RGBA | null => {
        if (colorStr.startsWith("rgb:")) {
          const parts = colorStr.substring(4).split("/")
          return RGBA.fromInts(
            parseInt(parts[0], 16) >> 8, // Convert 16-bit to 8-bit
            parseInt(parts[1], 16) >> 8,
            parseInt(parts[2], 16) >> 8,
            255,
          )
        }
        if (colorStr.startsWith("#")) {
          return RGBA.fromHex(colorStr)
        }
        if (colorStr.startsWith("rgb(")) {
          const parts = colorStr.substring(4, colorStr.length - 1).split(",")
          return RGBA.fromInts(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), 255)
        }
        return null
      }

      const readPalette = (text: string) => {
        const values = [] as Array<{ index: number; color: string }>
        const parts = text.split("\x1b]4;")
        for (const part of parts.slice(1)) {
          const body = part.split("\x07")[0]?.split("\x1b")[0]
          if (!body) continue
          const [index, color] = body.split(";", 2)
          if (!index || !color) continue
          values.push({ index: parseInt(index), color })
        }
        return values
      }

      const readOSC = (text: string, prefix: string) => {
        const start = text.indexOf(prefix)
        if (start === -1) return
        const body = text.slice(start + prefix.length)
        const bel = body.indexOf("\x07")
        const esc = body.indexOf("\x1b")
        const end = [bel, esc].filter((value) => value !== -1).sort((a, b) => a - b)[0]
        return end === undefined ? undefined : body.slice(0, end)
      }

      const handler = (data: Buffer) => {
        const str = data.toString()

        // Match OSC 11 (background color)
        const bg = readOSC(str, "\x1b]11;")
        if (bg) {
          background = parseColor(bg)
        }

        // Match OSC 10 (foreground color)
        const fg = readOSC(str, "\x1b]10;")
        if (fg) {
          foreground = parseColor(fg)
        }

        // Match OSC 4 (palette colors)
        const paletteMatches = readPalette(str)
        for (const match of paletteMatches) {
          const index = match.index
          const color = parseColor(match.color)
          if (color) paletteColors[index] = color
        }

        // Return immediately if we have all 16 palette colors
        if (paletteColors.filter((c) => c !== undefined).length === 16) {
          cleanup()
          resolve({ background, foreground, colors: paletteColors })
        }
      }

      process.stdin.setRawMode(true)
      process.stdin.on("data", handler)

      // Query background (OSC 11)
      process.stdout.write("\x1b]11;?\x07")
      // Query foreground (OSC 10)
      process.stdout.write("\x1b]10;?\x07")
      // Query palette colors 0-15 (OSC 4)
      for (let i = 0; i < 16; i++) {
        process.stdout.write(`\x1b]4;${i};?\x07`)
      }

      timeout = setTimeout(() => {
        cleanup()
        resolve({ background, foreground, colors: paletteColors })
      }, 1000)
    })
  }

  export async function getTerminalBackgroundColor(): Promise<"dark" | "light"> {
    const result = await colors()
    if (!result.background) return "dark"

    const { r, g, b } = result.background
    // Calculate luminance using relative luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    // Determine if dark or light based on luminance threshold
    return luminance > 0.5 ? "light" : "dark"
  }
}
