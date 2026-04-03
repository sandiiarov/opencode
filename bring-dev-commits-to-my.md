# Bring dev commits to my

## Goal

- [ ] Bring only `dev` changes that still matter for the trimmed `my` branch
- [ ] Keep scope focused on TUI and core behavior
- [ ] Avoid pulling unrelated app, web, console, desktop, CI, and release churn

## Scope

### Include

- [ ] `packages/opencode`
- [ ] `packages/plugin`
- [ ] `packages/sdk/js` only when server/API parity matters

### Exclude by default

- [ ] `packages/web`
- [ ] `packages/console/*`
- [ ] `packages/desktop*`
- [ ] most `packages/app` and `packages/ui` changes unless they directly support TUI/core behavior we still ship
- [ ] release/version-only commits
- [ ] nix/CI/workflow-only commits

## Current state

- [ ] `my` is ahead of `dev` with local fork-specific removals
- [ ] `my` is also behind updated `dev` by a large amount
- [ ] upstream churn is concentrated in plugin loading, session/prompt services, bash/shell execution, and TUI plugin/runtime work

## Strategy

- [ ] Do not merge all of `dev` blindly
- [ ] Bring small correctness fixes first
- [ ] Bring TUI/plugin pipeline changes in a separate pass
- [ ] Bring deeper Effect/session/provider refactors only if they unblock required features or fix real regressions on `my`
- [ ] Regenerate SDK only when a selected server/API change requires it

## Pass 1: safe correctness fixes

### Review / cherry-pick candidates

- [x] `55895d066` core: fix plugin hooks to properly handle async operations (already integrated locally: `packages/kx/src/plugin/index.ts` already awaits hook promises and `packages/kx/test/plugin/trigger.test.ts` covers async hooks)
- [x] `a5b1dc081` test: add regression coverage for sync plugin hooks (already integrated locally in `packages/kx/test/plugin/trigger.test.ts`)
- [x] `733a3bd03` fix(core): prevent agent loop from stopping after tool calls with OpenAI-compatible providers (already integrated locally in `packages/kx/src/session/prompt.ts` with regression coverage in `packages/kx/test/session/prompt.test.ts`)
- [x] `48db7cf07` fix(opencode): batch snapshot revert without reordering (already integrated locally in `packages/kx/src/snapshot/index.ts` with regression coverage in `packages/kx/test/snapshot/snapshot.test.ts`)
- [x] `880c0a747` fix: normalize filepath in FileTime to prevent Windows path mismatch (already integrated locally in `packages/kx/src/file/time.ts` with regression coverage in `packages/kx/test/file/time.test.ts`)
- [x] `e148b318b` fix(build): replace `require()` with dynamic `import()` in cross-spawn-spawner (skip: kx already uses `makeRunPromise`; no lazy runtime wrapper here)

### Notes

- [ ] Prefer these first because they are the best candidates to import without broad architectural churn
- [ ] Validate each one against local deletions before cherry-picking

- [x] `55895d066` is already effectively integrated on `my`: local `packages/kx/src/plugin/index.ts` already awaits hook promises inside `Plugin.trigger`, and `packages/kx/test/plugin/trigger.test.ts` already covers both sync and async hooks, so there is no additional port to make.
- [x] `733a3bd03` is already effectively integrated on `my`: local `packages/kx/src/session/prompt.ts` already keeps the loop alive when an assistant message has tool parts even if `finish` is `stop`, and `packages/kx/test/session/prompt.test.ts` covers that regression path.
- [x] `a5b1dc081` is already effectively integrated on `my`: local `packages/kx/test/plugin/trigger.test.ts` already includes the synchronous hook regression case upstream added.
- [x] `48db7cf07` is already effectively integrated on `my`: local `packages/kx/src/snapshot/index.ts` already batches non-conflicting snapshot reverts without reordering patch precedence, and `packages/kx/test/snapshot/snapshot.test.ts` includes the upstream regression cases for repeated hashes and large mixed batches.
- [x] `880c0a747` is already effectively integrated on `my`: local `packages/kx/src/file/time.ts` already normalizes paths for lock/read/get/assert, and `packages/kx/test/file/time.test.ts` covers mixed slash-direction reads, assertions, gets, and locks.
- [x] `f7f41dc3a` is relevant on `my`: local TUI had the same split scroll-acceleration logic in `packages/kx/src/cli/cmd/tui/routes/session/index.tsx` and several scrollboxes still ignored user config. Ported a shared helper plus wiring in autocomplete, permission diff, sidebar, dialog select, and the embedded error view in `packages/kx/src/cli/cmd/tui/app.tsx`
- [x] `802d16557` is only partially relevant on `my`: import cleanup was already covered during the previous port, but `packages/kx/src/cli/cmd/tui/util/scroll.ts` needed the `scroll_speed !== undefined` guard so an explicit `0` is honored instead of falling back to the default speed
- [x] `c526caae7` is relevant on `my`: assistant message footers and transcript export were still showing raw model ids. Ported provider/model lookup helper, wired footer rendering in `packages/kx/src/cli/cmd/tui/routes/session/index.tsx`, updated transcript formatting in `packages/kx/src/cli/cmd/tui/util/transcript.ts`, and added regression coverage in `packages/kx/test/cli/tui/transcript.test.ts`
- [x] `df1c6c9e8` is not needed on `my`: session sharing is slated for removal in this fork, so the first-share consent dialog would add churn to a feature we do not plan to keep.
- [x] `fa96cb9c6` is relevant on `my`: local `packages/kx/src/cli/cmd/tui/app.tsx` still cleared renderer selection for most keypresses whenever copy-on-select mode was active. Ported the focused-renderable guard so selections owned by the active input are preserved during global key handling.
- [x] `d58004a86` is relevant on `my`: local `packages/kx/src/cli/cmd/tui/context/local.tsx` still assumed the last-used agent always exists. Ported the fallback so TUI state gracefully uses the first available visible agent after agent list changes.
- [x] `186af2723` is partially relevant on `my`: local TUI still uses model variants, but it does not have the upstream `DialogVariant` surface. Ported the durable state fix in `packages/kx/src/cli/cmd/tui/context/local.tsx` so stale or removed variants fall back cleanly, while skipping the variant modal/dialog UX changes that do not map to this fork.
- [x] `ba00e9a99` is not needed on `my`: upstream only removes `skipFilter={true}` from `packages/opencode/src/cli/cmd/tui/component/dialog-variant.tsx`, but this fork does not ship that dialog surface, so there is no local UI path to fix.
- [x] `5d2dc8888` is relevant on `my`: the same dialog textareas and search input exist locally in `packages/kx/src/cli/cmd/tui/routes/session/question.tsx`, `packages/kx/src/cli/cmd/tui/ui/dialog-export-options.tsx`, `packages/kx/src/cli/cmd/tui/ui/dialog-prompt.tsx`, and `packages/kx/src/cli/cmd/tui/ui/dialog-select.tsx`. Ported `placeholderColor={theme.textMuted}` so placeholder text follows the active theme consistently.
- [x] `f6fd43e57` is not needed on `my`: this fork does not ship the upstream TUI plugin runtime, plugin manager/install flow, or `tui.json` plugin pipeline that the refactor targets. Local `packages/kx/src/plugin/index.ts` still loads server-side plugins directly from `Config.get().plugin`, and `packages/kx/src/config/tui.ts` has no plugin/theme-package loading path, so porting this commit would be broad new surface area rather than a fork-relevant fix.
- [x] `25a2b739e` is not needed on `my`: its meaningful changes depend on the upstream plugin manifest/runtime pipeline (`exports`-based target detection, plugin manager install flow, and no-entrypoint warning paths) that this fork does not ship.
- [x] `2e78fdec4` is partially relevant on `my`: local plugin loading in `packages/kx/src/plugin/index.ts` still installs npm packages directly via `BunProc.install(...)`. Ported the shared safety bit in `packages/kx/src/bun/index.ts` and `packages/kx/src/plugin/index.ts` so plugin installs pass `--ignore-scripts`, while skipping the upstream TUI/plugin-manifest refactor that does not map to this fork.
- [x] `1de06452d` is not needed on `my`: the fix targets upstream `packages/opencode/src/plugin/shared.ts` entrypoint resolution for `exports["./server"]` and `main` values like `dist/server.js`. This fork does not ship that resolver stack; `packages/kx/src/plugin/index.ts` still installs then imports the package directly, so there is no narrow local patch to apply.
- [x] `0b1018f6d` is not needed on `my`: the fix targets upstream `packages/opencode/src/plugin/install.ts` and `patchPluginConfig(...)`, but this fork does not ship that installer/config-writer flow. There is no local `packages/kx/src/plugin/install.ts` or plugin manager patch path to preserve JSONC comments in.
- [x] `1fcfb69bf` is partially relevant on `my`: the built-in GitHub Copilot plugin and provider pipeline still exist locally, so I ported the new provider hook surface in `packages/plugin/src/index.ts`, added `packages/kx/src/plugin/copilot-models.ts`, wired `packages/kx/src/plugin/copilot.ts` to sync model metadata from GitHub's endpoint with fallback to existing models, and updated `packages/kx/src/provider/provider.ts` to let provider hooks override model maps before final filtering. I skipped the upstream file move and kept the local layout intact.
- [x] `e148b318b` is not needed on `my`: `packages/kx/src/effect/cross-spawn-spawner.ts` does not expose the lazy `rt()` / `runPromise*` wrapper that upstream fixed, and `kx` already centralizes runtime memoization in `packages/kx/src/effect/run-service.ts`

### Recent upstream review

- [ ] `5daf2fa7f` looks worth evaluating on `my`: likely local behavior fix for compaction replies matching conversation language; review once pass-5 session work is active
- [x] `733a3bd03` already integrated on `my`: local loop exit logic checks for assistant tool parts before honoring `finish: "stop"`, and `packages/kx/test/session/prompt.test.ts` verifies the follow-up loop continues
- [x] `df1c6c9e8` remains a skip on `my`: first-share consent is tied to session sharing, which this fork plans to remove
- [x] `e148b318b` remains a skip on `my`: local cross-spawn runtime shape does not match the upstream lazy wrapper bug
- [ ] `00d6841f8` may matter if local console token refresh behavior still exists in the trimmed auth flow; review only if token expiry bugs show up
- [x] `1fcfb69bf` already partially integrated on `my`: provider hook API and Copilot model sync path were ported without the upstream plugin/runtime reshuffle
- [x] `d66e6dc25` skip by default: Venice AI dependency/provider addition is outside the current TUI/core-focused scope
- [x] `811c7e249` skip by default: CLI usage-exceeded copy change is low priority and not part of the current fork-integration goals
- [x] `0f488996b` skip by default: Node build-channel wiring does not look relevant to the trimmed `my` branch runtime
- [x] `db9389137` skip by default: Zen trial messaging is product copy churn outside current scope
- [x] `d540d363a` skip by default: broad app/web Solid reactivity cleanup does not map cleanly to the trimmed fork surface
- [x] `327f62526` skip by default: web-only resize observer refactor is outside `my` scope
- [x] `69d047ae7` skip by default: event-listener cleanup is broad web/app maintenance, not a targeted fork fix
- [x] `ec3ae17e4` skip by default: nix hash refresh only
- [x] `23c865608` already integrated on `my`: config model definitions are decoupled from `models.dev` in local config/provider code
- [ ] `57a5236e7` is not independently useful: only regenerate SDK/artifacts if a selected upstream API/schema change is actually ported

## Pass 2: TUI quality-of-life improvements

### Review next

- [x] `f7f41dc3a` fix(tui): apply scroll configuration uniformly across all scrollboxes (integrated into local TUI surfaces)
- [x] `802d16557` chore(tui): clean up scroll config follow-up (ported behavioral bit: respect explicit `scroll_speed: 0`)
- [x] `c526caae7` fix: show model display name in message footer and transcript (integrated into TUI and transcript export)
- [x] `df1c6c9e8` tui: add consent dialog when sharing for the first time (skip: session sharing is being removed from `my`)
- [x] `fa96cb9c6` fix selection expansion by retaining focused input selections during global key events (integrated into TUI keyboard selection handling)
- [x] `d58004a86` fall back to first agent if last used agent is not available (integrated into local agent selection state)
- [x] `186af2723` make variant modal less annoying (partially integrated: kept variant state/fallback fix, skipped modal UI additions not present on `my`)
- [x] `ba00e9a99` fix variant dialog filtering (skip: `my` does not ship the upstream variant dialog surface)
- [x] `5d2dc8888` theme colors for dialog textarea placeholders (integrated into local dialog textarea/input surfaces)

### Notes

- [ ] Bring only the pieces that still exist in the trimmed TUI
- [ ] Skip anything that depends on removed app/web surfaces

## Pass 3: plugin and config pipeline

### Review as one integration area

- [x] `f6fd43e57` refactor plugin/config loading, add theme-only plugin package support (skip: upstream TUI plugin/config runtime does not exist on `my`)
- [x] `25a2b739e` warn only and ignore plugins without entrypoints, default config via exports (skip: upstream plugin install/runtime pipeline does not exist on `my`)
- [x] `2e78fdec4` ensure pinned plugin versions and do not run package scripts on install (partially integrated: kept `--ignore-scripts` for local plugin installs)
- [x] `1de06452d` fix(plugin): properly resolve entrypoints without leading dot (skip: local fork does not use the upstream entrypoint resolver stack)
- [x] `0b1018f6d` plugin installs should preserve jsonc comments (skip: local fork has no upstream plugin install/config patch pipeline)
- [x] `1fcfb69bf` feat: add new provider plugin hook for resolving models and sync models from github models endpoint (partially integrated: added provider hook API and Copilot model sync path)
- [x] `6274b0677` older base context: tui plugins (skip: massive upstream TUI plugin/runtime/config system addition; `my` has no `packages/kx/src/cli/cmd/tui/plugin/*`, no `tui.json` plugin pipeline in `packages/kx/src/config/tui.ts`, and server-side plugins still load directly from `packages/kx/src/plugin/index.ts`, so porting this would be new product surface rather than a fork-relevant fix)
- [x] `f3997d808` older base context: Single target plugin entrypoints (skip: follow-up to upstream v1 plugin entrypoint split across server/TUI modules; `my` has no TUI plugin package surface in `packages/plugin/src/tui.ts`, no TUI runtime loader, and local server plugins still load via legacy export enumeration in `packages/kx/src/plugin/index.ts`)

### Expected conflict areas

- [ ] `packages/opencode/src/plugin/*`
- [ ] `packages/opencode/src/config/*`
- [ ] `packages/opencode/src/cli/cmd/tui/plugin/*`

## Pass 4: bash, shell, and command execution

### Review together

- [x] `e4ff1ea77` refactor(bash): use Effect ChildProcess for bash tool execution (integrated: switched `packages/kx/src/tool/bash.ts` to `ChildProcessSpawner` execution, preserved streamed metadata/output on abort and timeout, added lazy runtime helpers in `packages/kx/src/effect/cross-spawn-spawner.ts`, and added regression coverage in `packages/kx/test/tool/bash.test.ts`)
- [x] `a9c85b7c2` refactor(shell): use Effect ChildProcess for shell command execution (integrated: switched `packages/kx/src/session/prompt.ts` shell execution to `ChildProcessSpawner`, kept streaming metadata updates and abort handling, fixed login-shell invocation ordering for bash/zsh, and added shell regression coverage in `packages/kx/test/session/prompt.test.ts`)
- [x] `b23437008` feat(windows): add first-class pwsh/powershell support (partially integrated: taught `packages/kx/src/shell/shell.ts` to normalize shell names, detect login/posix shells, prefer PowerShell on Windows, and resolve Git Bash paths; updated `packages/kx/src/session/prompt.ts`, `packages/kx/src/pty/index.ts`, and `packages/kx/src/tool/bash.ts` to use those helpers plus direct PowerShell command launching; added coverage in `packages/kx/test/shell/shell.test.ts`; skipped the full upstream PowerShell tree-sitter permission parser and dependency add for now)
- [x] `15a8c22a2` tweak: adjust bash tool description to increase cache hit rates between projects (partially integrated: removed project-specific working-directory text from `packages/kx/src/tool/bash.txt` and stopped injecting `${directory}` in `packages/kx/src/tool/bash.ts`, while keeping fork-specific `${os}`, `${shell}`, and `${chaining}` guidance added for Windows shell support)

### Notes

- [ ] Bring these if `my` still owns shell/bash tools
- [ ] Consider these even if broader session refactors are skipped

## Pass 5: session, prompt, provider, and model refactors

### Review only if needed

- [x] `23c865608` split models.dev and config model definitions (integrated: added a config-scoped `Model` schema in `packages/kx/src/config/config.ts`, narrowed `packages/kx/src/provider/models.ts` so models.dev only describes upstream catalog data, and stopped inheriting `headers` / `options` from models.dev in `packages/kx/src/provider/provider.ts`; verified with config/provider tests plus typecheck, lint, and build)
- [x] `0bae38c06` instruction service migration (partially integrated: skipped the broad Effect service/layer migration because local `packages/kx/src/session/prompt.ts` and config/filesystem paths still use async facades, but ported the behavior-relevant bits in `packages/kx/src/session/instruction.ts` so project `CLAUDE.md` respects `KX_DISABLE_CLAUDE_CODE_PROMPT` and deprecated `CONTEXT.md` still resolves; added regression coverage in `packages/kx/test/session/instruction.test.ts`)
- [x] `26fb6b878` add Effect-returning versions of MessageV2 functions (partially integrated into local `packages/kx/src/session/message.ts`: page/stream/parts/get/filterCompacted now run synchronously over the existing DB facade, `packages/kx/src/session/index.ts` and `packages/kx/src/session/summary.ts` were updated to use the non-async message helpers directly, and `packages/kx/test/session/messages-pagination.test.ts` now covers the sync API shape; skipped the upstream `MessageV2`/Effect-layer migration because this fork still uses `Message` and mixed async facades outside the newer Effect session stack)
- [x] `181b5f623` use Provider service in effect layers (skip: upstream change assumes the newer Effect `Provider.Service` / `Provider.defaultLayer` stack in `packages/opencode/src/provider/provider.ts` plus Effect-layered `session/prompt`, `session/compaction`, and `agent` services. Local `packages/kx/src/provider/provider.ts` still exposes only async facade functions like `Provider.getModel(...)` with no exported Effect service or default layer, and `packages/kx/test/session/prompt.test.ts` still exercises this area with direct `spyOn(Provider, "getModel")` mocks. There is no narrow behavior fix here to port without first adopting the broader provider-service migration covered by later pass-5 commits, so this commit is not worth bringing into `my` on its own.)
- [x] `2f405daa9` use Effect services instead of async facades in provider/auth/file (partially integrated: local `packages/kx/src/provider/provider.ts` still does not expose the upstream Effect `Provider.Service`, so I skipped the provider half, but `packages/kx/src/provider/auth.ts` now builds its hook state from `Plugin.Service` and its default layer provides `Plugin.layer`, and `packages/kx/src/file/index.ts` now uses `AppFileSystem.Service` for global-home directory scanning plus keeps `search()` in direct Effect code instead of wrapping it in `Effect.promise`; added `packages/kx/src/file/index.ts` `defaultLayer` so the file service resolves its filesystem dependency through `makeRunPromise`)
- [x] `3fc0367b9` effectify SessionRevert service (partially integrated: local `packages/kx/src/session/revert.ts` still sits on the older async/session DB facade with direct `Session`, `Snapshot`, `Storage`, and `Bus` helpers, so I skipped the broad service/layer rewrite. The behavior-relevant part for `my` was the new revert cleanup coverage, which I ported into `packages/kx/test/session/revert-compact.test.ts` to lock in part-level cleanup, message cleanup after a revert point, and no-op cleanup when no revert state exists.)
- [x] `954a6ca88` effectify SessionSummary service (partially integrated: local `packages/kx/src/session/summary.ts` still sits on the older async `Session`/`Storage`/`Snapshot` facade, so I skipped the broad Effect service/layer rewrite. The behavior-relevant pieces for `my` were smaller: `SessionSummary.summarize(...)` is fired and forgotten from `packages/kx/src/session/prompt.ts` and `packages/kx/src/session/processor.ts`, so it now swallows background failures instead of risking unhandled rejections, and `packages/kx/src/server/routes/session.ts` now validates diff requests through a dedicated `SessionSummary.DiffInput` schema instead of reaching into `diff.schema`. Added regression coverage in `packages/kx/test/session/session.test.ts` for the swallowed summary-failure path.)
- [ ] `c5442d418` effectify SessionPrompt service
- [ ] `567a91191` simplify LLM stream by replacing queue with fromAsyncIterable
- [ ] `72c77d0e7` fix token usage double-counting
- [ ] `5daf2fa7f` compaction agent responds in same language as conversation
- [ ] `196a03caf` discourage `_noop` tool call during LiteLLM compaction
- [ ] `26cc924ea` prompt caching and cache token tracking for google-vertex-anthropic
- [ ] `4dd866d5c` transform fix after AI SDK v6 change
- [ ] `2daf4b805` dedicated system prompt for Kimi models

### Notes

- [ ] Treat these as high-value but conflict-prone
- [ ] Bring them only when there is a clear behavior gap or failing test

## Pass 6: SDK parity

### Review only if server route/schema changes are selected

- [ ] `57a5236e7` chore: generate
- [ ] `a76be695c` refactor(core): split out instance and route through workspaces
- [ ] related `generate` commits tied to selected API changes

### Notes

- [ ] Do not regenerate just to match upstream if the trimmed fork does not expose the same API surface

## Suggested execution order

- [x] Cherry-pick or manually port Pass 1 commits (reviewed all current Pass 1 candidates; remaining ones were either already integrated or intentionally skipped earlier)
- [x] Run targeted checks (ran `bun test test/plugin/trigger.test.ts`, `bun test test/session/prompt.test.ts`, `bun test test/snapshot/snapshot.test.ts`, `bun test test/file/time.test.ts`, and `bun typecheck` in `packages/kx`)
- [ ] Bring selected TUI improvements from Pass 2
- [ ] Decide whether plugin/config loading changes are needed
- [ ] If yes, integrate Pass 3 as a focused branch of work
- [ ] Revisit bash/shell execution changes
- [ ] Only then consider deep session/provider refactors

## Verification

### `packages/opencode`

- [ ] `bun test test/plugin/trigger.test.ts`
- [ ] `bun test test/tool/bash.test.ts`
- [ ] `bun test test/session/prompt-effect.test.ts`
- [ ] `bun typecheck`

### `packages/plugin`

- [ ] `bun typecheck`

### `packages/sdk/js`

- [ ] regenerate only if selected changes require it
- [ ] `bun typecheck`

## Decision rules

- [ ] Prefer manual porting over cherry-pick when a commit touches removed surfaces
- [ ] Prefer cherry-pick when the commit is small, isolated, and still maps cleanly to existing files
- [ ] Skip release, nix, CI, and unrelated product commits
- [ ] Skip app/ui/web changes unless they directly affect the TUI/core experience still present in `my`

## Initial shortlist

- [x] `55895d066`
- [x] `a5b1dc081`
- [x] `733a3bd03`
- [x] `48db7cf07`
- [x] `880c0a747`
- [x] `e148b318b`
- [ ] `f7f41dc3a`
- [ ] `f6fd43e57`
- [ ] `e4ff1ea77`
- [ ] `23c865608`
