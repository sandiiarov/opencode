import z from "zod"
import * as path from "path"
import { Tool } from "./tool"
import { LSP } from "../lsp"
import { createTwoFilesPatch } from "diff"
import DESCRIPTION from "./write.txt"
import { Bus } from "../bus"
import { File } from "../file"
import { FileWatcher } from "../file/watcher"
import { FileTime } from "../file/time"
import { Filesystem } from "../util/filesystem"
import { Instance } from "../project/instance"
import { trimDiff } from "./edit"
import { assertExternalDirectory } from "./external-directory"
import { changedPreview } from "./hashline"

const MAX_DIAGNOSTICS_PER_FILE = 20
const MAX_PROJECT_DIAGNOSTICS_FILES = 5

async function lines(file: string) {
  const text = await Filesystem.readText(file).catch(() => "")
  return text.split("\n")
}

export const WriteTool = Tool.define("write", {
  description: DESCRIPTION,
  parameters: z.object({
    content: z.string().describe("The content to write to the file"),
    filePath: z.string().describe("The absolute path to the file to write (must be absolute, not relative)"),
    expectedVersion: z
      .string()
      .optional()
      .describe("Optional file version token from a prior read, edit, or write result"),
  }),
  async execute(params, ctx) {
    const filepath = path.isAbsolute(params.filePath) ? params.filePath : path.join(Instance.directory, params.filePath)
    await assertExternalDirectory(ctx, filepath)

    const exists = await Filesystem.exists(filepath)
    const contentOld = exists ? await Filesystem.readText(filepath) : ""
    if (exists) await FileTime.assert(ctx.sessionID, filepath, params.expectedVersion)

    const diff = trimDiff(createTwoFilesPatch(filepath, filepath, contentOld, params.content))
    await ctx.ask({
      permission: "edit",
      patterns: [path.relative(Instance.worktree, filepath)],
      always: ["*"],
      metadata: {
        filepath,
        diff,
      },
    })

    await Filesystem.write(filepath, params.content)
    await Bus.publish(File.Event.Edited, {
      file: filepath,
    })
    await Bus.publish(FileWatcher.Event.Updated, {
      file: filepath,
      event: exists ? "change" : "add",
    })
    const version = await FileTime.read(ctx.sessionID, filepath)

    let output = "Wrote file successfully."
    const preview = changedPreview(contentOld, params.content)
    if (preview) output += `\n\nUpdated lines:\n<content>\n${preview}\n</content>`
    output += `\n\nReuse metadata.version as expectedVersion to avoid rereading before the next edit or write.`
    await LSP.touchFile(filepath, true)
    const diagnostics = await LSP.diagnostics()
    const normalizedFilepath = Filesystem.normalizePath(filepath)
    let projectDiagnosticsCount = 0
    for (const [file, issues] of Object.entries(diagnostics)) {
      const problems = LSP.Diagnostic.sort(issues.filter(LSP.Diagnostic.visible))
      if (problems.length === 0) continue
      const limited = problems.slice(0, MAX_DIAGNOSTICS_PER_FILE)
      const suffix =
        problems.length > MAX_DIAGNOSTICS_PER_FILE ? `\n... and ${problems.length - MAX_DIAGNOSTICS_PER_FILE} more` : ""
      const source = file === normalizedFilepath ? params.content.split("\n") : await lines(file)
      const rendered = limited.map((item) => LSP.Diagnostic.pretty(item, source[item.range.start.line])).join("\n")
      if (file === normalizedFilepath) {
        output += `\n\nLSP diagnostics detected in this file, please review:\n<diagnostics file="${filepath}">\n${rendered}${suffix}\n</diagnostics>`
        continue
      }
      if (projectDiagnosticsCount >= MAX_PROJECT_DIAGNOSTICS_FILES) continue
      projectDiagnosticsCount++
      output += `\n\nLSP diagnostics detected in other files:\n<diagnostics file="${file}">\n${rendered}${suffix}\n</diagnostics>`
    }

    return {
      title: path.relative(Instance.worktree, filepath),
      metadata: {
        diagnostics,
        filepath,
        exists: exists,
        version,
      },
      output,
    }
  },
})
