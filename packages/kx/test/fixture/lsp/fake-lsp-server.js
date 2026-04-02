// Simple JSON-RPC 2.0 LSP-like fake server over stdio

const mode = process.env.FAKE_LSP_MODE || "basic"
let nextId = 1
let readBuffer = Buffer.alloc(0)
const versions = new Map()

function encode(message) {
  const json = JSON.stringify(message)
  const header = `Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n`
  return Buffer.concat([Buffer.from(header, "utf8"), Buffer.from(json, "utf8")])
}

function decodeFrames(buffer) {
  const results = []
  let idx
  while ((idx = buffer.indexOf("\r\n\r\n")) !== -1) {
    const header = buffer.slice(0, idx).toString("utf8")
    const match = /Content-Length:\s*(\d+)/i.exec(header)
    const len = match ? parseInt(match[1], 10) : 0
    const bodyStart = idx + 4
    const bodyEnd = bodyStart + len
    if (buffer.length < bodyEnd) break
    results.push(buffer.slice(bodyStart, bodyEnd).toString("utf8"))
    buffer = buffer.slice(bodyEnd)
  }
  return { messages: results, rest: buffer }
}

function send(message) {
  process.stdout.write(encode(message))
}

function sendRequest(method, params) {
  const id = nextId++
  send({ jsonrpc: "2.0", id, method, params })
  return id
}

function sendDiagnostics(uri, version, diagnostics) {
  send({
    jsonrpc: "2.0",
    method: "textDocument/publishDiagnostics",
    params: { uri, version, diagnostics },
  })
}

function item(message) {
  return {
    items: [
      {
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 1 },
        },
        severity: 1,
        source: "fake",
        message,
      },
    ],
  }
}

function scheduleRace(uri, version) {
  sendDiagnostics(uri, version, [item("stale").items[0]])
  setTimeout(() => sendDiagnostics(uri, version, []), 10)
}

function scheduleWait(uri, version) {
  if (version === 0) {
    setTimeout(() => sendDiagnostics(uri, 0, [item("initial").items[0]]), 5)
    return
  }
  setTimeout(() => sendDiagnostics(uri, 0, [item("stale").items[0]]), 5)
  setTimeout(() => sendDiagnostics(uri, version, []), 50)
}

process.stdin.on("data", (chunk) => {
  readBuffer = Buffer.concat([readBuffer, chunk])
  const { messages, rest } = decodeFrames(readBuffer)
  readBuffer = rest
  for (const message of messages) handle(message)
})

function handle(raw) {
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    return
  }

  if (data.method === "initialize") {
    const capabilities = {}
    if (mode === "race") capabilities.codeActionProvider = true
    if (mode === "pull") capabilities.diagnosticProvider = {}
    send({ jsonrpc: "2.0", id: data.id, result: { capabilities } })
    return
  }

  if (data.method === "initialized") return
  if (data.method === "workspace/didChangeConfiguration") return

  if (data.method === "test/trigger") {
    const method = data.params && data.params.method
    if (method) sendRequest(method, {})
    return
  }

  if (data.method === "textDocument/didOpen" || data.method === "textDocument/didChange") {
    const doc = data.method === "textDocument/didOpen" ? data.params.textDocument : data.params.textDocument
    versions.set(doc.uri, doc.version)
    if (mode === "race") scheduleRace(doc.uri, doc.version)
    if (mode === "wait") scheduleWait(doc.uri, doc.version)
    return
  }

  if (data.method === "textDocument/codeAction") {
    const result = [{ title: "fix" }]
    if (mode === "race") {
      setTimeout(() => send({ jsonrpc: "2.0", id: data.id, result }), 80)
      return
    }
    send({ jsonrpc: "2.0", id: data.id, result })
    return
  }

  if (data.method === "textDocument/diagnostic") {
    const uri = data.params.textDocument.uri
    const version = versions.get(uri) ?? 0
    const result = version === 0 ? item("pull") : { items: [] }
    send({ jsonrpc: "2.0", id: data.id, result })
    return
  }

  if (typeof data.id !== "undefined") {
    send({ jsonrpc: "2.0", id: data.id, result: null })
  }
}
