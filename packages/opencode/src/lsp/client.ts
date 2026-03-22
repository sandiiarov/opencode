import { BusEvent } from "@/bus/bus-event"
import { Bus } from "@/bus"
import path from "path"
import { pathToFileURL, fileURLToPath } from "url"
import { createMessageConnection, StreamMessageReader, StreamMessageWriter } from "vscode-jsonrpc/node"
import type { Diagnostic as VSCodeDiagnostic } from "vscode-languageserver-types"
import { Log } from "../util/log"
import { Process } from "../util/process"
import { LANGUAGE_EXTENSIONS } from "./language"
import z from "zod"
import type { LSPServer } from "./server"
import { NamedError } from "@opencode-ai/util/error"
import { withTimeout } from "../util/timeout"
import { Instance } from "../project/instance"
import { Filesystem } from "../util/filesystem"

const DIAGNOSTICS_DEBOUNCE_MS = 150

export namespace LSPClient {
  const log = Log.create({ service: "lsp.client" })

  const items = (result: unknown) => {
    if (!result || typeof result !== "object") return []
    if (!("items" in result)) return []
    return Array.isArray(result.items) ? result.items : []
  }

  const cfg = (input: { serverID: string; root: string; server: LSPServer.Handle }) => {
    if (input.serverID !== "eslint") return input.server.initialization ?? {}
    return {
      validate: "on",
      nodePath: null,
      packageManager: "npm",
      useRealpaths: false,
      quiet: false,
      onIgnoredFiles: "off",
      options: {},
      useESLintClass: false,
      useFlatConfig: null,
      experimental: {
        useFlatConfig: false,
      },
      codeAction: {
        disableRuleComment: {
          enable: true,
          location: "separateLine",
          commentStyle: "line",
        },
        showDocumentation: {
          enable: true,
        },
      },
      codeActionOnSave: {
        mode: "all",
      },
      format: false,
      rulesCustomizations: [],
      run: "onType",
      problems: {
        shortenToSingleLine: false,
      },
      workingDirectory: {
        mode: "location",
      },
      workspaceFolder: {
        name: "workspace",
        uri: pathToFileURL(input.root).href,
      },
      ...(input.server.initialization ?? {}),
    }
  }

  export type Info = NonNullable<Awaited<ReturnType<typeof create>>>

  export type Diagnostic = VSCodeDiagnostic & {
    suggestions?: string[]
  }

  export const InitializeError = NamedError.create(
    "LSPInitializeError",
    z.object({
      serverID: z.string(),
    }),
  )

  export const Event = {
    Diagnostics: BusEvent.define(
      "lsp.client.diagnostics",
      z.object({
        serverID: z.string(),
        path: z.string(),
      }),
    ),
  }

  export async function create(input: { serverID: string; server: LSPServer.Handle; root: string }) {
    const l = log.clone().tag("serverID", input.serverID)
    l.info("starting client")

    const connection = createMessageConnection(
      new StreamMessageReader(input.server.process.stdout as any),
      new StreamMessageWriter(input.server.process.stdin as any),
    )

    let codeAction = false

    const diagnostics = new Map<string, Diagnostic[]>()

    const suggest = async (file: string, diagnostic: Diagnostic) => {
      if (!codeAction) return diagnostic
      const result = await withTimeout(
        connection
          .sendRequest("textDocument/codeAction", {
            textDocument: {
              uri: pathToFileURL(file).href,
            },
            range: diagnostic.range,
            context: {
              diagnostics: [diagnostic],
            },
          })
          .catch(() => undefined),
        1_500,
      ).catch(() => undefined)
      if (!Array.isArray(result)) return diagnostic
      const suggestions = [
        ...new Set(result.flatMap((item) => (typeof item?.title === "string" ? [item.title] : []))),
      ].slice(0, 3)
      if (suggestions.length === 0) return diagnostic
      return {
        ...diagnostic,
        suggestions,
      }
    }

    const enrich = async (file: string, arr: Diagnostic[]) => {
      if (arr.length === 0) return arr
      return Promise.all(arr.map((diagnostic) => suggest(file, diagnostic)))
    }

    const store = async (file: string, arr: Diagnostic[]) => {
      const next = await enrich(file, arr)
      const exists = diagnostics.has(file)
      diagnostics.set(file, next)
      if (!exists && input.serverID === "typescript") return
      Bus.publish(Event.Diagnostics, { path: file, serverID: input.serverID })
    }

    connection.onNotification("textDocument/publishDiagnostics", (params) => {
      const filePath = Filesystem.normalizePath(fileURLToPath(params.uri))
      l.info("textDocument/publishDiagnostics", {
        path: filePath,
        count: params.diagnostics.length,
      })
      void store(filePath, params.diagnostics)
    })
    connection.onRequest("window/workDoneProgress/create", (params) => {
      l.info("window/workDoneProgress/create", params)
      return null
    })
    connection.onRequest("workspace/configuration", async () => {
      return [cfg(input)]
    })
    connection.onRequest("client/registerCapability", async () => {})
    connection.onRequest("client/unregisterCapability", async () => {})
    connection.onRequest("workspace/workspaceFolders", async () => [
      {
        name: "workspace",
        uri: pathToFileURL(input.root).href,
      },
    ])
    connection.listen()

    const files: {
      [path: string]: number
    } = {}

    const pull = async (file: string) => {
      const path = Filesystem.normalizePath(file)
      const result = await connection
        .sendRequest("textDocument/diagnostic", {
          textDocument: {
            uri: pathToFileURL(path).href,
          },
        })
        .catch(() => undefined)
      if (!result) return
      const next = await enrich(path, items(result))
      if (next.length === 0) return
      diagnostics.set(path, next)
      Bus.publish(Event.Diagnostics, { path, serverID: input.serverID })
    }

    connection.onRequest("workspace/diagnostic/refresh", async () => {
      await Promise.all(Object.keys(files).map((path) => pull(path)))
      return null
    })

    l.info("sending initialize")
    const init = await withTimeout(
      connection.sendRequest("initialize", {
        rootUri: pathToFileURL(input.root).href,
        processId: input.server.process.pid,
        workspaceFolders: [
          {
            name: "workspace",
            uri: pathToFileURL(input.root).href,
          },
        ],
        initializationOptions: {
          ...cfg(input),
        },
        capabilities: {
          window: {
            workDoneProgress: true,
          },
          workspace: {
            configuration: true,
            didChangeWatchedFiles: {
              dynamicRegistration: true,
            },
            diagnostics: {
              refreshSupport: true,
            },
          },
          textDocument: {
            synchronization: {
              didOpen: true,
              didChange: true,
            },
            publishDiagnostics: {
              versionSupport: true,
            },
            diagnostic: {
              dynamicRegistration: true,
              relatedDocumentSupport: false,
            },
          },
        },
      }),
      45_000,
    ).catch((err) => {
      l.error("initialize error", { error: err })
      throw new InitializeError(
        { serverID: input.serverID },
        {
          cause: err,
        },
      )
    })

    await connection.sendNotification("initialized", {})

    const diagnostic = Boolean(
      (init as { capabilities?: { diagnosticProvider?: unknown } }).capabilities?.diagnosticProvider,
    )
    codeAction = Boolean((init as { capabilities?: { codeActionProvider?: unknown } }).capabilities?.codeActionProvider)

    if (input.server.initialization) {
      await connection.sendNotification("workspace/didChangeConfiguration", {
        settings: cfg(input),
      })
    }

    const result = {
      root: input.root,
      get serverID() {
        return input.serverID
      },
      get connection() {
        return connection
      },
      notify: {
        async open(input: { path: string }) {
          input.path = path.isAbsolute(input.path) ? input.path : path.resolve(Instance.directory, input.path)
          const text = await Filesystem.readText(input.path)
          const extension = path.extname(input.path)
          const languageId = LANGUAGE_EXTENSIONS[extension] ?? "plaintext"

          const version = files[input.path]
          if (version !== undefined) {
            log.info("workspace/didChangeWatchedFiles", input)
            await connection.sendNotification("workspace/didChangeWatchedFiles", {
              changes: [
                {
                  uri: pathToFileURL(input.path).href,
                  type: 2, // Changed
                },
              ],
            })

            const next = version + 1
            files[input.path] = next
            log.info("textDocument/didChange", {
              path: input.path,
              version: next,
            })
            await connection.sendNotification("textDocument/didChange", {
              textDocument: {
                uri: pathToFileURL(input.path).href,
                version: next,
              },
              contentChanges: [{ text }],
            })
            if (diagnostic) await pull(input.path)
            return
          }

          log.info("workspace/didChangeWatchedFiles", input)
          await connection.sendNotification("workspace/didChangeWatchedFiles", {
            changes: [
              {
                uri: pathToFileURL(input.path).href,
                type: 1, // Created
              },
            ],
          })

          log.info("textDocument/didOpen", input)
          diagnostics.delete(input.path)
          await connection.sendNotification("textDocument/didOpen", {
            textDocument: {
              uri: pathToFileURL(input.path).href,
              languageId,
              version: 0,
              text,
            },
          })
          files[input.path] = 0
          if (diagnostic) await pull(input.path)
          return
        },
      },
      get diagnostics() {
        return diagnostics
      },
      async waitForDiagnostics(input: { path: string }) {
        const normalizedPath = Filesystem.normalizePath(
          path.isAbsolute(input.path) ? input.path : path.resolve(Instance.directory, input.path),
        )
        log.info("waiting for diagnostics", { path: normalizedPath })
        let unsub: () => void
        let debounceTimer: ReturnType<typeof setTimeout> | undefined
        return await withTimeout(
          new Promise<void>((resolve) => {
            unsub = Bus.subscribe(Event.Diagnostics, (event) => {
              if (event.properties.path === normalizedPath && event.properties.serverID === result.serverID) {
                // Debounce to allow LSP to send follow-up diagnostics (e.g., semantic after syntax)
                if (debounceTimer) clearTimeout(debounceTimer)
                debounceTimer = setTimeout(() => {
                  log.info("got diagnostics", { path: normalizedPath })
                  unsub?.()
                  resolve()
                }, DIAGNOSTICS_DEBOUNCE_MS)
              }
            })
          }),
          10000,
        )
          .catch(() => {})
          .finally(() => {
            if (debounceTimer) clearTimeout(debounceTimer)
            unsub?.()
          })
      },
      async shutdown() {
        l.info("shutting down")
        connection.end()
        connection.dispose()
        await Process.stop(input.server.process)
        l.info("shutdown")
      },
    }

    l.info("initialized")

    return result
  }
}
