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
import { renderNumberedOutput } from "../../src/tool/hashline"
import { FileLine } from "../../src/file/line"

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

async function ref(file: string, line: number) {
  const text = await fs.readFile(file, "utf-8")
  return FileLine.sync(file, text)[line - 1]!.id
}

function lineRef(output: string, line: number) {
  const body = output.includes("<content>") ? output.slice(output.indexOf("<content>") + 9) : output
  const hit = body
    .split("\n")
    .map((item) => item.trimStart())
    .filter((item) => /^(?:>>>\s*)?[a-z0-9]{4}\|/i.test(item))[line - 1]
  if (!hit) throw new Error(`Missing line id for line ${line}`)
  return hit.replace(/^>>>\s*/, "").split("|")[0]
}

describe("tool.edit", () => {
  test("replaces a line using line ids", async () => {
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
            edits: [{ op: "replace", pos: await ref(file, 2), lines: ["dos"] }],
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
              edits: [{ op: "replace", pos: await ref(file, 2), lines: ["dos"] }],
            },
            ctx,
          ),
        ).rejects.toThrow("You must read file")
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
              edits: [{ op: "replace", pos: await ref(file, 2), lines: ["dos"] }],
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
            edits: [{ op: "replace", pos: await ref(file, 1), lines: ["done"] }],
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

  test("uses line ids returned by the read tool", async () => {
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

  test("rejects non-id edit references", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "file.txt")
    await fs.writeFile(file, "one\ntwo\nthree\n", "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const read = await ReadTool.init()
        const snapshot = await read.execute({ filePath: file }, ctx)
        const id = lineRef(snapshot.output, 2)
        const edit = await EditTool.init()

        await expect(
          edit.execute(
            {
              filePath: file,
              edits: [{ op: "replace", pos: `${id}|two`, lines: ["dos"] }],
            },
            ctx,
          ),
        ).rejects.toThrow('Expected a plain line id like "ryh9"')

        await expect(
          edit.execute(
            {
              filePath: file,
              edits: [{ op: "replace", pos: "2#aa", lines: ["dos"] }],
            },
            ctx,
          ),
        ).rejects.toThrow('Expected a plain line id like "ryh9"')
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
            edits: [{ op: "replace", pos: await ref(file, 2), lines: ["tres"] }],
          },
          ctx,
        )

        expect(await fs.readFile(file, "utf-8")).toBe("uno\ntres\n")
      },
    })
  })

  test("uses line ids returned by the grep tool", async () => {
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
            edits: [{ op: "replace", pos: lineRef(result.output, 1), lines: ["dos"] }],
          },
          ctx,
        )

        expect(await fs.readFile(file, "utf-8")).toBe("one\ndos\nthree\n")
      },
    })
  })

  test("returns fresh line ids for follow-up edits", async () => {
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
            edits: [{ op: "replace", pos: await ref(file, 2), lines: ["dos"] }],
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
      },
    })
  })

  test("builds diff from final newline-preserving content", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "file.json")
    await fs.writeFile(file, ["{", '  "items": [', '    "one",', '    "two"', "  ]", "}", ""].join("\n"), "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        await FileTime.read(ctx.sessionID, file)
        const edit = await EditTool.init()
        const result = await edit.execute(
          {
            filePath: file,
            edits: [{ op: "replace", pos: await ref(file, 4), lines: ['    "done"'] }],
          },
          ctx,
        )

        expect(await fs.readFile(file, "utf-8")).toBe(
          ["{", '  "items": [', '    "one",', '    "done"', "  ]", "}", ""].join("\n"),
        )
        expect(result.metadata.diff).toContain('-    "two"')
        expect(result.metadata.diff).toContain('+    "done"')
        expect(result.metadata.diff).not.toContain("-}")
        expect(result.metadata.diff).not.toContain("+}")
      },
    })
  })

  test("accepts line ids from truncated read output for long lines", async () => {
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

  test("trims adjacent duplicate lines from replace edits", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "file.txt")
    await fs.writeFile(
      file,
      [
        'import { keep } from "./keep"',
        "// remove one",
        "// remove two",
        "// remove three",
        "// Explicitly exit to avoid any hanging subprocesses.",
        "process.exit()",
        "",
      ].join("\n"),
      "utf-8",
    )

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        await FileTime.read(ctx.sessionID, file)
        const edit = await EditTool.init()

        await edit.execute(
          {
            filePath: file,
            edits: [
              {
                op: "replace",
                pos: await ref(file, 2),
                end: await ref(file, 4),
                lines: ["// Explicitly exit to avoid any hanging subprocesses."],
              },
            ],
          },
          ctx,
        )

        expect(await fs.readFile(file, "utf-8")).toBe(
          [
            'import { keep } from "./keep"',
            "// Explicitly exit to avoid any hanging subprocesses.",
            "process.exit()",
            "",
          ].join("\n"),
        )
      },
    })
  })

  test("trims leading adjacent duplicate lines from replace edits", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "file.txt")
    await fs.writeFile(
      file,
      [
        'import { keep } from "./keep"',
        "// Explicitly exit to avoid any hanging subprocesses.",
        "// remove one",
        "// remove two",
        "// remove three",
        "process.exit()",
        "",
      ].join("\n"),
      "utf-8",
    )

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        await FileTime.read(ctx.sessionID, file)
        const edit = await EditTool.init()

        await edit.execute(
          {
            filePath: file,
            edits: [
              {
                op: "replace",
                pos: await ref(file, 3),
                end: await ref(file, 5),
                lines: ["// Explicitly exit to avoid any hanging subprocesses."],
              },
            ],
          },
          ctx,
        )

        expect(await fs.readFile(file, "utf-8")).toBe(
          [
            'import { keep } from "./keep"',
            "// Explicitly exit to avoid any hanging subprocesses.",
            "process.exit()",
            "",
          ].join("\n"),
        )
      },
    })
  })

  test("trims structural duplicate lines from replace edits", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "package.json")
    await fs.writeFile(
      file,
      [
        "{",
        '  "scripts": {',
        '    "build": "bun run script/build.ts"',
        "  },",
        '  "bin": {',
        '    "kx": "./bin/kx"',
        "  },",
        "}",
        "",
      ].join("\n"),
      "utf-8",
    )

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        await FileTime.read(ctx.sessionID, file)
        const edit = await EditTool.init()

        await edit.execute(
          {
            filePath: file,
            edits: [
              {
                op: "replace",
                pos: await ref(file, 2),
                end: await ref(file, 3),
                lines: [
                  '  "scripts": {',
                  '    "build": "bun run script/build.ts",',
                  '    "schema": "bun run script/schema.ts"',
                  "  }",
                ],
              },
            ],
          },
          ctx,
        )

        expect(await fs.readFile(file, "utf-8")).toBe(
          [
            "{",
            '  "scripts": {',
            '    "build": "bun run script/build.ts",',
            '    "schema": "bun run script/schema.ts"',
            "  },",
            '  "bin": {',
            '    "kx": "./bin/kx"',
            "  },",
            "}",
            "",
          ].join("\n"),
        )
      },
    })
  })

  test("reuses original read anchors after line shifts", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "file.txt")
    await fs.writeFile(file, ["Aad", "adkad", "askdlj", "adaskjas", ""].join("\n"), "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const read = await ReadTool.init()
        const snapshot = await read.execute({ filePath: file }, ctx)
        const second = lineRef(snapshot.output, 2)
        const third = lineRef(snapshot.output, 3)
        const tail = lineRef(snapshot.output, 4)

        const edit = await EditTool.init()
        await edit.execute(
          {
            filePath: file,
            edits: [
              {
                op: "replace",
                pos: second,
                end: third,
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

        expect(await fs.readFile(file, "utf-8")).toBe(["Aad", "two", "three", "four", "five", "tail", ""].join("\n"))
      },
    })
  })

  test("keeps punctuation-only line ids stable", async () => {
    await using tmp = await tmpdir()
    const file = path.join(tmp.path, "file.ts")
    await fs.writeFile(file, ["const x = () => {", "  run()", "}", "after()", ""].join("\n"), "utf-8")

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const read = await ReadTool.init()
        const snapshot = await read.execute({ filePath: file }, ctx)
        const body = lineRef(snapshot.output, 2)
        const close = lineRef(snapshot.output, 3)

        const edit = await EditTool.init()
        await edit.execute(
          {
            filePath: file,
            edits: [
              {
                op: "replace",
                pos: body,
                lines: ["  run()", "  more()", "  done()"],
              },
            ],
          },
          ctx,
        )

        await edit.execute(
          {
            filePath: file,
            edits: [{ op: "prepend", pos: close, lines: ["  cleanup()"] }],
          },
          ctx,
        )

        expect(await fs.readFile(file, "utf-8")).toBe(
          ["const x = () => {", "  run()", "  more()", "  done()", "  cleanup()", "}", "after()", ""].join("\n"),
        )
      },
    })
  })

  test("renders hashline output back to numbered lines for users", () => {
    const text = `<content>\na1b2|1 alpha\n>>> c3d4|2 beta\nERROR [c3d4|2|3] bad\n</content>`
    expect(renderNumberedOutput(text)).toContain("1: alpha")
    expect(renderNumberedOutput(text)).toContain(">>> 2: beta")
    expect(renderNumberedOutput(text)).toContain("ERROR [2:3] bad")
  })
})
