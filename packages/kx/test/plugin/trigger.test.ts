import { afterEach, describe, expect, test } from "bun:test"
import path from "path"
import type { Hooks } from "@kx/plugin"
import { pathToFileURL } from "url"
import { tmpdir } from "../fixture/fixture"
import { Instance } from "../../src/project/instance"
import { Plugin } from "../../src/plugin"

afterEach(async () => {
  await Instance.disposeAll()
})

type Input = Parameters<NonNullable<Hooks["experimental.chat.system.transform"]>>[0]
type Output = Parameters<NonNullable<Hooks["experimental.chat.system.transform"]>>[1]

async function project(source: string) {
  return tmpdir({
    init: async (dir) => {
      const file = path.join(dir, "plugin.ts")
      await Bun.write(file, source)
      await Bun.write(
        path.join(dir, "kx.json"),
        JSON.stringify(
          {
            $schema: "https://kx.ai/config.json",
            plugin: [pathToFileURL(file).href],
          },
          null,
          2,
        ),
      )
    },
  })
}

describe("plugin.trigger", () => {
  test("runs synchronous hooks without crashing", async () => {
    await using tmp = await project(
      [
        "export default async () => ({",
        '  "experimental.chat.system.transform": (_input, output) => {',
        '    output.system.unshift("sync")',
        "  },",
        "})",
        "",
      ].join("\n"),
    )

    const out = await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const out: Output = { system: [] }
        const input = {
          model: {
            providerID: "anthropic",
            modelID: "claude-sonnet-4-6",
          },
        } as unknown as Input
        await Plugin.trigger("experimental.chat.system.transform", input, out)
        return out
      },
    })

    expect(out.system).toEqual(["sync"])
  })

  test("awaits asynchronous hooks", async () => {
    await using tmp = await project(
      [
        "export default async () => ({",
        '  "experimental.chat.system.transform": async (_input, output) => {',
        "    await Bun.sleep(1)",
        '    output.system.unshift("async")',
        "  },",
        "})",
        "",
      ].join("\n"),
    )

    const out = await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const out: Output = { system: [] }
        const input = {
          model: {
            providerID: "anthropic",
            modelID: "claude-sonnet-4-6",
          },
        } as unknown as Input
        await Plugin.trigger("experimental.chat.system.transform", input, out)
        return out
      },
    })

    expect(out.system).toEqual(["async"])
  })
})
