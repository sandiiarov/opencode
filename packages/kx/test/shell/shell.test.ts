import { describe, expect, test } from "bun:test"
import { Shell } from "../../src/shell/shell"

const withShell = async (shell: string | undefined, fn: () => void | Promise<void>) => {
  const prev = process.env.SHELL
  if (shell === undefined) delete process.env.SHELL
  else process.env.SHELL = shell
  Shell.acceptable.reset()
  Shell.preferred.reset()
  try {
    await fn()
  } finally {
    if (prev === undefined) delete process.env.SHELL
    else process.env.SHELL = prev
    Shell.acceptable.reset()
    Shell.preferred.reset()
  }
}

describe("shell", () => {
  test("normalizes shell names", () => {
    expect(Shell.name("/bin/bash")).toBe("bash")
    if (process.platform === "win32") {
      expect(Shell.name("C:/tools/NU.EXE")).toBe("nu")
      expect(Shell.name("C:/tools/PWSH.EXE")).toBe("pwsh")
    }
  })

  test("detects login shells", () => {
    expect(Shell.login("/bin/bash")).toBe(true)
    expect(Shell.login("/bin/fish")).toBe(true)
    expect(Shell.login("C:/tools/pwsh.exe")).toBe(false)
  })

  test("detects posix shells", () => {
    expect(Shell.posix("/bin/bash")).toBe(true)
    expect(Shell.posix("/bin/fish")).toBe(false)
    expect(Shell.posix("C:/tools/pwsh.exe")).toBe(false)
  })

  if (process.platform === "win32") {
    test("rejects blacklisted shells case-insensitively", async () => {
      await withShell("NU.EXE", async () => {
        expect(Shell.name(Shell.acceptable())).not.toBe("nu")
      })
    })

    test("resolves bare PowerShell shells", async () => {
      const shell = Bun.which("pwsh") || Bun.which("powershell")
      if (!shell) return
      await withShell(shell.split(/[\\/]/).pop(), async () => {
        expect(Shell.preferred()).toBe(shell)
      })
    })
  }
})
