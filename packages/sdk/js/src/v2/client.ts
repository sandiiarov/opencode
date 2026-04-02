import { createClient } from "./gen/client/client.gen.js"
import { type Config } from "./gen/client/types.gen.js"
import { KxClient } from "./gen/sdk.gen.js"

export * from "./gen/types.gen.js"
export { type Config as KxClientConfig, KxClient }

export function createKxClient(config?: Config & { directory?: string; experimental_workspaceID?: string }) {
  if (!config?.fetch) {
    const customFetch: any = (req: any) => {
      req.timeout = false
      return fetch(req)
    }
    config = {
      ...config,
      fetch: customFetch,
    }
  }

  if (config?.directory) {
    const isNonASCII = Array.from(config.directory).some((char) => (char.codePointAt(0) ?? 0) > 0x7f)
    const encodedDirectory = isNonASCII ? encodeURIComponent(config.directory) : config.directory
    config.headers = {
      ...config.headers,
      "x-kx-directory": encodedDirectory,
    }
  }

  if (config?.experimental_workspaceID) {
    config.headers = {
      ...config.headers,
      "x-kx-workspace": config.experimental_workspaceID,
    }
  }

  const client = createClient(config)
  return new KxClient({ client })
}
