import { beforeEach, describe, expect, test } from "bun:test"
import { spawn } from "child_process"
import path from "path"
import { LSPClient } from "../../src/lsp/client"
import type { LSPServer } from "../../src/lsp/server"
import { Instance } from "../../src/project/instance"
import { Log } from "../../src/util/log"
import { tmpdir } from "../fixture/fixture"

function spawnFakeServer(mode = "basic") {
  const serverPath = path.join(__dirname, "../fixture/lsp/fake-lsp-server.js")
  return {
    process: spawn(process.execPath, [serverPath], {
      env: { ...process.env, FAKE_LSP_MODE: mode },
      stdio: "pipe",
    }),
  }
}

async function createClient(root: string, mode = "basic") {
  const handle = spawnFakeServer(mode) as LSPServer.Handle
  const client = await Instance.provide({
    directory: root,
    fn: () =>
      LSPClient.create({
        serverID: "fake",
        server: handle,
        root,
      }),
  })
  return client
}

describe("LSPClient interop", () => {
  beforeEach(async () => {
    await Log.init({ print: true })
  })

  test("handles workspace/workspaceFolders request", async () => {
    const client = await createClient(process.cwd())

    await client.connection.sendNotification("test/trigger", {
      method: "workspace/workspaceFolders",
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(client.connection).toBeDefined()
    await client.shutdown()
  })

  test("handles client/registerCapability request", async () => {
    const client = await createClient(process.cwd())

    await client.connection.sendNotification("test/trigger", {
      method: "client/registerCapability",
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(client.connection).toBeDefined()
    await client.shutdown()
  })

  test("handles client/unregisterCapability request", async () => {
    const client = await createClient(process.cwd())

    await client.connection.sendNotification("test/trigger", {
      method: "client/unregisterCapability",
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(client.connection).toBeDefined()
    await client.shutdown()
  })

  test("waits for current-generation diagnostics", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "wait.ts")
    await Bun.write(file, "export const a = 1\n")
    const client = await createClient(tmp.path, "wait")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        await client.notify.open({ path: file, waitForDiagnostics: true })
        expect(client.diagnostics.get(file)?.map((item) => item.message)).toEqual(["initial"])
        await Bun.write(file, "export const a = 2\n")
        await client.notify.open({ path: file, waitForDiagnostics: true })
      },
    })

    expect(client.diagnostics.get(file)).toEqual([])
    await client.shutdown()
  })

  test("keeps the newest publish diagnostics when older enrichment finishes later", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "race.ts")
    await Bun.write(file, "export const a = 1\n")
    const client = await createClient(tmp.path, "race")

    await Instance.provide({
      directory: tmp.path,
      fn: () => client.notify.open({ path: file, waitForDiagnostics: true }),
    })

    expect(client.diagnostics.get(file)).toEqual([])
    await client.shutdown()
  })

  test("clears pull diagnostics when the file becomes clean", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "pull.ts")
    await Bun.write(file, "export const a = 1\n")
    const client = await createClient(tmp.path, "pull")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        await client.notify.open({ path: file, waitForDiagnostics: true })
        expect(client.diagnostics.get(file)?.map((item) => item.message)).toEqual(["pull"])
        await Bun.write(file, "export const a = 2\n")
        await client.notify.open({ path: file, waitForDiagnostics: true })
      },
    })

    expect(client.diagnostics.get(file)).toEqual([])
    await client.shutdown()
  })
})
