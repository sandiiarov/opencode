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

- [ ] `55895d066` core: fix plugin hooks to properly handle async operations
- [ ] `a5b1dc081` test: add regression coverage for sync plugin hooks
- [ ] `733a3bd03` fix(core): prevent agent loop from stopping after tool calls with OpenAI-compatible providers
- [ ] `48db7cf07` fix(opencode): batch snapshot revert without reordering
- [ ] `880c0a747` fix: normalize filepath in FileTime to prevent Windows path mismatch
- [ ] `e148b318b` fix(build): replace `require()` with dynamic `import()` in cross-spawn-spawner

### Notes

- [ ] Prefer these first because they are the best candidates to import without broad architectural churn
- [ ] Validate each one against local deletions before cherry-picking

## Pass 2: TUI quality-of-life improvements

### Review next

- [ ] `f7f41dc3a` fix(tui): apply scroll configuration uniformly across all scrollboxes
- [ ] `802d16557` chore(tui): clean up scroll config follow-up
- [ ] `c526caae7` fix: show model display name in message footer and transcript
- [ ] `df1c6c9e8` tui: add consent dialog when sharing for the first time
- [ ] `fa96cb9c6` fix selection expansion by retaining focused input selections during global key events
- [ ] `d58004a86` fall back to first agent if last used agent is not available
- [ ] `186af2723` make variant modal less annoying
- [ ] `ba00e9a99` fix variant dialog filtering
- [ ] `5d2dc8888` theme colors for dialog textarea placeholders

### Notes

- [ ] Bring only the pieces that still exist in the trimmed TUI
- [ ] Skip anything that depends on removed app/web surfaces

## Pass 3: plugin and config pipeline

### Review as one integration area

- [ ] `f6fd43e57` refactor plugin/config loading, add theme-only plugin package support
- [ ] `25a2b739e` warn only and ignore plugins without entrypoints, default config via exports
- [ ] `2e78fdec4` ensure pinned plugin versions and do not run package scripts on install
- [ ] `1de06452d` fix(plugin): properly resolve entrypoints without leading dot
- [ ] `0b1018f6d` plugin installs should preserve jsonc comments
- [ ] `1fcfb69bf` feat: add new provider plugin hook for resolving models and sync models from github models endpoint
- [ ] `6274b0677` older base context: tui plugins
- [ ] `f3997d808` older base context: Single target plugin entrypoints

### Expected conflict areas

- [ ] `packages/opencode/src/plugin/*`
- [ ] `packages/opencode/src/config/*`
- [ ] `packages/opencode/src/cli/cmd/tui/plugin/*`

## Pass 4: bash, shell, and command execution

### Review together

- [ ] `e4ff1ea77` refactor(bash): use Effect ChildProcess for bash tool execution
- [ ] `a9c85b7c2` refactor(shell): use Effect ChildProcess for shell command execution
- [ ] `b23437008` feat(windows): add first-class pwsh/powershell support
- [ ] `15a8c22a2` tweak: adjust bash tool description to increase cache hit rates between projects

### Notes

- [ ] Bring these if `my` still owns shell/bash tools
- [ ] Consider these even if broader session refactors are skipped

## Pass 5: session, prompt, provider, and model refactors

### Review only if needed

- [ ] `23c865608` split models.dev and config model definitions
- [ ] `0bae38c06` instruction service migration
- [ ] `26fb6b878` add Effect-returning versions of MessageV2 functions
- [ ] `181b5f623` use Provider service in effect layers
- [ ] `2f405daa9` use Effect services instead of async facades in provider/auth/file
- [ ] `3fc0367b9` effectify SessionRevert service
- [ ] `954a6ca88` effectify SessionSummary service
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

- [ ] Cherry-pick or manually port Pass 1 commits
- [ ] Run targeted checks
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

- [ ] `55895d066`
- [ ] `a5b1dc081`
- [ ] `733a3bd03`
- [ ] `48db7cf07`
- [ ] `880c0a747`
- [ ] `e148b318b`
- [ ] `f7f41dc3a`
- [ ] `f6fd43e57`
- [ ] `e4ff1ea77`
- [ ] `23c865608`
