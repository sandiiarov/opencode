export * from "./client.js"
export * from "./server.js"

import { createKxClient } from "./client.js"
import { createKxServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export async function createKx(options?: ServerOptions) {
  const server = await createKxServer({
    ...options,
  })

  const client = createKxClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
