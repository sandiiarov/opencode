import { afterEach, describe, expect, test } from "bun:test"
import path from "path"
import fs from "fs/promises"
import { EditTool } from "../../src/tool/edit"
import { GrepTool } from "../../src/tool/grep"
import { ReadTool } from "../../src/tool/read"
import { WriteTool } from "../../src/tool/write"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"
import { FileTime } from "../../src/file/time"
import { SessionID, MessageID } from "../../src/session/schema"
import { computeLineHash, renderNumberedOutput } from "../../src/tool/hashline"

const ctx = {
  sessionID: SessionID.make("ses_test-edit-session"),
  messageID: MessageID.make(""),
  callID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => {},
  ask: async () => {},
}

afterEach(async () => {
  await Instance.disposeAll()
})

function ref(line: number, text: string) {
  return `${line}#${computeLineHash(line, text)}`
}

function lineRef(output: string, line: number) {
  const body = output.includes("<content>") ? output.slice(output.indexOf("<content>") + 9) : output
  const hit = body
    .split("\n")
    .map((item) => item.trimStart())
    .find((item) => item.startsWith(`${line}#`) || item.startsWith(`>>> ${line}#`))
  if (!hit) throw new Error(`Missing hashline ref for line ${line}`)
  return hit.replace(/^>>>\s*/, "").split("|")[0]
}

describe("tool.edit", () => {
  test("replaces a line using hashline anchors", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "file.txt")
    await fs.writeFile(file, "one\ntwo\nthree\n", "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        await FileTime.read(ctx.sessionID, file)
        const edit = await EditTool.init()
        const result = await edit.execute(
          {
            filePath: file,
            edits: [{ op: "replace", pos: ref(2, "two"), lines: ["dos"] }],
          },
          ctx,
        )

        expect(result.output).toContain("Edit applied successfully")
        expect(await fs.readFile(file, "utf-8")).toBe("one\ndos\nthree\n")
      },
    })
  })

  test("creates a new file with additive append edits", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "new.txt")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const edit = await EditTool.init()
        await edit.execute(
          {
            filePath: file,
            edits: [{ op: "append", lines: ["alpha", "beta"] }],
          },
          ctx,
        )

        expect(await fs.readFile(file, "utf-8")).toBe("alpha\nbeta")
      },
    })
  })

  test("fails when file was not read first", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "file.txt")
    await fs.writeFile(file, "one\ntwo\n", "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const edit = await EditTool.init()
        await expect(
          edit.execute(
            {
              filePath: file,
              edits: [{ op: "replace", pos: ref(2, "two"), lines: ["dos"] }],
            },
            ctx,
          ),
        ).rejects.toThrow("You must read file")
      },
    })
  })

  test("allows edit with expectedVersion instead of a prior read", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "file.txt")
    await fs.writeFile(file, "one\ntwo\n", "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const version = await FileTime.version(file)
        const edit = await EditTool.init()
        await edit.execute(
          {
            filePath: file,
            expectedVersion: version,
            edits: [{ op: "replace", pos: ref(2, "two"), lines: ["dos"] }],
          },
          ctx,
        )

        expect(await fs.readFile(file, "utf-8")).toBe("one\ndos\n")
      },
    })
  })

  test("fails when content changed after the file was read", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "file.txt")
    await fs.writeFile(file, "one\ntwo\n", "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        await FileTime.read(ctx.sessionID, file)
        await fs.writeFile(file, "one\nchanged\n", "utf-8")
        const edit = await EditTool.init()
        await expect(
          edit.execute(
            {
              filePath: file,
              edits: [{ op: "replace", pos: ref(2, "two"), lines: ["dos"] }],
            },
            ctx,
          ),
        ).rejects.toThrow("modified since it was last read")
      },
    })
  })

  test("renames a file after applying edits", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "old.txt")
    const next = path.join(tmp.path, "dir", "new.txt")
    await fs.writeFile(file, "name\n", "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        await FileTime.read(ctx.sessionID, file)
        const edit = await EditTool.init()
        await edit.execute(
          {
            filePath: file,
            rename: next,
            edits: [{ op: "replace", pos: ref(1, "name"), lines: ["done"] }],
          },
          ctx,
        )

        await expect(fs.readFile(file, "utf-8")).rejects.toThrow()
        expect(await fs.readFile(next, "utf-8")).toBe("done\n")
      },
    })
  })

  test("deletes a file", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "gone.txt")
    await fs.writeFile(file, "bye\n", "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        await FileTime.read(ctx.sessionID, file)
        const edit = await EditTool.init()
        const result = await edit.execute({ filePath: file, delete: true, edits: [] }, ctx)
        expect(result.output).toContain("Deleted file successfully")
        await expect(fs.readFile(file, "utf-8")).rejects.toThrow()
      },
    })
  })

  test("uses refs returned by the read tool", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "file.txt")
    await fs.writeFile(file, "one\ntwo\nthree\n", "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const read = await ReadTool.init()
        const result = await read.execute({ filePath: file }, ctx)
        const edit = await EditTool.init()

        await edit.execute(
          {
            filePath: file,
            edits: [{ op: "replace", pos: lineRef(result.output, 2), lines: ["dos"] }],
          },
          ctx,
        )

        expect(await fs.readFile(file, "utf-8")).toBe("one\ndos\nthree\n")
      },
    })
  })

  test("returns version metadata from read", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "file.txt")
    await fs.writeFile(file, "one\ntwo\n", "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const read = await ReadTool.init()
        const result = await read.execute({ filePath: file }, ctx)
        expect(typeof result.metadata.version).toBe("string")
        expect(result.metadata.version.length).toBeGreaterThan(0)
      },
    })
  })

  test("allows edit after write without another read", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "file.txt")
    await fs.writeFile(file, "alpha\nbeta\n", "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const read = await ReadTool.init()
        await read.execute({ filePath: file }, ctx)

        const write = await WriteTool.init()
        await write.execute({ filePath: file, content: "uno\ndos\n" }, ctx)

        const edit = await EditTool.init()
        await edit.execute(
          {
            filePath: file,
            edits: [{ op: "replace", pos: ref(2, "dos"), lines: ["tres"] }],
          },
          ctx,
        )

        expect(await fs.readFile(file, "utf-8")).toBe("uno\ntres\n")
      },
    })
  })

  test("uses refs returned by the grep tool", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "file.txt")
    await fs.writeFile(file, "one\ntwo\nthree\n", "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const grep = await GrepTool.init()
        const result = await grep.execute({ pattern: "two", path: tmp.path }, ctx)
        const edit = await EditTool.init()

        await edit.execute(
          {
            filePath: file,
            edits: [{ op: "replace", pos: lineRef(result.output, 2), lines: ["dos"] }],
          },
          ctx,
        )

        expect(await fs.readFile(file, "utf-8")).toBe("one\ndos\nthree\n")
      },
    })
  })

  test("uses grep version metadata for edit without another read", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "file.txt")
    await fs.writeFile(file, "one\ntwo\nthree\n", "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const grep = await GrepTool.init()
        const result = await grep.execute({ pattern: "two", path: tmp.path }, ctx)
        const edit = await EditTool.init()

        await edit.execute(
          {
            filePath: file,
            expectedVersion: result.metadata.versions[file],
            edits: [{ op: "replace", pos: lineRef(result.output, 2), lines: ["dos"] }],
          },
          ctx,
        )

        expect(await fs.readFile(file, "utf-8")).toBe("one\ndos\nthree\n")
      },
    })
  })

  test("returns fresh anchors for follow-up edits", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "file.txt")
    await fs.writeFile(file, "one\ntwo\nthree\n", "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        await FileTime.read(ctx.sessionID, file)
        const edit = await EditTool.init()
        const first = await edit.execute(
          {
            filePath: file,
            edits: [{ op: "replace", pos: ref(2, "two"), lines: ["dos"] }],
          },
          ctx,
        )

        await edit.execute(
          {
            filePath: file,
            edits: [{ op: "replace", pos: lineRef(first.output, 2), lines: ["tres"] }],
          },
          ctx,
        )

        expect(await fs.readFile(file, "utf-8")).toBe("one\ntres\nthree\n")
        expect(first.output).toContain("Updated lines:")
        expect(first.output).toContain("Reuse metadata.version as expectedVersion")
      },
    })
  })

  test("accepts refs from truncated read output for long lines", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "long.txt")
    await fs.writeFile(file, `${"x".repeat(3000)}\n`, "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const read = await ReadTool.init()
        const result = await read.execute({ filePath: file }, ctx)
        const edit = await EditTool.init()

        await edit.execute(
          {
            filePath: file,
            edits: [{ op: "replace", pos: lineRef(result.output, 1), lines: ["short"] }],
          },
          ctx,
        )

        expect(await fs.readFile(file, "utf-8")).toBe("short\n")
      },
    })
  })

  test("renders hashline output back to numbered lines for users", () => {
    const text = `<content>\n1#${computeLineHash(1, "alpha")}|alpha\n>>> 2#${computeLineHash(2, "beta")}|beta\nERROR [2#${computeLineHash(2, "beta")}:3] bad\n</content>`
    expect(renderNumberedOutput(text)).toContain("1: alpha")
    expect(renderNumberedOutput(text)).toContain(">>> 2: beta")
    expect(renderNumberedOutput(text)).toContain("ERROR [2:3] bad")
  })
})
