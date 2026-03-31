const NIBBLE = "ZPMQVRWSNKTXJBYH"
const HASH = Array.from({ length: 256 }, (_, i) => `${NIBBLE[i >>> 4]}${NIBBLE[i & 0x0f]}`)
const REF = /^([0-9]+)#([ZPMQVRWSNKTXJBYH]{2})(?:@([A-Za-z0-9_-]+))?$/
const OUT = /^(\s*(?:>>>\s*)?)([0-9]+)#([ZPMQVRWSNKTXJBYH]{2})(?:@([A-Za-z0-9_-]+))?\|(.*)$/
const DIAGNOSTIC_REF = /\[(\d+)#[ZPMQVRWSNKTXJBYH]{2}(?::(\d+))?\]/g
const WORD = /[\p{L}\p{N}]/u

type Anchor = {
  text: string
  before: string
  after: string
  ordinal: number
}

export type Edit =
  | { op: "replace"; pos: string; end?: string; lines: string | string[] | null }
  | { op: "append"; pos?: string; lines: string | string[] | null }
  | { op: "prepend"; pos?: string; lines: string | string[] | null }

type Ref = {
  line: number
  hash: string
  anchor?: Anchor
}

type Mismatch = {
  line: number
  hash: string
}

type Resolved =
  | { op: "replace"; start: number; end: number; lines: string | string[] | null }
  | { op: "append"; line?: number; lines: string | string[] | null }
  | { op: "prepend"; line?: number; lines: string | string[] | null }

export function computeLineHash(line: number, content: string) {
  const text = content.replace(/\r/g, "").trimEnd()
  const seed = WORD.test(text) ? 0 : line
  return HASH[Bun.hash.xxHash32(text, seed) % 256]
}

function stableText(content: string) {
  return content.replace(/\r/g, "").trimEnd()
}

function stableHash(content: string) {
  return Bun.hash.xxHash32(stableText(content), 0).toString(36)
}

function ordinal(lines: string[], index: number) {
  const hash = stableHash(lines[index] ?? "")
  let seen = 0
  for (let i = 0; i <= index; i++) {
    if (stableHash(lines[i] ?? "") === hash) seen++
  }
  return seen
}

function encode(anchor: Anchor) {
  return Buffer.from(JSON.stringify(anchor)).toString("base64url")
}

function decode(token: string) {
  try {
    const json = Buffer.from(token, "base64url").toString("utf-8")
    const value = JSON.parse(json)
    if (
      typeof value === "object" &&
      value &&
      typeof value.text === "string" &&
      typeof value.before === "string" &&
      typeof value.after === "string" &&
      typeof value.ordinal === "number"
    ) {
      return value as Anchor
    }
  } catch {}
}

function anchor(lines: string[], index: number) {
  return encode({
    text: stableHash(lines[index] ?? ""),
    before: index > 0 ? stableHash(lines[index - 1] ?? "") : "",
    after: index + 1 < lines.length ? stableHash(lines[index + 1] ?? "") : "",
    ordinal: ordinal(lines, index),
  })
}

export function formatHashLine(line: number, content: string, display = content, token?: string) {
  return `${line}#${computeLineHash(line, content)}${token ? `@${token}` : ""}|${display}`
}

export function formatFileLine(lines: string[], index: number, display = lines[index] ?? "", line = index + 1) {
  return formatHashLine(line, lines[index] ?? "", display, anchor(lines, index))
}

export function renderNumberedOutput(text: string) {
  return text
    .split("\n")
    .map((line) => {
      const match = line.match(OUT)
      if (match) return `${match[1]}${match[2]}: ${match[5]}`
      return line.replace(DIAGNOSTIC_REF, (_, row: string, col?: string) => `[${row}${col ? `:${col}` : ""}]`)
    })
    .join("\n")
}

export function changedPreview(before: string, after: string) {
  const prev = contentLines(before)
  const next = contentLines(after)
  if (prev.length === 0 && next.length === 0) return ""

  let start = 0
  while (start < prev.length && start < next.length && prev[start] === next[start]) start++

  let prevEnd = prev.length - 1
  let nextEnd = next.length - 1
  while (prevEnd >= start && nextEnd >= start && prev[prevEnd] === next[nextEnd]) {
    prevEnd--
    nextEnd--
  }

  if (next.length === 0) return ""

  const from = Math.max(0, start - 1)
  const to = Math.min(next.length - 1, Math.max(start, nextEnd + 1))
  const out = [] as string[]
  if (from > 0) out.push("...")

  for (let i = from; i <= to; i++) {
    const mark = i >= start && i <= nextEnd ? ">>> " : ""
    out.push(`${mark}${formatFileLine(next, i)}`)
  }

  if (to < next.length - 1) out.push("...")
  return out.join("\n")
}

function contentLines(text: string) {
  const lines = text.split("\n")
  if (lines.at(-1) === "") lines.pop()
  return lines
}

function parse(ref: string) {
  const text = ref
    .trim()
    .replace(/^(?:>>>|[+-])\s*/, "")
    .replace(/\|.*$/, "")
  const match = text.match(REF)
  if (!match) {
    throw new Error(
      `Invalid line reference format: \"${ref}\". Expected format: \"{line_number}#{hash_id}\" or \"{line_number}#{hash_id}@{anchor}\"`,
    )
  }
  return {
    line: Number.parseInt(match[1], 10),
    hash: match[2],
    anchor: match[3] ? decode(match[3]) : undefined,
  } satisfies Ref
}

function fail(lines: string[], items: Mismatch[]) {
  const wanted = new Map(items.map((item) => [item.line, item]))
  const show = new Set<number>()
  for (const item of items) {
    const low = Math.max(1, item.line - 2)
    const high = Math.min(lines.length, item.line + 2)
    for (let line = low; line <= high; line++) show.add(line)
  }
  const out = [
    `${items.length} line${items.length === 1 ? " has" : "s have"} changed since last read. Use updated anchors below (>>> marks changed lines).`,
    "",
  ]
  let prev = 0
  for (const line of [...show].sort((a, b) => a - b)) {
    if (prev && line > prev + 1) out.push("    ...")
    prev = line
    out.push(`${wanted.has(line) ? ">>>" : "   "} ${formatFileLine(lines, line - 1)}`)
  }
  throw new Error(out.join("\n"))
}

function candidate(lines: string[], ref: Ref, line: number) {
  if (line < 1 || line > lines.length || !ref.anchor) return
  const index = line - 1
  const current = lines[index] ?? ""
  if (stableHash(current) !== ref.anchor.text) return
  const prev = index > 0 ? stableHash(lines[index - 1] ?? "") : ""
  const next = index + 1 < lines.length ? stableHash(lines[index + 1] ?? "") : ""
  const ord = ordinal(lines, index)
  let score = 0
  if (ref.anchor.before === prev) score += 3
  if (ref.anchor.after === next) score += 3
  if (ref.anchor.ordinal === ord) score += 2
  score -= Math.min(Math.abs(line - ref.line), 1000) / 1000
  return { line, score }
}

function resolve(lines: string[], ref: string) {
  const item = parse(ref)
  if (item.line >= 1 && item.line <= lines.length) {
    if (computeLineHash(item.line, lines[item.line - 1] ?? "") === item.hash) return item.line
  }
  if (!item.anchor) return item

  const hits = [] as Array<{ line: number; score: number }>
  for (let line = 1; line <= lines.length; line++) {
    const match = candidate(lines, item, line)
    if (match) hits.push(match)
  }
  if (hits.length === 0) return item
  hits.sort((a, b) => b.score - a.score || a.line - b.line)
  if (hits.length === 1) return hits[0].line
  if (hits[0].score > hits[1].score) return hits[0].line
  return item
}

function resolveEdits(lines: string[], edits: Edit[]) {
  const bad: Mismatch[] = []
  const list = edits.map((edit) => {
    if (edit.op === "append" && !edit.pos) return { op: "append", lines: edit.lines } satisfies Resolved
    if (edit.op === "prepend" && !edit.pos) return { op: "prepend", lines: edit.lines } satisfies Resolved
    if (edit.op === "append") {
      const line = resolve(lines, edit.pos!)
      if (typeof line !== "number") bad.push(line)
      return { op: "append", line: typeof line === "number" ? line : undefined, lines: edit.lines } satisfies Resolved
    }
    if (edit.op === "prepend") {
      const line = resolve(lines, edit.pos!)
      if (typeof line !== "number") bad.push(line)
      return { op: "prepend", line: typeof line === "number" ? line : undefined, lines: edit.lines } satisfies Resolved
    }
    const start = resolve(lines, edit.pos)
    const end = resolve(lines, edit.end ?? edit.pos)
    if (typeof start !== "number") bad.push(start)
    if (typeof end !== "number") bad.push(end)
    return {
      op: "replace",
      start: typeof start === "number" ? start : Number.NaN,
      end: typeof end === "number" ? end : Number.NaN,
      lines: edit.lines,
    } satisfies Resolved
  })
  if (bad.length) fail(lines, bad)
  return list
}

function clean(lines: string | string[] | null) {
  const list = lines === null ? [] : Array.isArray(lines) ? lines : lines.split("\n")
  let hash = 0
  let diff = 0
  let seen = 0
  for (const line of list) {
    if (!line) continue
    seen++
    if (/^\s*(?:>>>\s*)?\d+#[ZPMQVRWSNKTXJBYH]{2}(?:@[A-Za-z0-9_-]+)?\|/.test(line)) hash++
    if (/^\+(?!\+)/.test(line)) diff++
  }
  const stripHash = seen > 0 && hash >= seen / 2
  const stripDiff = !stripHash && seen > 0 && diff >= seen / 2
  return list.map((line) => {
    if (stripHash) return line.replace(/^\s*(?:>>>\s*)?\d+#[ZPMQVRWSNKTXJBYH]{2}(?:@[A-Za-z0-9_-]+)?\|/, "")
    if (stripDiff) return line.replace(/^\+(?!\+)/, "")
    return line
  })
}

function normalize(line: string) {
  const text = line.replace(/\s+/g, "")
  if (/^[\]\}\)](?:[,;])?$/.test(text)) return text.replace(/[;,]$/, "")
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

export function canCreate(edits: Edit[]) {
  return edits.length > 0 && edits.every((edit) => (edit.op === "append" || edit.op === "prepend") && !edit.pos)
}

export function apply(content: string, edits: Edit[]) {
  const base = content === "" ? [] : content.split("\n")
  const resolved = resolveEdits(base, edits)
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
    if (start > end) {
      throw new Error(`Invalid range: start line ${start} cannot be greater than end line ${end}`)
    }
    let add = clean(edit.lines)
    if (start > 1 && canTrimFirst(lines[start - 2] ?? "", add)) add = add.slice(1)
    if (end < lines.length && canTrimLast(lines[end] ?? "", add)) add = add.slice(0, -1)
    if (add.length) add[0] = indent(lines[start - 1] ?? "", add[0])
    lines.splice(start - 1, end - start + 1, ...add)
  }
  return lines.join("\n")
}
