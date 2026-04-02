# Solid to React TUI Plan

## Goals

- Build `tui-react` as a replacement for the current Solid-based TUI.
- Keep feature parity for the main user flows while making the codebase more readable and easier to maintain.
- Introduce shared TypeScript and ESLint configs before starting the UI migration.
- Port the existing TUI in small, testable phases instead of doing a single rewrite.

## Why a React Port Makes Sense

- OpenTUI now has first-class React support via `@opentui/react`.
- The current TUI is already organized around reusable surfaces: app shell, session, sidebar, dialogs, prompt, and menus.
- Most migration risk is structural rather than product-level because the behavior already exists.

## Current TUI Research

### Main surfaces

- App shell and provider tree: `packages/kx/src/cli/cmd/tui/app.tsx`
- Session route: `packages/kx/src/cli/cmd/tui/routes/session/index.tsx`
- Sidebar: `packages/kx/src/cli/cmd/tui/routes/session/sidebar.tsx`
- Prompt and autocomplete: `packages/kx/src/cli/cmd/tui/component/prompt/index.tsx`, `packages/kx/src/cli/cmd/tui/component/prompt/autocomplete.tsx`
- Dialog primitives: `packages/kx/src/cli/cmd/tui/ui/dialog.tsx`, `packages/kx/src/cli/cmd/tui/ui/dialog-select.tsx`
- Command palette: `packages/kx/src/cli/cmd/tui/component/dialog-command.tsx`
- Home route: `packages/kx/src/cli/cmd/tui/routes/home.tsx`
- Session support surfaces: `packages/kx/src/cli/cmd/tui/routes/session/header.tsx`, `packages/kx/src/cli/cmd/tui/routes/session/footer.tsx`, `packages/kx/src/cli/cmd/tui/routes/session/permission.tsx`, `packages/kx/src/cli/cmd/tui/routes/session/question.tsx`

### Main structural issues in the current implementation

- No shared ESLint config.
- No shared TypeScript config package.
- Too much logic is packed into large files.
- `packages/kx/src/cli/cmd/tui/routes/session/index.tsx` is a monolith mixing route logic, render logic, commands, scrolling, and message-part rendering.
- `packages/kx/src/cli/cmd/tui/component/prompt/index.tsx` is also a monolith mixing editor behavior, paste handling, autocomplete, submit flow, and prompt state.
- Command registration is distributed across multiple surfaces.
- UI logic and domain logic are often coupled too tightly.

## Shared Config Work First

Use the same approach as `~/Documents/dotfiles/cli`.

### Create workspace config packages

- `packages/config-typescript`
- `packages/config-eslint`

### TypeScript config exports

Recommended exports:

- `base.json`
- `bun.json`
- `node-lib.json`
- `opentui-react.json`

### ESLint config exports

Recommended exports:

- base TypeScript rules
- Bun package rules
- React/OpenTUI JSX rules
- optional filename/import ordering rules modeled after `~/Documents/dotfiles/cli/packages/config-eslint`

### Adopt configs across workspace

Update these packages to consume shared configs:

- `packages/kx`
- `packages/plugin`
- `packages/sdk/js`
- `packages/util`
- future `packages/tui-react`

## Recommended Target Architecture For `tui-react`

### New package

Create `tui-react` as a new workspace package rather than replacing the current TUI in place.

Suggested package path:

- `packages/tui-react`

### Why a separate package

- Safer migration path
- Easier parity testing
- Lets us keep the Solid TUI working while React stabilizes
- Makes it easier to compare screens and behavior during the port

## Backport Priority

### Phase 1: platform foundation

Backport first:

- app shell
- provider tree
- route state
- sync state
- theme state
- local state
- keybind layer
- persisted KV state
- dialog stack
- dialog select primitive
- command palette
- toast layer

Primary source files:

- `packages/kx/src/cli/cmd/tui/app.tsx`
- `packages/kx/src/cli/cmd/tui/context/sdk.tsx`
- `packages/kx/src/cli/cmd/tui/context/sync.tsx`
- `packages/kx/src/cli/cmd/tui/context/route.tsx`
- `packages/kx/src/cli/cmd/tui/context/theme.tsx`
- `packages/kx/src/cli/cmd/tui/context/local.tsx`
- `packages/kx/src/cli/cmd/tui/context/keybind.tsx`
- `packages/kx/src/cli/cmd/tui/context/kv.tsx`
- `packages/kx/src/cli/cmd/tui/context/prompt.tsx`
- `packages/kx/src/cli/cmd/tui/context/tui-config.tsx`
- `packages/kx/src/cli/cmd/tui/ui/dialog.tsx`
- `packages/kx/src/cli/cmd/tui/ui/dialog-select.tsx`
- `packages/kx/src/cli/cmd/tui/ui/toast.tsx`
- `packages/kx/src/cli/cmd/tui/component/dialog-command.tsx`

Deliverable:

- React app bootstraps with OpenTUI React and can show dialogs, register commands, and switch routes.

### Phase 2: prompt and home flow

Backport next:

- home route
- prompt component
- prompt autocomplete
- prompt history
- prompt stash integration

Primary source files:

- `packages/kx/src/cli/cmd/tui/routes/home.tsx`
- `packages/kx/src/cli/cmd/tui/component/prompt/index.tsx`
- `packages/kx/src/cli/cmd/tui/component/prompt/autocomplete.tsx`
- `packages/kx/src/cli/cmd/tui/component/prompt/history.tsx`
- `packages/kx/src/cli/cmd/tui/component/prompt/stash.tsx`

Deliverable:

- User can open the React TUI, type, autocomplete, and submit prompts.

### Phase 3: session shell and timeline

Backport next:

- session shell
- message list
- user message block
- assistant text block
- reasoning block
- tool part scaffold
- header/footer

Primary source files:

- `packages/kx/src/cli/cmd/tui/routes/session/index.tsx`
- `packages/kx/src/cli/cmd/tui/routes/session/header.tsx`
- `packages/kx/src/cli/cmd/tui/routes/session/footer.tsx`

Deliverable:

- React session route can render the main conversation timeline with basic parity.

### Phase 4: sidebar and interruption flows

Backport next:

- sidebar
- permission prompt
- question prompt
- transcript/export helpers if needed for parity

Primary source files:

- `packages/kx/src/cli/cmd/tui/routes/session/sidebar.tsx`
- `packages/kx/src/cli/cmd/tui/routes/session/permission.tsx`
- `packages/kx/src/cli/cmd/tui/routes/session/question.tsx`
- `packages/kx/src/cli/cmd/tui/util/transcript.ts`

Deliverable:

- React TUI supports the full main session workflow, including side information and interruption gates.

### Phase 5: advanced dialogs and management flows

Backport last:

- jump-to-message dialog
- fork-from-message dialog
- message actions dialog
- model/agent/theme/session/workspace dialogs
- status/help dialogs

Primary source files:

- `packages/kx/src/cli/cmd/tui/routes/session/dialog-message.tsx`
- `packages/kx/src/cli/cmd/tui/routes/session/dialog-timeline.tsx`
- `packages/kx/src/cli/cmd/tui/routes/session/dialog-fork-from-timeline.tsx`
- `packages/kx/src/cli/cmd/tui/component/dialog-model.tsx`
- `packages/kx/src/cli/cmd/tui/component/dialog-agent.tsx`
- `packages/kx/src/cli/cmd/tui/component/dialog-session-list.tsx`
- `packages/kx/src/cli/cmd/tui/component/dialog-workspace-list.tsx`
- `packages/kx/src/cli/cmd/tui/component/dialog-theme-list.tsx`
- `packages/kx/src/cli/cmd/tui/ui/dialog-help.tsx`
- `packages/kx/src/cli/cmd/tui/component/dialog-status.tsx`

Deliverable:

- React TUI reaches near-full parity with the current Solid TUI.

## Refactor Rules During Migration

- Do not port monoliths 1:1.
- Split `session/index.tsx` into smaller React components during the port.
- Split `prompt/index.tsx` into state, editor, autocomplete, and submit concerns.
- Keep domain/state services shared where possible.
- Prefer view-model helpers for message rendering instead of pulling directly from normalized stores in every component.
- Centralize command registration patterns so routes compose commands instead of embedding command logic everywhere.

## Suggested Initial `tui-react` Structure

```text
packages/tui-react/
  package.json
  tsconfig.json
  eslint.config.js
  src/
    app.tsx
    index.ts
    context/
      sdk.tsx
      sync.tsx
      route.tsx
      theme.tsx
      local.tsx
      keybind.tsx
      kv.tsx
      prompt.tsx
      tui-config.tsx
    ui/
      dialog.tsx
      dialog-select.tsx
      dialog-prompt.tsx
      dialog-confirm.tsx
      toast.tsx
    component/
      prompt/
        index.tsx
        autocomplete.tsx
        history.tsx
        stash.tsx
      dialog-command.tsx
    routes/
      home.tsx
      session/
        index.tsx
        header.tsx
        footer.tsx
        sidebar.tsx
        permission.tsx
        question.tsx
        parts/
          user-message.tsx
          assistant-message.tsx
          text-part.tsx
          reasoning-part.tsx
          tool-part.tsx
```

## Definition Of Done For The First Milestone

- Shared TS config package exists and is adopted.
- Shared ESLint config package exists and is adopted.
- `packages/tui-react` exists.
- React TUI boots with OpenTUI React.
- Dialog system works.
- Command palette works.
- Prompt works for basic text submission.
- Session route renders messages from synced state.

## Recommended Execution Order

1. Create shared TypeScript config package.
2. Create shared ESLint config package.
3. Migrate current packages to shared configs.
4. Scaffold `packages/tui-react`.
5. Port app shell and contexts.
6. Port dialog/menu primitives.
7. Port prompt flow.
8. Port session shell and message rendering.
9. Port sidebar and advanced dialogs.
10. Run typecheck and lint package by package as the migration progresses.

## Notes

- OpenTUI React support is available, so this should be treated as a structured migration rather than an experiment.
- The biggest win is not only switching frameworks, but cleaning the architecture while doing it.
- The best first commit after this plan is shared configs, because they improve both the existing Solid TUI and the future React TUI.
