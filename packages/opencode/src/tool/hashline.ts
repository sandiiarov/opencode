const NIBBLE = "ZPMQVRWSNKTXJBYH"
const HASH = Array.from({ length: 256 }, (_, i) => `${NIBBLE[i >>> 4]}${NIBBLE[i & 0x0f]}`)
const REF = /^([0-9]+)#([ZPMQVRWSNKTXJBYH]{2})$/
const OUT = /^(\s*(?:>>>\s*)?)([0-9]+)#([ZPMQVRWSNKTXJBYH]{2})\|(.*)$/
const WORD = /[\p{L}\p{N}]/u

export type Edit =
  | { op: "replace"; pos: string; end?: string; lines: string | string[] | null }
  | { op: "append"; pos?: string; lines: string | string[] | null }
  | { op: "prepend"; pos?: string; lines: string | string[] | null }

type Ref = {
  line: number
  hash: string
}

type Mismatch = {
  line: number
  hash: string
}

export function computeLineHash(line: number, content: string) {
  const text = content.replace(/\r/g, "").trimEnd()
  const seed = WORD.test(text) ? 0 : line
  return HASH[Bun.hash.xxHash32(text, seed) % 256]
}

export function formatHashLine(line: number, content: string) {
  return `${line}#${computeLineHash(line, content)}|${content}`
}

export function renderNumberedOutput(text: string) {
  return text
    .split("\n")
    .map((line) => {
      const match = line.match(OUT)
      if (!match) return line
      return `${match[1]}${match[2]}: ${match[4]}`
    })
    .join("\n")
}

function parse(ref: string) {
  const text = ref
    .trim()
    .replace(/^(?:>>>|[+-])\s*/, "")
    .replace(/\|.*$/, "")
  const match = text.match(REF)
  if (!match) {
    throw new Error(`Invalid line reference format: \"${ref}\". Expected format: \"{line_number}#{hash_id}\"`)
  }
  return {
    line: Number.parseInt(match[1], 10),
    hash: match[2],
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
    `${items.length} line${items.length === 1 ? " has" : "s have"} changed since last read. Use updated {line_number}#{hash_id} references below (>>> marks changed lines).`,
    "",
  ]
  let prev = 0
  for (const line of [...show].sort((a, b) => a - b)) {
    if (prev && line > prev + 1) out.push("    ...")
    prev = line
    const text = `${line}#${computeLineHash(line, lines[line - 1] ?? "")}|${lines[line - 1] ?? ""}`
    out.push(`${wanted.has(line) ? ">>>" : "   "} ${text}`)
  }
  throw new Error(out.join("\n"))
}

function check(lines: string[], refs: string[]) {
  const bad: Mismatch[] = []
  for (const ref of refs) {
    const item = parse(ref)
    if (item.line < 1 || item.line > lines.length) {
      throw new Error(`Line number ${item.line} out of bounds. File has ${lines.length} lines.`)
    }
    if (computeLineHash(item.line, lines[item.line - 1] ?? "") !== item.hash) bad.push(item)
  }
  if (bad.length) fail(lines, bad)
}

function clean(lines: string | string[] | null) {
  const list = lines === null ? [] : Array.isArray(lines) ? lines : lines.split("\n")
  let hash = 0
  let diff = 0
  let seen = 0
  for (const line of list) {
    if (!line) continue
    seen++
    if (/^\s*(?:>>>\s*)?\d+#[ZPMQVRWSNKTXJBYH]{2}\|/.test(line)) hash++
    if (/^\+(?!\+)/.test(line)) diff++
  }
  const stripHash = seen > 0 && hash >= seen / 2
  const stripDiff = !stripHash && seen > 0 && diff >= seen / 2
  return list.map((line) => {
    if (stripHash) return line.replace(/^\s*(?:>>>\s*)?\d+#[ZPMQVRWSNKTXJBYH]{2}\|/, "")
    if (stripDiff) return line.replace(/^\+(?!\+)/, "")
    return line
  })
}

function same(a: string, b: string) {
  return a === b || a.replace(/\s+/g, "") === b.replace(/\s+/g, "")
}

function indent(base: string, line: string) {
  if (!line || /^\s/.test(line)) return line
  const match = base.match(/^\s*/)?.[0] ?? ""
  if (!match || base.trim() === line.trim()) return line
  return match + line
}

function refs(edits: Edit[]) {
  return edits.flatMap((edit) => {
    if (edit.op === "replace") return edit.end ? [edit.pos, edit.end] : [edit.pos]
    return edit.pos ? [edit.pos] : []
  })
}

function target(edit: Edit) {
  if (edit.op === "replace") return parse(edit.end ?? edit.pos).line
  return edit.pos ? parse(edit.pos).line : Number.NEGATIVE_INFINITY
}

function overlap(edits: Edit[]) {
  const list = edits
    .map((edit, i) => {
      if (edit.op !== "replace" || !edit.end) return
      const start = parse(edit.pos).line
      const end = parse(edit.end).line
      return { start, end, i }
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
  check(base, refs(edits))
  overlap(edits)
  const list = [...edits].sort((a, b) => {
    const line = target(b) - target(a)
    if (line) return line
    const rank = { replace: 0, append: 1, prepend: 2 }
    return rank[a.op] - rank[b.op]
  })
  let lines = [...base]
  for (const edit of list) {
    if (edit.op === "append" && !edit.pos) {
      const add = clean(edit.lines)
      if (!add.length) throw new Error("append requires non-empty lines")
      lines = [...lines, ...add]
      continue
    }
    if (edit.op === "prepend" && !edit.pos) {
      const add = clean(edit.lines)
      if (!add.length) throw new Error("prepend requires non-empty lines")
      lines = [...add, ...lines]
      continue
    }
    if (edit.op === "append") {
      const ref = parse(edit.pos!)
      let add = clean(edit.lines)
      if (!add.length) throw new Error(`append requires non-empty lines for ${edit.pos}`)
      if (canTrimFirst(lines[ref.line - 1] ?? "", add)) add = add.slice(1)
      if (!add.length) throw new Error(`append requires non-empty lines for ${edit.pos}`)
      lines.splice(ref.line, 0, ...add)
      continue
    }
    if (edit.op === "prepend") {
      const ref = parse(edit.pos!)
      let add = clean(edit.lines)
      if (!add.length) throw new Error(`prepend requires non-empty lines for ${edit.pos}`)
      if (canTrimLast(lines[ref.line - 1] ?? "", add)) add = add.slice(0, -1)
      if (!add.length) throw new Error(`prepend requires non-empty lines for ${edit.pos}`)
      lines.splice(ref.line - 1, 0, ...add)
      continue
    }
    const start = parse(edit.pos).line
    const end = parse(edit.end ?? edit.pos).line
    if (start > end) {
      throw new Error(`Invalid range: start line ${start} cannot be greater than end line ${end}`)
    }
    let add = clean(edit.lines)
    if (start > 1 && add.length > end - start + 1 && canTrimFirst(lines[start - 2] ?? "", add)) add = add.slice(1)
    if (end < lines.length && add.length > end - start + 1 && canTrimLast(lines[end] ?? "", add)) add = add.slice(0, -1)
    if (add.length) add[0] = indent(lines[start - 1] ?? "", add[0])
    lines.splice(start - 1, end - start + 1, ...add)
  }
  return lines.join("\n")
}
