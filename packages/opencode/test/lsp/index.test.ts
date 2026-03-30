import { describe, expect, spyOn, test } from "bun:test"
import path from "path"
import { LSP } from "../../src/lsp/index"
import { computeLineHash } from "../../src/tool/hashline"
import { LSPServer } from "../../src/lsp/server"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"

describe("lsp.spawn", () => {
  test("does not spawn builtin LSP for files outside instance", async () => {
    await using tmp = await tmpdir()
    const spy = spyOn(LSPServer.Typescript, "spawn").mockResolvedValue(undefined)

    try {
      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          await LSP.touchFile(path.join(tmp.path, "..", "outside.ts"))
          await LSP.hover({
            file: path.join(tmp.path, "..", "hover.ts"),
            line: 0,
            character: 0,
          })
        },
      })

      expect(spy).toHaveBeenCalledTimes(0)
    } finally {
      spy.mockRestore()
      await Instance.disposeAll()
    }
  })

  test("would spawn builtin LSP for files inside instance", async () => {
    await using tmp = await tmpdir()
    const spy = spyOn(LSPServer.Typescript, "spawn").mockResolvedValue(undefined)

    try {
      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          await LSP.hover({
            file: path.join(tmp.path, "src", "inside.ts"),
            line: 0,
            character: 0,
          })
        },
      })

      expect(spy).toHaveBeenCalledTimes(1)
    } finally {
      spy.mockRestore()
      await Instance.disposeAll()
    }
  })
})

describe("lsp.diagnostic", () => {
  test("formats hashline refs for agents while preserving fallback formatting", () => {
    const diagnostic = {
      range: {
        start: { line: 1, character: 2 },
        end: { line: 1, character: 5 },
      },
      message: "problem",
      severity: 1 as const,
      source: "ts",
    }
    expect(LSP.Diagnostic.pretty(diagnostic, "beta")).toBe(`ERROR [2#${computeLineHash(2, "beta")}:3] problem`)
    expect(LSP.Diagnostic.pretty(diagnostic)).toBe("ERROR [2:3] problem")
  })
})
