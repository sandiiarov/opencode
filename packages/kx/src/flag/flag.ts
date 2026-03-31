import { Config } from "effect"

function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

function falsy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "false" || value === "0"
}

export namespace Flag {
  export const KX_AUTO_SHARE = truthy("KX_AUTO_SHARE")
  export const KX_GIT_BASH_PATH = process.env["KX_GIT_BASH_PATH"]
  export const KX_CONFIG = process.env["KX_CONFIG"]
  export declare const KX_TUI_CONFIG: string | undefined
  export declare const KX_CONFIG_DIR: string | undefined
  export const KX_CONFIG_CONTENT = process.env["KX_CONFIG_CONTENT"]
  export const KX_DISABLE_PRUNE = truthy("KX_DISABLE_PRUNE")
  export const KX_DISABLE_TERMINAL_TITLE = truthy("KX_DISABLE_TERMINAL_TITLE")
  export const KX_PERMISSION = process.env["KX_PERMISSION"]
  export const KX_DISABLE_DEFAULT_PLUGINS = truthy("KX_DISABLE_DEFAULT_PLUGINS")
  export const KX_DISABLE_LSP_DOWNLOAD = truthy("KX_DISABLE_LSP_DOWNLOAD")
  export const KX_ENABLE_EXPERIMENTAL_MODELS = truthy("KX_ENABLE_EXPERIMENTAL_MODELS")
  export const KX_DISABLE_AUTOCOMPACT = truthy("KX_DISABLE_AUTOCOMPACT")
  export const KX_DISABLE_MODELS_FETCH = truthy("KX_DISABLE_MODELS_FETCH")
  export const KX_DISABLE_CLAUDE_CODE = truthy("KX_DISABLE_CLAUDE_CODE")
  export const KX_DISABLE_CLAUDE_CODE_PROMPT = KX_DISABLE_CLAUDE_CODE || truthy("KX_DISABLE_CLAUDE_CODE_PROMPT")
  export const KX_DISABLE_CLAUDE_CODE_SKILLS = KX_DISABLE_CLAUDE_CODE || truthy("KX_DISABLE_CLAUDE_CODE_SKILLS")
  export const KX_DISABLE_EXTERNAL_SKILLS = KX_DISABLE_CLAUDE_CODE_SKILLS || truthy("KX_DISABLE_EXTERNAL_SKILLS")
  export declare const KX_DISABLE_PROJECT_CONFIG: boolean
  export const KX_FAKE_VCS = process.env["KX_FAKE_VCS"]
  export declare const KX_CLIENT: string
  export const KX_SERVER_PASSWORD = process.env["KX_SERVER_PASSWORD"]
  export const KX_SERVER_USERNAME = process.env["KX_SERVER_USERNAME"]

  // Experimental
  export const KX_EXPERIMENTAL = truthy("KX_EXPERIMENTAL")
  export const KX_EXPERIMENTAL_FILEWATCHER = Config.boolean("KX_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.withDefault(false),
  )
  export const KX_EXPERIMENTAL_DISABLE_FILEWATCHER = Config.boolean("KX_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.withDefault(false),
  )
  export const KX_EXPERIMENTAL_ICON_DISCOVERY = KX_EXPERIMENTAL || truthy("KX_EXPERIMENTAL_ICON_DISCOVERY")

  const copy = process.env["KX_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
  export const KX_EXPERIMENTAL_DISABLE_COPY_ON_SELECT =
    copy === undefined ? process.platform === "win32" : truthy("KX_EXPERIMENTAL_DISABLE_COPY_ON_SELECT")
  export const KX_ENABLE_EXA = truthy("KX_ENABLE_EXA") || KX_EXPERIMENTAL || truthy("KX_EXPERIMENTAL_EXA")
  export const KX_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS = number("KX_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS")
  export const KX_EXPERIMENTAL_OUTPUT_TOKEN_MAX = number("KX_EXPERIMENTAL_OUTPUT_TOKEN_MAX")
  export const KX_EXPERIMENTAL_OXFMT = KX_EXPERIMENTAL || truthy("KX_EXPERIMENTAL_OXFMT")
  export const KX_EXPERIMENTAL_LSP_TY = truthy("KX_EXPERIMENTAL_LSP_TY")
  export const KX_EXPERIMENTAL_LSP_TOOL = KX_EXPERIMENTAL || truthy("KX_EXPERIMENTAL_LSP_TOOL")
  export const KX_DISABLE_FILETIME_CHECK = Config.boolean("KX_DISABLE_FILETIME_CHECK").pipe(Config.withDefault(false))
  export const KX_EXPERIMENTAL_PLAN_MODE = KX_EXPERIMENTAL || truthy("KX_EXPERIMENTAL_PLAN_MODE")
  export const KX_EXPERIMENTAL_WORKSPACES = KX_EXPERIMENTAL || truthy("KX_EXPERIMENTAL_WORKSPACES")
  export const KX_EXPERIMENTAL_MARKDOWN = !falsy("KX_EXPERIMENTAL_MARKDOWN")
  export const KX_MODELS_URL = process.env["KX_MODELS_URL"]
  export const KX_MODELS_PATH = process.env["KX_MODELS_PATH"]
  export const KX_DB = process.env["KX_DB"]
  export const KX_DISABLE_CHANNEL_DB = truthy("KX_DISABLE_CHANNEL_DB")
  export const KX_SKIP_MIGRATIONS = truthy("KX_SKIP_MIGRATIONS")
  export const KX_STRICT_CONFIG_DEPS = truthy("KX_STRICT_CONFIG_DEPS")

  function number(key: string) {
    const value = process.env[key]
    if (!value) return undefined
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
  }
}

// Dynamic getter for KX_DISABLE_PROJECT_CONFIG
// This must be evaluated at access time, not module load time,
// because external tooling may set this env var at runtime
Object.defineProperty(Flag, "KX_DISABLE_PROJECT_CONFIG", {
  get() {
    return truthy("KX_DISABLE_PROJECT_CONFIG")
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for KX_TUI_CONFIG
// This must be evaluated at access time, not module load time,
// because tests and external tooling may set this env var at runtime
Object.defineProperty(Flag, "KX_TUI_CONFIG", {
  get() {
    return process.env["KX_TUI_CONFIG"]
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for KX_CONFIG_DIR
// This must be evaluated at access time, not module load time,
// because external tooling may set this env var at runtime
Object.defineProperty(Flag, "KX_CONFIG_DIR", {
  get() {
    return process.env["KX_CONFIG_DIR"]
  },
  enumerable: true,
  configurable: false,
})

// Dynamic getter for KX_CLIENT
// This must be evaluated at access time, not module load time,
// because some commands override the client at runtime
Object.defineProperty(Flag, "KX_CLIENT", {
  get() {
    return process.env["KX_CLIENT"] ?? "cli"
  },
  enumerable: true,
  configurable: false,
})
