import { createClient } from "./gen/client/client.gen.js"
import { type Config } from "./gen/client/types.gen.js"
import { KxClient } from "./gen/sdk.gen.js"

export * from "./gen/types.gen.js"
export { type Config as KxClientConfig, KxClient }

export function createKxClient(config?: Config & { directory?: string }) {
  if (!config?.fetch) {
    const customFetch: any = (req: any) => {
      // @ts-ignore
      req.timeout = false
      return fetch(req)
    }
    config = {
      ...config,
      fetch: customFetch,
    }
  }

  if (config?.directory) {
    config.headers = {
      ...config.headers,
      "x-kx-directory": encodeURIComponent(config.directory),
    }
  }

  const client = createClient(config)
  return new KxClient({ client })
}
