import path from "path"
import { describe, expect, spyOn, test } from "bun:test"
import { NamedError } from "@kx/util/error"
import { fileURLToPath } from "url"
import { Instance } from "../../src/project/instance"
import { ModelID, ProviderID } from "../../src/provider/schema"
import { Provider } from "../../src/provider/provider"
import { Session } from "../../src/session"
import { Message } from "../../src/session/message"
import { SessionPrompt } from "../../src/session/prompt"
import { SessionProcessor } from "../../src/session/processor"
import { MessageID, PartID } from "../../src/session/schema"
import { SessionSummary } from "../../src/session/summary"
import { SystemPrompt } from "../../src/session/system"
import { Log } from "../../src/util/log"
import { tmpdir } from "../fixture/fixture"

Log.init({ print: false })

describe("session.prompt missing file", () => {
  test("does not fail the prompt when a file part is missing", async () => {
    await using tmp = await tmpdir({
      git: true,
      config: {
        agent: {
          build: {
            model: "openai/gpt-5.2",
          },
        },
      },
    })

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})

        const missing = path.join(tmp.path, "does-not-exist.ts")
        const msg = await SessionPrompt.prompt({
          sessionID: session.id,
          agent: "build",
          noReply: true,
          parts: [
            { type: "text", text: "please review @does-not-exist.ts" },
            {
              type: "file",
              mime: "text/plain",
              url: `file://${missing}`,
              filename: "does-not-exist.ts",
            },
          ],
        })

        if (msg.info.role !== "user") throw new Error("expected user message")

        const hasFailure = msg.parts.some(
          (part) => part.type === "text" && part.synthetic && part.text.includes("Read tool failed to read"),
        )
        expect(hasFailure).toBe(true)

        await Session.remove(session.id)
      },
    })
  })

  test("keeps stored part order stable when file resolution is async", async () => {
    await using tmp = await tmpdir({
      git: true,
      config: {
        agent: {
          build: {
            model: "openai/gpt-5.2",
          },
        },
      },
    })

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})

        const missing = path.join(tmp.path, "still-missing.ts")
        const msg = await SessionPrompt.prompt({
          sessionID: session.id,
          agent: "build",
          noReply: true,
          parts: [
            {
              type: "file",
              mime: "text/plain",
              url: `file://${missing}`,
              filename: "still-missing.ts",
            },
            { type: "text", text: "after-file" },
          ],
        })

        if (msg.info.role !== "user") throw new Error("expected user message")

        const stored = await Message.get({
          sessionID: session.id,
          messageID: msg.info.id,
        })
        const text = stored.parts.filter((part) => part.type === "text").map((part) => part.text)

        expect(text[0]?.startsWith("Called the Read tool with the following input:")).toBe(true)
        expect(text[1]?.includes("Read tool failed to read")).toBe(true)
        expect(text[2]).toBe("after-file")

        await Session.remove(session.id)
      },
    })
  })
})

describe("session.prompt special characters", () => {
  test("handles filenames with # character", async () => {
    await using tmp = await tmpdir({
      git: true,
      init: async (dir) => {
        await Bun.write(path.join(dir, "file#name.txt"), "special content\n")
      },
    })

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const template = "Read @file#name.txt"
        const parts = await SessionPrompt.resolvePromptParts(template)
        const fileParts = parts.filter((part) => part.type === "file")

        expect(fileParts.length).toBe(1)
        expect(fileParts[0].filename).toBe("file#name.txt")
        expect(fileParts[0].url).toContain("%23")

        const decodedPath = fileURLToPath(fileParts[0].url)
        expect(decodedPath).toBe(path.join(tmp.path, "file#name.txt"))

        const message = await SessionPrompt.prompt({
          sessionID: session.id,
          parts,
          noReply: true,
        })
        const stored = await Message.get({ sessionID: session.id, messageID: message.info.id })
        const textParts = stored.parts.filter((part) => part.type === "text")
        const hasContent = textParts.some((part) => part.text.includes("special content"))
        expect(hasContent).toBe(true)

        await Session.remove(session.id)
      },
    })
  })
})

describe("session.prompt agent variant", () => {
  test("applies agent variant only when using agent model", async () => {
    const prev = process.env.OPENAI_API_KEY
    process.env.OPENAI_API_KEY = "test-openai-key"

    try {
      await using tmp = await tmpdir({
        git: true,
        config: {
          agent: {
            build: {
              model: "openai/gpt-5.2",
              variant: "xhigh",
            },
          },
        },
      })

      await Instance.provide({
        directory: tmp.path,
        fn: async () => {
          const session = await Session.create({})

          const other = await SessionPrompt.prompt({
            sessionID: session.id,
            agent: "build",
            model: { providerID: ProviderID.make("kx"), modelID: ModelID.make("kimi-k2.5-free") },
            noReply: true,
            parts: [{ type: "text", text: "hello" }],
          })
          if (other.info.role !== "user") throw new Error("expected user message")
          expect(other.info.variant).toBeUndefined()

          const match = await SessionPrompt.prompt({
            sessionID: session.id,
            agent: "build",
            noReply: true,
            parts: [{ type: "text", text: "hello again" }],
          })
          if (match.info.role !== "user") throw new Error("expected user message")
          expect(match.info.model).toEqual({ providerID: ProviderID.make("openai"), modelID: ModelID.make("gpt-5.2") })
          expect(match.info.variant).toBe("xhigh")

          const override = await SessionPrompt.prompt({
            sessionID: session.id,
            agent: "build",
            noReply: true,
            variant: "high",
            parts: [{ type: "text", text: "hello third" }],
          })
          if (override.info.role !== "user") throw new Error("expected user message")
          expect(override.info.variant).toBe("high")

          await Session.remove(session.id)
        },
      })
    } finally {
      if (prev === undefined) delete process.env.OPENAI_API_KEY
      else process.env.OPENAI_API_KEY = prev
    }
  })
})

describe("session.agent-resolution", () => {
  test("unknown agent throws typed error", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const err = await SessionPrompt.prompt({
          sessionID: session.id,
          agent: "nonexistent-agent-xyz",
          noReply: true,
          parts: [{ type: "text", text: "hello" }],
        }).then(
          () => undefined,
          (e) => e,
        )
        expect(err).toBeDefined()
        expect(err).not.toBeInstanceOf(TypeError)
        expect(NamedError.Unknown.isInstance(err)).toBe(true)
        if (NamedError.Unknown.isInstance(err)) {
          expect(err.data.message).toContain('Agent not found: "nonexistent-agent-xyz"')
        }
      },
    })
  }, 30000)

  test("unknown agent error includes available agent names", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const err = await SessionPrompt.prompt({
          sessionID: session.id,
          agent: "nonexistent-agent-xyz",
          noReply: true,
          parts: [{ type: "text", text: "hello" }],
        }).then(
          () => undefined,
          (e) => e,
        )
        expect(NamedError.Unknown.isInstance(err)).toBe(true)
        if (NamedError.Unknown.isInstance(err)) {
          expect(err.data.message).toContain("build")
        }
      },
    })
  }, 30000)

  test("unknown command throws typed error with available names", async () => {
    await using tmp = await tmpdir({ git: true })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const err = await SessionPrompt.command({
          sessionID: session.id,
          command: "nonexistent-command-xyz",
          arguments: "",
        }).then(
          () => undefined,
          (e) => e,
        )
        expect(err).toBeDefined()
        expect(err).not.toBeInstanceOf(TypeError)
        expect(NamedError.Unknown.isInstance(err)).toBe(true)
        if (NamedError.Unknown.isInstance(err)) {
          expect(err.data.message).toContain('Command not found: "nonexistent-command-xyz"')
          expect(err.data.message).toContain("init")
        }
      },
    })
  }, 30000)
})

describe("session.prompt reread guidance", () => {
  test("gpt-5.4 provider prompt forbids same-file rereads until stale-id failure", () => {
    const model = { api: { id: "gpt-5.4" } } as Parameters<typeof SystemPrompt.provider>[0]
    const prompt = SystemPrompt.provider(model).join("\n")

    expect(prompt).toContain("NEVER call `read` on the same file after your own `edit` or `write`")
    expect(prompt).toContain("Treat the `Updated lines` ids as authoritative")
    expect(prompt).toContain("Fresh ids from `grep` are valid too")
    expect(prompt).toContain("edit directly instead of reading that file first")
    expect(prompt).toContain("only after a later `edit` or `write` fails because ids are stale or missing")
    expect(prompt).not.toContain("Always read 2000 lines of code at a time")
  })

  test("copilot gpt-5 prompt forbids same-file rereads until stale-id failure", async () => {
    const file = path.join(process.cwd(), "src/session/prompt/copilot-gpt-5.txt")
    const prompt = await Bun.file(file).text()

    expect(prompt).toContain("NEVER call `read` on the same file after your own `edit` or `write`")
    expect(prompt).toContain("Treat the `Updated lines` ids as authoritative")
    expect(prompt).toContain("Fresh ids from `grep` are valid too")
    expect(prompt).toContain("edit directly instead of reading that file first")
    expect(prompt).toContain("only after a later `edit` or `write` fails because ids are stale or missing")
    expect(prompt).not.toContain("Before editing, always read the relevant file contents or section")
    expect(prompt).not.toContain("Always read 2000 lines of code at a time")
  })
})

describe("session.prompt tool loop", () => {
  test("continues when the previous assistant stopped with tool parts", async () => {
    await using tmp = await tmpdir({
      git: true,
      config: {
        agent: {
          build: {
            model: "kx/kimi-k2.5-free",
          },
        },
      },
    })

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const model = {
          id: ModelID.make("kimi-k2.5-free"),
          providerID: ProviderID.make("kx"),
          api: { id: "kimi-k2.5-free", url: "https://example.com", npm: "@ai-sdk/openai" },
          name: "Test model",
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
          limit: { context: 200000, output: 8192 },
          status: "active",
          options: {},
          headers: {},
          release_date: "2026-01-01",
        } as any
        const getModel = spyOn(Provider, "getModel").mockResolvedValue(model)
        const user = await SessionPrompt.prompt({
          sessionID: session.id,
          agent: "build",
          noReply: true,
          parts: [{ type: "text", text: "hello" }],
        })
        if (user.info.role !== "user") throw new Error("expected user message")

        const assistant = await Session.updateMessage({
          id: MessageID.ascending(),
          parentID: user.info.id,
          role: "assistant",
          mode: "build",
          agent: "build",
          path: { cwd: tmp.path, root: tmp.path },
          cost: 0,
          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
          modelID: user.info.model.modelID,
          providerID: user.info.model.providerID,
          finish: "stop",
          time: { created: Date.now(), completed: Date.now() },
          sessionID: session.id,
        })
        await Session.updatePart({
          id: PartID.ascending(),
          messageID: assistant.id,
          sessionID: session.id,
          type: "tool",
          callID: "call-1",
          tool: "bash",
          state: {
            status: "completed",
            input: { command: "pwd" },
            output: tmp.path,
            title: "Bash",
            metadata: {},
            attachments: [],
            time: { start: Date.now(), end: Date.now() },
          },
        })

        const summarize = spyOn(SessionSummary, "summarize").mockResolvedValue(undefined as never)
        const fakeCreate = ((input: Parameters<typeof SessionProcessor.create>[0]) => ({
          message: input.assistantMessage,
          partFromToolCall: () => undefined,
          process: async () => {
            input.assistantMessage.finish = "stop"
            return "stop" as const
          },
        })) as any
        const create = spyOn(SessionProcessor, "create").mockImplementation(fakeCreate)

        try {
          const result = await SessionPrompt.loop({ sessionID: session.id })
          expect(getModel).toHaveBeenCalled()
          expect(create).toHaveBeenCalledTimes(1)
          expect(result.info.role).toBe("assistant")
          expect(result.info.id).not.toBe(assistant.id)
        } finally {
          create.mockRestore()
          summarize.mockRestore()
          getModel.mockRestore()
        }
      },
    })
  })
})
