import path from "path"
import { Flag } from "../flag/flag"

declare global {
  const KX_VERSION: string
  const KX_CHANNEL: string
}

export namespace Installation {
  export type Method = "local" | "unknown"

  export const VERSION = typeof KX_VERSION === "string" ? KX_VERSION : "local"
  export const CHANNEL = typeof KX_CHANNEL === "string" ? KX_CHANNEL : "local"
  export const USER_AGENT = `kx/${CHANNEL}/${VERSION}/${Flag.KX_CLIENT}`

  export function isPreview() {
    return CHANNEL !== "latest"
  }

  export function isLocal() {
    return CHANNEL === "local"
  }

  export async function method(): Promise<Method> {
    if (process.execPath.includes(path.join(".kx", "bin"))) return "local"
    if (process.execPath.includes(path.join(".local", "bin"))) return "local"
    return "unknown"
  }
}
