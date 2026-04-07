import { describe, expect, spyOn, test } from "bun:test"
import z from "zod"
import { Tool } from "../../src/tool/tool"
import { Truncate } from "../../src/tool/truncate"
import { SessionID, MessageID } from "../../src/session/schema"

const ctx = {
  sessionID: SessionID.make("ses_test-session"),
  messageID: MessageID.make("test-message"),
  callID: "test-call",
  agent: "test-agent",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => {},
  ask: async () => {},
}

describe("tool.define", () => {
  test("does not accumulate wrappers for object-defined tools", async () => {
    const truncateSpy = spyOn(Truncate, "output").mockImplementation(async (content) => ({
      content,
      truncated: false,
      outputPath: undefined,
    }))

    const tool = Tool.define("test", {
      description: "test tool",
      parameters: z.object({}),
      async execute() {
        return {
          title: "ok",
          output: "done",
          metadata: {},
        }
      },
    })

    const first = await tool.init()
    await first.execute({}, ctx)

    const second = await tool.init()
    await second.execute({}, ctx)

    expect(truncateSpy).toHaveBeenCalledTimes(2)
    truncateSpy.mockRestore()
  })
})
