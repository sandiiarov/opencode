import { FileLine } from "../file/line"

const WORD = /[\p{L}\p{N}]/u
const OUT = /^(\s*(?:>>>\s*)?)([a-z0-9]{4})\|(\d+) (.*)$/i
const OLD_OUT = /^(\s*(?:>>>\s*)?)(\d+)#[a-z0-9]{2}(?:@[A-Za-z0-9_-]+)?\|(.*)$/i
const DIAGNOSTIC_REF = /\[([a-z0-9]{4})\|(\d+)\|(\d+)\]/gi
const OLD_DIAGNOSTIC_REF = /\[(\d+)#[a-z0-9]{2}(?::(\d+))?\]/gi
const ID = /^[a-z0-9]{4}$/i

export type Edit =
  | { op: "replace"; pos: string; end?: string; lines: string | string[] | null }
  | { op: "append"; pos?: string; lines: string | string[] | null }
  | { op: "prepend"; pos?: string; lines: string | string[] | null }

type Row = {
  id: string
  text: string
}

type Resolved =
  | { op: "replace"; start: number; end: number; lines: string | string[] | null }
  | { op: "append"; line?: number; lines: string | string[] | null }
  | { op: "prepend"; line?: number; lines: string | string[] | null }

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
      const legacy = item.match(OLD_OUT)
      if (legacy) return `${legacy[1]}${legacy[2]}: ${legacy[3]}`
      return item
        .replace(DIAGNOSTIC_REF, (_, id: string, row: string, col: string) => {
          const value = refs.get(id) ?? row
          return `[${value}:${col}]`
        })
        .replace(OLD_DIAGNOSTIC_REF, (_, row: string, col?: string) => `[${row}${col ? `:${col}` : ""}]`)
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
  if (edit.op === "replace") return edit.end
  return edit.line ?? Number.NEGATIVE_INFINITY
}

function overlap(edits: Resolved[]) {
  const list = edits
    .map((edit, i) => {
      if (edit.op !== "replace") return
      return { start: edit.start, end: edit.end, i }
    })
    .filter((item): item is { start: number; end: number; i: number } => Boolean(item))
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

function parseRef(ref: string) {
  const value = ref.trim().replace(/^(?:>>>|[+-])\s*/, "")
  if (ID.test(value)) return value
  throw new Error(`Invalid line reference format: "${ref}". Expected a plain line id like "ryh9".`)
}

function resolve(file: string, ref: string) {
  return FileLine.resolve(file, parseRef(ref))
}

function fail(file: string, refs: string[]) {
  throw new Error(
    `The targeted line ids no longer exist in ${file}: ${refs.join(", ")}\nThe file changed since those ids were observed. Read the file again before modifying it.`,
  )
}

function resolveEdits(file: string, edits: Edit[]) {
  const bad = [] as string[]
  const list = edits.map((edit) => {
    if (edit.op === "append" && !edit.pos) return { op: "append", lines: edit.lines } satisfies Resolved
    if (edit.op === "prepend" && !edit.pos) return { op: "prepend", lines: edit.lines } satisfies Resolved
    if (edit.op === "append") {
      const line = resolve(file, edit.pos!)
      if (typeof line !== "number") bad.push(parseRef(edit.pos!))
      return { op: "append", line, lines: edit.lines } satisfies Resolved
    }
    if (edit.op === "prepend") {
      const line = resolve(file, edit.pos!)
      if (typeof line !== "number") bad.push(parseRef(edit.pos!))
      return { op: "prepend", line, lines: edit.lines } satisfies Resolved
    }
    const startID = parseRef(edit.pos)
    const endID = parseRef(edit.end ?? edit.pos)
    const start = resolve(file, edit.pos)
    const end = resolve(file, edit.end ?? edit.pos)
    if (typeof start !== "number") bad.push(startID)
    if (typeof end !== "number" && endID !== startID) bad.push(endID)
    return { op: "replace", start: start ?? Number.NaN, end: end ?? Number.NaN, lines: edit.lines } satisfies Resolved
  })
  if (bad.length) fail(file, [...new Set(bad)])
  return list
}

export function canCreate(edits: Edit[]) {
  return edits.length > 0 && edits.every((edit) => (edit.op === "append" || edit.op === "prepend") && !edit.pos)
}

export function apply(file: string, content: string, edits: Edit[]) {
  const base = splitContent(content)
  FileLine.sync(file, content)
  const resolved = resolveEdits(file, edits)
  overlap(resolved)
  const list = [...resolved].sort((a, b) => {
    const line = target(b) - target(a)
    if (line) return line
    const rank = { replace: 0, append: 1, prepend: 2 }
    return rank[a.op] - rank[b.op]
  })
  let lines = [...base]
  for (const edit of list) {
    if (edit.op === "append" && !edit.line) {
      const add = clean(edit.lines)
      if (!add.length) throw new Error("append requires non-empty lines")
      lines = [...lines, ...add]
      continue
    }
    if (edit.op === "prepend" && !edit.line) {
      const add = clean(edit.lines)
      if (!add.length) throw new Error("prepend requires non-empty lines")
      lines = [...add, ...lines]
      continue
    }
    if (edit.op === "append") {
      const line = edit.line!
      let add = clean(edit.lines)
      if (!add.length) throw new Error("append requires non-empty lines")
      if (canTrimFirst(lines[line - 1] ?? "", add)) add = add.slice(1)
      if (canTrimLast(lines[line] ?? "", add)) add = add.slice(0, -1)
      if (!add.length) throw new Error("append requires non-empty lines")
      lines.splice(line, 0, ...add)
      continue
    }
    if (edit.op === "prepend") {
      const line = edit.line!
      let add = clean(edit.lines)
      if (!add.length) throw new Error("prepend requires non-empty lines")
      if (canTrimFirst(lines[line - 2] ?? "", add)) add = add.slice(1)
      if (canTrimLast(lines[line - 1] ?? "", add)) add = add.slice(0, -1)
      if (!add.length) throw new Error("prepend requires non-empty lines")
      lines.splice(line - 1, 0, ...add)
      continue
    }
    const start = edit.start
    const end = edit.end
    if (start > end) throw new Error(`Invalid range: start line ${start} cannot be greater than end line ${end}`)
    let add = clean(edit.lines)
    if (start > 1 && canTrimFirst(lines[start - 2] ?? "", add)) add = add.slice(1)
    if (end < lines.length && canTrimLast(lines[end] ?? "", add)) add = add.slice(0, -1)
    if (add.length) add[0] = indent(lines[start - 1] ?? "", add[0])
    lines.splice(start - 1, end - start + 1, ...add)
  }
  return lines.join("\n")
}
