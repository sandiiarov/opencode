import z from "zod"
import * as path from "path"
import { createTwoFilesPatch, diffLines } from "diff"
import { Tool } from "./tool"
import { LSP } from "../lsp"
import DESCRIPTION from "./edit.txt"
import { File } from "../file"
import { FileWatcher } from "../file/watcher"
import { Bus } from "../bus"
import { FileTime } from "../file/time"
import { Filesystem } from "../util/filesystem"
import { Instance } from "../project/instance"
import { assertExternalDirectory } from "./external-directory"
import { apply, changedPreview, type Edit } from "./hashline"
import { FileLine } from "../file/line"

const MAX_DIAGNOSTICS = 20

const Params = z.object({
  filePath: z.string().describe("The absolute path to the file to modify"),
  edits: z
    .array(
      z.object({
        start: z.string().describe("Inclusive start line id"),
        end: z.string().optional().describe("Inclusive end line id for range replacements"),
        lines: z
          .union([z.array(z.string()), z.string(), z.null()])
          .optional()
          .describe("Replacement lines without line id prefixes"),
      }),
    )
    .default([])
    .describe("Line-id edits to apply against the original file state"),
})

export const EditTool = Tool.define("edit", {
  description: DESCRIPTION,
  parameters: Params,
  async execute(params, ctx) {
    if (!params.filePath) throw new Error("filePath is required")

    const filePath = path.isAbsolute(params.filePath) ? params.filePath : path.join(Instance.directory, params.filePath)

    await assertExternalDirectory(ctx, filePath)

    if (params.edits.length === 0) throw new Error("edits must be a non-empty array")

    let before = ""
    let after = ""
    let body = ""
    let diff = ""
    let out = "Edit applied successfully."
    const target = filePath
    let rows = [] as ReturnType<typeof FileLine.sync>

    await FileTime.withLock(filePath, async () => {
      const stat = Filesystem.stat(filePath)
      const exists = Boolean(stat)
      if (stat?.isDirectory()) throw new Error(`Path is a directory, not a file: ${filePath}`)
      if (exists) await FileTime.assert(ctx.sessionID, filePath)
      if (!exists) throw new Error(`File ${filePath} not found`)

      const raw = exists ? Buffer.from(await Filesystem.readBytes(filePath)).toString("utf-8") : ""
      const hadBom = raw.startsWith("\uFEFF")
      const ending = raw.includes("\r\n") ? "\r\n" : "\n"
      before = raw
        .replace(/^\uFEFF/, "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
      after = apply(filePath, before, params.edits as Edit[])
      if (after === before) {
        throw new Error("No changes to apply: edits produced identical content.")
      }
      const trailing = /\n$/.test(before)
      body = trailing && after !== "" ? `${after}\n` : after
      diff = trimDiff(createTwoFilesPatch(target, target, before, body))
      const rel = path.relative(Instance.worktree, target).replaceAll("\\", "/")
      await ctx.ask({
        permission: "edit",
        patterns: [rel],
        always: ["*"],
        metadata: {
          filepath: rel,
          diff,
        },
      })
      const text = hadBom
        ? `\uFEFF${ending === "\n" ? body : body.replaceAll("\n", "\r\n")}`
        : ending === "\n"
          ? body
          : body.replaceAll("\n", "\r\n")
      await Filesystem.write(target, text)
      rows = FileLine.sync(target, body)
      await Bus.publish(File.Event.Edited, { file: target })
      await Bus.publish(FileWatcher.Event.Updated, { file: target, event: "change" })
      await FileTime.read(ctx.sessionID, target)
    })

    let additions = 0
    let deletions = 0
    for (const item of diffLines(before, body)) {
      if (item.added) additions += item.count || 0
      if (item.removed) deletions += item.count || 0
    }

    const filediff = {
      file: target,
      before,
      after: body,
      additions,
      deletions,
    }

    const diagnostics = await report(target)
    const preview = changedPreview(target, before, body)
    if (preview) out += `\n\nUpdated lines:\n<content>\n${preview}\n</content>`
    const list = diagnostics[Filesystem.normalizePath(target)] ?? []
    const show = LSP.Diagnostic.sort(list.filter(LSP.Diagnostic.visible)).slice(0, MAX_DIAGNOSTICS)
    if (show.length) {
      out += `\n\nLSP diagnostics detected in this file, please review:\n<diagnostics file="${target}">\n${show.map((item) => LSP.Diagnostic.pretty(item, rows[item.range.start.line]?.id)).join("\n")}\n</diagnostics>`
    }

    return {
      title: path.relative(Instance.worktree, target),
      output: out,
      metadata: {
        diagnostics,
        diff,
        filediff,
      },
    }
  },
})

async function report(file: string) {
  await LSP.touchFile(file, true)
  return LSP.diagnostics()
}

export function trimDiff(diff: string) {
  const lines = diff.split("\n")
  const body = lines.filter(
    (line) =>
      (line.startsWith("+") || line.startsWith("-") || line.startsWith(" ")) &&
      !line.startsWith("+++") &&
      !line.startsWith("---"),
  )
  if (!body.length) return diff

  let min = Infinity
  for (const line of body) {
    const text = line.slice(1)
    if (!text.trim()) continue
    min = Math.min(min, text.match(/^(\s*)/)?.[1].length ?? 0)
  }
  if (!Number.isFinite(min) || min <= 0) return diff

  return lines
    .map((line) => {
      if (
        (line.startsWith("+") || line.startsWith("-") || line.startsWith(" ")) &&
        !line.startsWith("+++") &&
        !line.startsWith("---")
      ) {
        return line[0] + line.slice(1 + min)
      }
      return line
    })
    .join("\n")
}
