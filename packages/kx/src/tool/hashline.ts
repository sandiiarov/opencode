import { FileLine } from "../file/line"

const WORD = /[\p{L}\p{N}]/u
const OUT = /^(\s*(?:>>>\s*)?)([a-z0-9]{4})\|(\d+) (.*)$/i
const DIAGNOSTIC_REF = /\[([a-z0-9]{4})\|(\d+)\|(\d+)\]/gi
const ID = /^[a-z0-9]{4}$/i
const TOKEN = /^([a-z0-9]{4})\|(\d+)(?:\s|$)/i
const DIAGNOSTIC = /^\[([a-z0-9]{4})\|(\d+)\|(\d+)\]$/i
const NUMBER = /^\d+$/

export type Edit = { start: string; end?: string; lines: string | string[] | null }
type Row = {
  id: string
  text: string
}

type Resolved = { start: number; end: number; lines: string | string[] | null }
export function splitContent(text: string) {
  const lines = text.split(/\r?\n/)
  if (lines.at(-1) === "") lines.pop()
  return lines
}

export function computeLineHash(line: number, content: string) {
  const text = content.replace(/\r/g, "").trimEnd()
  const seed = WORD.test(text) ? 0 : line
  return (Bun.hash.xxHash32(text, seed) % 256).toString(36).padStart(2, "0").slice(0, 2)
}

export function formatLine(item: Row, display = item.text, line?: number) {
  return FileLine.format(item, display, line)
}

export function renderNumberedOutput(text: string) {
  const refs = new Map<string, number>()
  let line = 0
  return text
    .split("\n")
    .map((item) => {
      const match = item.match(OUT)
      if (match) {
        const lineNum = Number.parseInt(match[3], 10)
        line = Number.isNaN(lineNum) ? line + 1 : lineNum
        refs.set(match[2], line)
        return `${match[1]}${line}: ${match[4]}`
      }
      return item.replace(DIAGNOSTIC_REF, (_, id: string, row: string, col: string) => {
        const value = refs.get(id) ?? row
        return `[${value}:${col}]`
      })
    })
    .join("\n")
}

export function changedPreview(file: string, before: string, after: string) {
  const prev = splitContent(before)
  const next = FileLine.sync(file, after)
  if (prev.length === 0 && next.length === 0) return ""
  let start = 0
  while (start < prev.length && start < next.length && prev[start] === next[start].text) start++
  let prevEnd = prev.length - 1
  let nextEnd = next.length - 1
  while (prevEnd >= start && nextEnd >= start && prev[prevEnd] === next[nextEnd].text) {
    prevEnd--
    nextEnd--
  }
  if (next.length === 0) return ""
  const from = Math.max(0, start - 1)
  const to = Math.min(next.length - 1, Math.max(start, nextEnd + 1))
  const out = [] as string[]
  if (from > 0) out.push("...")
  for (let i = from; i <= to; i++)
    out.push(`${i >= start && i <= nextEnd ? ">>> " : ""}${formatLine(next[i], next[i].text, i + 1)}`)
  return out.join("\n")
}

function clean(lines: string | string[] | null) {
  const list = lines === null ? [] : Array.isArray(lines) ? lines : lines.split("\n")
  let ids = 0
  let diff = 0
  let seen = 0
  for (const line of list) {
    if (!line) continue
    seen++
    if (/^\s*(?:>>>\s*)?[a-z0-9]{4}\|\d+ /i.test(line)) ids++
    if (/^\+(?!\+)/.test(line)) diff++
  }
  const stripID = seen > 0 && ids >= seen / 2
  const stripDiff = !stripID && seen > 0 && diff >= seen / 2
  return list.map((line) => {
    if (stripID) return line.replace(/^\s*(?:>>>\s*)?[a-z0-9]{4}\|\d+ /i, "")
    if (stripDiff) return line.replace(/^\+(?!\+)/, "")
    return line
  })
}

function normalize(line: string) {
  const text = line.replace(/\s+/g, "")
  if (/^[\]})](?:[,;])?$/.test(text)) return text.replace(/[;,]$/, "")
  return text
}

function same(a: string, b: string) {
  return a === b || normalize(a) === normalize(b)
}

function indent(base: string, line: string) {
  if (!line || /^\s/.test(line)) return line
  const match = base.match(/^\s*/)?.[0] ?? ""
  if (!match || base.trim() === line.trim()) return line
  return match + line
}
function target(edit: Resolved) {
  return edit.end
}

function overlap(edits: Resolved[]) {
  const list = edits
    .map((edit, i) => ({ start: edit.start, end: edit.end, i }))
    .sort((a, b) => a.start - b.start || a.end - b.end)
  for (let i = 1; i < list.length; i++) {
    if (list[i].start <= list[i - 1].end) {
      throw new Error(
        `Overlapping range edits detected: edit ${list[i - 1].i + 1} overlaps with edit ${list[i].i + 1}. Use smaller additive edits.`,
      )
    }
  }
}

function canTrimFirst(anchor: string, list: string[]) {
  return list.length > 0 && same(list[0], anchor)
}

function canTrimLast(anchor: string, list: string[]) {
  return list.length > 0 && same(list[list.length - 1], anchor)
}

function lineAt(file: string, line: number) {
  const rows = FileLine.get(file)?.lines
  if (!rows) return
  return { total: rows.length, row: rows[line - 1] }
}

function invalidRef(file: string, ref: string, value: string) {
  const token = value.match(TOKEN)
  if (token) {
    const [, id, row] = token
    const line = Number.parseInt(row, 10)
    const hit = lineAt(file, line)
    const msg = `Invalid line reference format: "${ref}". You passed a full line token. Use only the plain line id "${id}".`
    if (!hit?.row || hit.row.id === id) return msg
    return `${msg}\nThat token looks stale: line ${line} currently has id "${hit.row.id}".`
  }

  const diagnostic = value.match(DIAGNOSTIC)
  if (diagnostic) {
    const [, id] = diagnostic
    return `Invalid line reference format: "${ref}". You passed a diagnostic reference. Use only the plain line id "${id}".`
  }

  if (NUMBER.test(value)) {
    const line = Number.parseInt(value, 10)
    const hit = lineAt(file, line)
    if (hit?.row) {
      return `Invalid line reference format: "${ref}". Expected a plain line id like "${hit.row.id}", not a line number. Line ${line} currently has id "${hit.row.id}".`
    }
    if (hit)
      return `Invalid line reference format: "${ref}". Line ${line} is out of range for this file (${hit.total} lines). Expected a plain line id like "ryh9".`
  }

  return `Invalid line reference format: "${ref}". Expected a plain line id like "ryh9".`
}

function parseRef(file: string, ref: string) {
  const value = ref.trim().replace(/^(?:>>>|[+-])\s*/, "")
  if (ID.test(value)) return value
  throw new Error(invalidRef(file, ref, value))
}

function resolve(file: string, ref: string) {
  return FileLine.resolve(file, parseRef(file, ref))
}

function fail(file: string, refs: string[]) {
  throw new Error(
    `The targeted line ids no longer exist in ${file}: ${refs.join(", ")}\nThe file changed since those ids were observed. Use fresh line ids from the latest read, grep, edit, or write output before modifying it.`,
  )
}

function resolveEdits(file: string, edits: Edit[]) {
  const bad = [] as string[]
  const list = edits.map((edit) => {
    const startID = parseRef(file, edit.start)
    const endID = parseRef(file, edit.end ?? edit.start)
    const start = resolve(file, edit.start)
    const end = resolve(file, edit.end ?? edit.start)
    if (typeof start !== "number") bad.push(startID)
    if (typeof end !== "number" && endID !== startID) bad.push(endID)
    return { start: start ?? Number.NaN, end: end ?? Number.NaN, lines: edit.lines } satisfies Resolved
  })
  if (bad.length) fail(file, [...new Set(bad)])
  return list
}

export function apply(file: string, content: string, edits: Edit[]) {
  const base = splitContent(content)
  FileLine.sync(file, content)
  const resolved = resolveEdits(file, edits)
  overlap(resolved)
  const list = [...resolved].sort((a, b) => {
    const line = target(b) - target(a)
    if (line) return line
    return b.start - a.start
  })
  const lines = [...base]
  for (const edit of list) {
    const start = edit.start
    const end = edit.end
    if (start > end)
      throw new Error(
        `Invalid range: start line ${start} cannot be greater than end line ${end}. Check whether start and end were swapped.`,
      )
    let add = clean(edit.lines)
    if (start > 1 && canTrimFirst(lines[start - 2] ?? "", add)) add = add.slice(1)
    if (end < lines.length && canTrimLast(lines[end] ?? "", add)) add = add.slice(0, -1)
    if (add.length) add[0] = indent(lines[start - 1] ?? "", add[0])
    lines.splice(start - 1, end - start + 1, ...add)
  }
  return lines.join("\n")
}
