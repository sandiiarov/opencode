import { diffArrays } from "diff"

type Row = {
  id: string
  text: string
}

type Snapshot = {
  text: string
  lines: Row[]
}

const files = new Map<string, Snapshot>()
const ID = "abcdefghijklmnopqrstuvwxyz0123456789"

function split(text: string) {
  const lines = text.split(/\r?\n/)
  if (lines.at(-1) === "") lines.pop()
  return lines
}

function next(used: Set<string>) {
  for (;;) {
    let id = ""
    for (let i = 0; i < 4; i++) id += ID[Math.floor(Math.random() * ID.length)]
    if (used.has(id)) continue
    used.add(id)
    return id
  }
}

function reconcile(prev: Row[], nextText: string[]) {
  const used = new Set(prev.map((item) => item.id))
  const out = [] as Row[]
  let i = 0
  for (const part of diffArrays(
    prev.map((item) => item.text),
    nextText,
  )) {
    if (part.added) {
      out.push(...part.value.map((text) => ({ id: next(used), text })))
      continue
    }
    if (part.removed) {
      i += part.value.length
      continue
    }
    for (const text of part.value) {
      const item = prev[i++]
      out.push({ id: item.id, text })
    }
  }
  return out
}

export namespace FileLine {
  export function sync(file: string, text: string) {
    const prev = files.get(file)
    if (prev?.text === text) return prev.lines
    const lines = split(text)
    const rows = prev ? reconcile(prev.lines, lines) : reconcile([], lines)
    files.set(file, { text, lines: rows })
    return rows
  }

  export function get(file: string) {
    return files.get(file)
  }

  export function clear() {
    files.clear()
  }

  export function format(item: Row, display = item.text, line?: number) {
    const prefix = line === undefined ? item.id : `${item.id}|${line}`
    return `${prefix} ${display}`
  }

  export function resolve(file: string, id: string) {
    const lines = files.get(file)?.lines
    if (!lines) return
    const index = lines.findIndex((item) => item.id === id)
    if (index < 0) return
    return index + 1
  }
}
