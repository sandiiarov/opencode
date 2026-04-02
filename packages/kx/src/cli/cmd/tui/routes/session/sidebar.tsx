import { useSync } from "@tui/context/sync"
import { createMemo, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { useTheme } from "../../context/theme"
import type { AssistantMessage } from "@kx/sdk/v2"
import { Installation } from "@/installation"
import { useDirectory } from "../../context/directory"
import { useKV } from "../../context/kv"
import { TodoItem } from "../../component/todo-item"
import { langcolor, lspcolor, lspicon, pathicon } from "@tui/util/icon"
import {
  BRANCH_MARK,
  CHEVRON_DOWN,
  CHEVRON_RIGHT,
  CONTEXT_PROGRESS_EMPTY,
  CONTEXT_PROGRESS_FILL,
  COST_MARK,
  FOLDER_MARK,
  PERCENT_MARK,
  SEP_MARK,
  STATUS_OFF_MARK,
  STATUS_ON_MARK,
  TOKEN_MARK,
} from "../../icons"

const sidebar = 42
const barw = 10

const contextColor = (theme: ReturnType<typeof useTheme>["theme"], n?: number | null) => {
  if (n == null) return theme.textMuted
  if (n >= 35) return theme.error
  if (n >= 30) return theme.warning
  return theme.success
}

const progress = (n?: number | null, w = barw) => {
  const pct = n == null ? 0 : Math.max(0, Math.min(100, Math.round(n)))
  const fill = Math.round(pct / (100 / w))
  return `${CONTEXT_PROGRESS_FILL.repeat(fill)}${CONTEXT_PROGRESS_EMPTY.repeat(w - fill)} ${pct}${PERCENT_MARK}`
}

export function Sidebar(props: { sessionID: string; overlay?: boolean }) {
  const sync = useSync()
  const { theme } = useTheme()
  const session = createMemo(() => sync.session.get(props.sessionID)!)
  const diff = createMemo(() => sync.data.session_diff[props.sessionID] ?? [])
  const todo = createMemo(() => sync.data.todo[props.sessionID] ?? [])
  const messages = createMemo(() => sync.data.message[props.sessionID] ?? [])

  const [expanded, setExpanded] = createStore({
    diff: true,
    todo: true,
    lsp: true,
  })

  const cost = createMemo(() => {
    const total = messages().reduce((sum, x) => sum + (x.role === "assistant" ? x.cost : 0), 0)
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(total)
  })

  const context = createMemo(() => {
    const last = messages().findLast((x) => x.role === "assistant" && x.tokens.output > 0) as AssistantMessage
    if (!last) return
    const total =
      last.tokens.input + last.tokens.output + last.tokens.reasoning + last.tokens.cache.read + last.tokens.cache.write
    const model = sync.data.provider.find((x) => x.id === last.providerID)?.models[last.modelID]
    return {
      tokens: total.toLocaleString(),
      percentage: model?.limit.context ? Math.round((total / model.limit.context) * 100) : null,
    }
  })
  const contextFg = createMemo(() => contextColor(theme, context()?.percentage))
  const bar = createMemo(() => progress(context()?.percentage))

  const directory = useDirectory()
  const kv = useKV()

  const hasProviders = createMemo(() =>
    sync.data.provider.some((x) => x.id !== "kx" || Object.values(x.models).some((y) => y.cost?.input !== 0)),
  )
  const gettingStartedDismissed = createMemo(() => kv.get("dismissed_getting_started", false))
  const dir = createMemo(() => directory().split(":")[0])
  const parent = createMemo(() => dir().split("/").slice(0, -1).join("/"))
  const base = createMemo(() => dir().split("/").at(-1) ?? dir())

  return (
    <Show when={session()}>
      <box
        width={sidebar}
        height="100%"
        paddingTop={1}
        paddingBottom={1}
        paddingLeft={2}
        paddingRight={2}
        position={props.overlay ? "absolute" : "relative"}
      >
        <box flexGrow={1} flexDirection="column" gap={1} paddingRight={1} minHeight={0}>
          <box paddingRight={1} flexShrink={0}>
            <text fg={theme.text}>
              <b>{session().title}</b>
            </text>
            <Show when={session().share?.url}>
              <text fg={theme.textMuted}>{session().share!.url}</text>
            </Show>
          </box>
          <box flexShrink={0}>
            <text fg={theme.text}>
              <b>Context</b>
            </text>
            <box flexDirection="row" gap={1}>
              <text fg={theme.text}>
                {TOKEN_MARK} {context()?.tokens ?? 0}
              </text>
              <text fg={theme.textMuted}>{SEP_MARK}</text>
              <text fg={theme.text}>
                {COST_MARK} {cost().replace(/^[^\d-]+/, "")}
              </text>
              <text fg={theme.textMuted}>{SEP_MARK}</text>
              <text fg={contextFg()}>{bar()}</text>
            </box>
          </box>
          <box flexShrink={0}>
            <box
              flexDirection="row"
              gap={1}
              onMouseDown={() => sync.data.lsp.length > 2 && setExpanded("lsp", !expanded.lsp)}
            >
              <Show when={sync.data.lsp.length > 2}>
                <text fg={theme.text}>{expanded.lsp ? CHEVRON_DOWN : CHEVRON_RIGHT}</text>
              </Show>
              <text fg={theme.text}>
                <b>LSP</b>
              </text>
            </box>
            <Show when={sync.data.lsp.length <= 2 || expanded.lsp}>
              <Show when={sync.data.lsp.length === 0}>
                <text fg={theme.textMuted}>
                  {sync.data.config.lsp === false
                    ? "LSPs have been disabled in settings"
                    : "LSPs will activate as files are read"}
                </text>
              </Show>
              <For each={sync.data.lsp}>
                {(item) => (
                  <box flexDirection="row" gap={1}>
                    <text
                      flexShrink={0}
                      style={{
                        fg: {
                          connected: theme.success,
                          error: theme.error,
                        }[item.status],
                      }}
                    >
                      {item.status === "connected" ? STATUS_ON_MARK : STATUS_OFF_MARK}
                    </text>
                    <text fg={theme.textMuted} wrapMode="none">
                      <span style={{ fg: lspcolor(item.id) }}>{lspicon(item.id)}</span> {item.id} {item.root}
                    </text>
                  </box>
                )}
              </For>
            </Show>
          </box>
          <Show when={todo().length > 0 && todo().some((t) => t.status !== "completed")}>
            <box flexShrink={0}>
              <box
                flexDirection="row"
                gap={1}
                onMouseDown={() => todo().length > 2 && setExpanded("todo", !expanded.todo)}
              >
                <Show when={todo().length > 2}>
                  <text fg={theme.text}>{expanded.todo ? CHEVRON_DOWN : CHEVRON_RIGHT}</text>
                </Show>
                <text fg={theme.text}>
                  <b>Todo</b>
                </text>
              </box>
              <Show when={todo().length <= 2 || expanded.todo}>
                <For each={todo()}>
                  {(todo) => <TodoItem status={todo.status} content={todo.content} style="sidebar" />}
                </For>
              </Show>
            </box>
          </Show>
          <Show when={diff().length > 0}>
            <box flexGrow={1} flexDirection="column" minHeight={0}>
              <box
                flexDirection="row"
                gap={1}
                flexShrink={0}
                onMouseDown={() => diff().length > 2 && setExpanded("diff", !expanded.diff)}
              >
                <Show when={diff().length > 2}>
                  <text fg={theme.text}>{expanded.diff ? CHEVRON_DOWN : CHEVRON_RIGHT}</text>
                </Show>
                <text fg={theme.text}>
                  <b>Modified Files</b>
                </text>
              </box>
              <Show when={diff().length <= 2 || expanded.diff}>
                <scrollbox
                  flexGrow={1}
                  minHeight={0}
                  verticalScrollbarOptions={{
                    trackOptions: {
                      backgroundColor: theme.background,
                      foregroundColor: theme.borderActive,
                    },
                  }}
                >
                  <box paddingRight={1}>
                    <For each={diff() || []}>
                      {(item) => {
                        return (
                          <box flexDirection="row" gap={1} justifyContent="space-between">
                            <box flexDirection="row" gap={1}>
                              <text fg={langcolor(item.file)} flexShrink={0}>
                                {pathicon(item.file)}
                              </text>
                              <text fg={theme.textMuted} wrapMode="none">
                                {item.file}
                              </text>
                            </box>
                            <box flexDirection="row" gap={1} flexShrink={0}>
                              <Show when={item.additions}>
                                <text fg={theme.diffAdded}>+{item.additions}</text>
                              </Show>
                              <Show when={item.deletions}>
                                <text fg={theme.diffRemoved}>-{item.deletions}</text>
                              </Show>
                            </box>
                          </box>
                        )
                      }}
                    </For>
                  </box>
                </scrollbox>
              </Show>
            </box>
          </Show>
        </box>

        <box flexShrink={0} gap={1} paddingTop={1}>
          <Show when={!hasProviders() && !gettingStartedDismissed()}>
            <box
              backgroundColor={theme.backgroundElement}
              paddingTop={1}
              paddingBottom={1}
              paddingLeft={2}
              paddingRight={2}
              flexDirection="row"
              gap={1}
            >
              <text flexShrink={0} fg={theme.text}>
                ⬖
              </text>
              <box flexGrow={1} gap={1}>
                <box flexDirection="row" justifyContent="space-between">
                  <text fg={theme.text}>
                    <b>Getting started</b>
                  </text>
                  <text fg={theme.textMuted} onMouseDown={() => kv.set("dismissed_getting_started", true)}>
                    ✕
                  </text>
                </box>
                <text fg={theme.textMuted}>kx includes free models so you can start immediately.</text>
                <text fg={theme.textMuted}>
                  Connect from 75+ providers to use other models, including Claude, GPT, Gemini etc
                </text>
                <box flexDirection="row" gap={1} justifyContent="space-between">
                  <text fg={theme.text}>Connect provider</text>
                  <text fg={theme.textMuted}>/connect</text>
                </box>
              </box>
            </box>
          </Show>
          <box flexDirection="column" gap={1}>
            <box flexDirection="row" gap={1}>
              <text fg={theme.primary} flexShrink={0}>
                {FOLDER_MARK}
              </text>
              <text fg={theme.textMuted} wrapMode="none" overflow="hidden">
                {parent()}/<span style={{ fg: theme.text }}>{base()}</span>
              </text>
            </box>
            <Show when={sync.data.vcs?.branch}>
              <box flexDirection="row" gap={1}>
                <text fg={theme.error} flexShrink={0}>
                  {BRANCH_MARK}
                </text>
                <text fg={theme.text} wrapMode="none" overflow="hidden">
                  {sync.data.vcs?.branch}
                </text>
              </box>
            </Show>
          </box>
          <text fg={theme.textMuted}>
            <span style={{ fg: theme.success }}>{STATUS_ON_MARK}</span>{" "}
            <span style={{ fg: theme.text }}>
              <b>Kx</b>
            </span>{" "}
            <span>{Installation.VERSION}</span>
          </text>
        </box>
      </box>
    </Show>
  )
}
