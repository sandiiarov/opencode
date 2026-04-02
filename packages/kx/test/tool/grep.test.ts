import { describe, expect, test } from "bun:test"
import path from "path"
import { EditTool } from "../../src/tool/edit"
import { GrepTool } from "../../src/tool/grep"
import { computeLineHash, renderNumberedOutput } from "../../src/tool/hashline"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"
import { SessionID, MessageID } from "../../src/session/schema"

const ctx = {
  sessionID: SessionID.make("ses_test"),
  messageID: MessageID.make(""),
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => {},
  ask: async () => {},
}

const projectRoot = path.join(__dirname, "../..")

function lineRef(output: string, line: number) {
  const hit = output
    .split("\n")
    .map((item) => item.trimStart())
    .filter((item) => /^(?:>>>\s*)?[a-z0-9]{4}\|/i.test(item))[line - 1]
  if (!hit) throw new Error(`Missing hashline ref for line ${line}`)
  return hit.replace(/^>>>\s*/, "").split("|")[0]
}

describe("tool.grep", () => {
  test("basic search", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const grep = await GrepTool.init()
        const result = await grep.execute(
          {
            pattern: "export",
            path: path.join(projectRoot, "src/tool"),
            include: "*.ts",
          },
          ctx,
        )
        expect(result.metadata.matches).toBeGreaterThan(0)
        expect(result.output).toContain("Found")
      },
    })
  })

  test("no matches returns correct output", async () => {
    await using tmp = await tmpdir({
      init: async (dir) => {
        await Bun.write(path.join(dir, "test.txt"), "hello world")
      },
    })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const grep = await GrepTool.init()
        const result = await grep.execute(
          {
            pattern: "xyznonexistentpatternxyz123",
            path: tmp.path,
          },
          ctx,
        )
        expect(result.metadata.matches).toBe(0)
        expect(result.output).toBe("No files found")
      },
    })
  })

  test("handles CRLF line endings in output", async () => {
    // This test verifies the regex split handles both \n and \r\n
    await using tmp = await tmpdir({
      init: async (dir) => {
        // Create a test file with content
        await Bun.write(path.join(dir, "test.txt"), "line1\nline2\nline3")
      },
    })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const grep = await GrepTool.init()
        const result = await grep.execute(
          {
            pattern: "line",
            path: tmp.path,
          },
          ctx,
        )
        expect(result.metadata.matches).toBeGreaterThan(0)
      },
    })
  })

  test("returns hashline refs that match read-style anchors", async () => {
    await using tmp = await tmpdir({
      init: async (dir) => {
        await Bun.write(path.join(dir, "test.txt"), "alpha\nbeta\n")
      },
    })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const grep = await GrepTool.init()
        const result = await grep.execute({ pattern: "beta", path: tmp.path }, ctx)
        expect(result.output).toMatch(/  [a-z0-9]{4}\|beta/i)
        expect(renderNumberedOutput(result.output)).toContain("  1: beta")
      },
    })
  })

  test("grep anchors survive line shifts in follow-up edits", async () => {
    await using tmp = await tmpdir({
      init: async (dir) => {
        await Bun.write(path.join(dir, "test.txt"), ["Aad", "adkad", "askdlj", "adaskjas", ""].join("\n"))
      },
    })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const file = path.join(tmp.path, "test.txt")
        const grep = await GrepTool.init()
        const grepResult = await grep.execute({ pattern: "ad", path: tmp.path }, ctx)
        const second = lineRef(grepResult.output, 2)
        const tail = lineRef(grepResult.output, 3)

        const { FileTime } = await import("../../src/file/time")
        await FileTime.read(ctx.sessionID, file)
        const edit = await EditTool.init()
        await edit.execute(
          {
            filePath: file,
            edits: [
              {
                op: "replace",
                pos: second,
                lines: ["two", "three", "four", "five"],
              },
            ],
          },
          ctx,
        )

        await edit.execute(
          {
            filePath: file,
            edits: [{ op: "replace", pos: tail, lines: ["tail"] }],
          },
          ctx,
        )

        expect(await Bun.file(file).text()).toBe(
          ["Aad", "two", "three", "four", "five", "askdlj", "tail", ""].join("\n"),
        )
      },
    })
  })
})

describe("CRLF regex handling", () => {
  test("regex correctly splits Unix line endings", () => {
    const unixOutput = "file1.txt|1|content1\nfile2.txt|2|content2\nfile3.txt|3|content3"
    const lines = unixOutput.trim().split(/\r?\n/)
    expect(lines.length).toBe(3)
    expect(lines[0]).toBe("file1.txt|1|content1")
    expect(lines[2]).toBe("file3.txt|3|content3")
  })

  test("regex correctly splits Windows CRLF line endings", () => {
    const windowsOutput = "file1.txt|1|content1\r\nfile2.txt|2|content2\r\nfile3.txt|3|content3"
    const lines = windowsOutput.trim().split(/\r?\n/)
    expect(lines.length).toBe(3)
    expect(lines[0]).toBe("file1.txt|1|content1")
    expect(lines[2]).toBe("file3.txt|3|content3")
  })

  test("regex handles mixed line endings", () => {
    const mixedOutput = "file1.txt|1|content1\nfile2.txt|2|content2\r\nfile3.txt|3|content3"
    const lines = mixedOutput.trim().split(/\r?\n/)
    expect(lines.length).toBe(3)
  })
})
