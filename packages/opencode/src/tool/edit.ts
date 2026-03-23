import z from "zod"
import * as fs from "fs/promises"
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
import { apply, canCreate, type Edit } from "./hashline"

const MAX_DIAGNOSTICS = 20

const Params = z.object({
  filePath: z.string().describe("The absolute path to the file to modify"),
  delete: z.boolean().optional().describe("Delete the file instead of editing it"),
  rename: z.string().optional().describe("Rename the file after applying edits"),
  edits: z
    .array(
      z.object({
        op: z.enum(["replace", "append", "prepend"]).describe("The additive edit operation to apply"),
        pos: z.string().optional().describe("Primary LINE#ID anchor from the read output"),
        end: z.string().optional().describe("Inclusive end LINE#ID anchor for range replacements"),
        lines: z
          .union([z.array(z.string()), z.string(), z.null()])
          .optional()
          .describe("Replacement or inserted lines without LINE#ID prefixes"),
      }),
    )
    .default([])
    .describe("Hashline edits to apply against the original file state"),
})

export const EditTool = Tool.define("edit", {
  description: DESCRIPTION,
  parameters: Params,
  async execute(params, ctx) {
    if (!params.filePath) throw new Error("filePath is required")

    const filePath = path.isAbsolute(params.filePath) ? params.filePath : path.join(Instance.directory, params.filePath)
    const movePath = params.rename
      ? path.isAbsolute(params.rename)
        ? params.rename
        : path.join(Instance.directory, params.rename)
      : undefined

    await assertExternalDirectory(ctx, filePath)
    await assertExternalDirectory(ctx, movePath)

    if (params.delete && movePath) throw new Error("delete and rename cannot be used together")
    if (params.delete && params.edits.length > 0) throw new Error("delete mode requires edits to be an empty array")
    if (!params.delete && params.edits.length === 0) throw new Error("edits must be a non-empty array")

    let before = ""
    let after = ""
    let diff = ""
    let out = "Edit applied successfully."
    let target = movePath && movePath !== filePath ? movePath : filePath
    let kind: "add" | "change" | "unlink" = "change"

    await FileTime.withLock(filePath, async () => {
      const stat = Filesystem.stat(filePath)
      const exists = Boolean(stat)
      if (stat?.isDirectory()) throw new Error(`Path is a directory, not a file: ${filePath}`)
      if (exists) await FileTime.assert(ctx.sessionID, filePath)
      if (!exists && params.delete) throw new Error(`File ${filePath} not found`)
      if (!exists && !canCreate(params.edits as Edit[])) throw new Error(`File ${filePath} not found`)

      const raw = exists ? Buffer.from(await Filesystem.readBytes(filePath)).toString("utf-8") : ""
      const hadBom = raw.startsWith("\uFEFF")
      const ending = raw.includes("\r\n") ? "\r\n" : "\n"
      before = raw
        .replace(/^\uFEFF/, "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
      after = params.delete ? "" : apply(before, params.edits as Edit[])
      if (!params.delete && !movePath && after === before) {
        throw new Error("No changes to apply: edits produced identical content.")
      }

      diff = trimDiff(createTwoFilesPatch(target, target, before, after))
      const rel = [filePath, target]
        .filter((item, i, arr): item is string => Boolean(item) && arr.indexOf(item) === i)
        .map((item) => path.relative(Instance.worktree, item).replaceAll("\\", "/"))
      await ctx.ask({
        permission: "edit",
        patterns: rel,
        always: ["*"],
        metadata: {
          filepath: rel.join(", "),
          diff,
        },
      })

      if (params.delete) {
        await fs.unlink(filePath)
        await Bus.publish(FileWatcher.Event.Updated, { file: filePath, event: "unlink" })
        out = "Deleted file successfully."
        kind = "unlink"
        target = filePath
        return
      }

      const text = hadBom
        ? `\uFEFF${ending === "\n" ? after : after.replaceAll("\n", "\r\n")}`
        : ending === "\n"
          ? after
          : after.replaceAll("\n", "\r\n")
      await Filesystem.write(target, text)
      if (movePath && movePath !== filePath && exists) {
        await fs.unlink(filePath)
        await Bus.publish(FileWatcher.Event.Updated, { file: filePath, event: "unlink" })
        kind = "add"
        out = `Edit applied successfully. Moved file to ${path.relative(Instance.worktree, target)}`
      } else {
        kind = exists ? "change" : "add"
      }

      await Bus.publish(File.Event.Edited, { file: target })
      await Bus.publish(FileWatcher.Event.Updated, { file: target, event: kind })
      await FileTime.read(ctx.sessionID, target)
    })

    let additions = 0
    let deletions = 0
    for (const item of diffLines(before, after)) {
      if (item.added) additions += item.count || 0
      if (item.removed) deletions += item.count || 0
    }

    const filediff = {
      file: target,
      before,
      after,
      additions,
      deletions,
    }

    const diagnostics = params.delete ? {} : await report(target)
    if (!params.delete) {
      const list = diagnostics[Filesystem.normalizePath(target)] ?? []
      const show = LSP.Diagnostic.sort(list.filter(LSP.Diagnostic.visible)).slice(0, MAX_DIAGNOSTICS)
      if (show.length) {
        out += `\n\nLSP diagnostics detected in this file, please review:\n<diagnostics file=\"${target}\">\n${show.map(LSP.Diagnostic.pretty).join("\n")}\n</diagnostics>`
      }
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
