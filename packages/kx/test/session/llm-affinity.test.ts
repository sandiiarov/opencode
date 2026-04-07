import { afterAll, beforeEach, expect, spyOn, test } from "bun:test"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { Instance } from "../../src/project/instance"
import { Provider } from "../../src/provider/provider"
import { ProviderID, ModelID } from "../../src/provider/schema"
import { LLM } from "../../src/session/llm"
import type { Agent } from "../../src/agent/agent"
import type { Message } from "../../src/session/message"
import { MessageID, SessionID } from "../../src/session/schema"
import { tmpdir } from "../fixture/fixture"

type Capture = {
  url: URL
  headers: Headers
}

const state = {
  server: Bun.serve({
    port: 0,
    fetch(req) {
      state.resolve?.({ url: new URL(req.url), headers: req.headers })
      return new Response(
        [
          `data: ${JSON.stringify({ id: "chatcmpl-1", object: "chat.completion.chunk", choices: [{ delta: { role: "assistant" } }] })}`,
          `data: ${JSON.stringify({ id: "chatcmpl-1", object: "chat.completion.chunk", choices: [{ delta: { content: "Hello" } }] })}`,
          `data: ${JSON.stringify({ id: "chatcmpl-1", object: "chat.completion.chunk", choices: [{ delta: {}, finish_reason: "stop" }] })}`,
          "data: [DONE]",
          "",
        ].join("\n\n"),
        { status: 200, headers: { "Content-Type": "text/event-stream" } },
      )
    },
  }),
  resolve: undefined as ((value: Capture) => void) | undefined,
}

beforeEach(() => {
  state.resolve = undefined
})

afterAll(() => {
  state.server.stop()
})

function request() {
  return new Promise<Capture>((resolve) => {
    state.resolve = resolve
  })
}

test("kx requests include session affinity headers", async () => {
  await using tmp = await tmpdir()

  await Instance.provide({
    directory: tmp.path,
    fn: async () => {
      const language = createOpenAICompatible({
        name: "kx",
        apiKey: "test-key",
        baseURL: `${state.server.url.origin}/v1`,
      }).languageModel("kimi-k2.5-free")
      const getLanguage = spyOn(Provider, "getLanguage").mockResolvedValue(language)
      const getProvider = spyOn(Provider, "getProvider").mockResolvedValue({ id: "kx", options: {} } as any)

      try {
        const sessionID = SessionID.make("session-affinity-test")
        const parentSessionID = SessionID.make("session-affinity-parent")
        const agent = {
          name: "test",
          mode: "primary",
          options: {},
          permission: [{ permission: "*", pattern: "*", action: "allow" }],
        } satisfies Agent.Info
        const model = {
          id: ModelID.make("kimi-k2.5-free"),
          providerID: ProviderID.make("kx"),
          api: { id: "kimi-k2.5-free", url: `${state.server.url.origin}/v1`, npm: "@ai-sdk/openai-compatible" },
          name: "Kimi",
          capabilities: {
            temperature: true,
            reasoning: false,
            attachment: true,
            toolcall: true,
            input: { text: true, audio: false, image: true, video: false, pdf: true },
            output: { text: true, audio: false, image: false, video: false, pdf: false },
            interleaved: false,
          },
          cost: { input: 0, output: 0, cache: { read: 0, write: 0 } },
          limit: { context: 128000, output: 8192 },
          options: {},
          headers: {},
          release_date: "2026-01-01",
          variants: {},
          status: "active",
        } as any
        const user = {
          id: MessageID.make("user-affinity-1"),
          sessionID,
          role: "user",
          time: { created: Date.now() },
          agent: agent.name,
          model: { providerID: ProviderID.make("kx"), modelID: model.id },
        } satisfies Message.User

        const pending = request()
        const stream = await LLM.stream({
          user,
          sessionID,
          parentSessionID,
          model,
          agent,
          system: ["You are a helpful assistant."],
          abort: new AbortController().signal,
          messages: [{ role: "user", content: "Hello" }],
          tools: {},
        })

        for await (const _ of stream.fullStream) {
          void _
        }

        const capture = await pending
        expect(capture.url.pathname).toBe("/v1/chat/completions")
        expect(capture.headers.get("x-kx-session")).toBe(sessionID)
        expect(capture.headers.get("x-session-affinity")).toBe(sessionID)
        expect(capture.headers.get("x-parent-session-id")).toBe(parentSessionID)
      } finally {
        getLanguage.mockRestore()
        getProvider.mockRestore()
      }
    },
  })
})
