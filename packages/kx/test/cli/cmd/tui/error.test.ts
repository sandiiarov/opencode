import { describe, expect, test } from "bun:test"
import { summarizeToolError } from "../../../../src/cli/cmd/tui/error"

describe("tui tool error", () => {
  test("keeps only the short summary for anchor mismatch errors", () => {
    const error = [
      "2 lines have changed since last read. Use updated anchors below (>>> marks changed lines).",
      "",
      '    13#VT|import { trimDiff } from "./edit"',
    ].join("\n")

    expect(summarizeToolError(error)).toBe("2 lines have changed since last read")
  })

  test("leaves unrelated errors unchanged", () => {
    expect(summarizeToolError("ripgrep failed")).toBe("ripgrep failed")
  })
})
