- Core packages live in `packages/kx`, `packages/plugin`, `packages/sdk/js`, and `packages/util`.
- To regenerate the JavaScript SDK, run `./packages/sdk/js/script/build.ts`.
- ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE.
- The default branch in this repo is `dev`.
- Local `main` ref may not exist; use `dev` or `origin/dev` for diffs.
- Prefer automation: execute requested actions without confirmation unless blocked by missing info or safety/irreversibility.

## Style Guide

### General Principles

- Keep things in one function unless composable or reusable
- Avoid `try`/`catch` where possible
- Avoid using the `any` type
- Prefer single word variable names where possible
- Use Bun APIs when possible, like `Bun.file()`
- Rely on type inference when possible; avoid explicit type annotations or interfaces unless necessary for exports or clarity
- Prefer functional array methods (`flatMap`, `filter`, `map`) over loops when they keep type inference clear

### Naming

- Prefer single word names for variables and functions unless a longer name is clearly better
- Review touched code and shorten new identifiers where possible
- Good short names to prefer: `pid`, `cfg`, `err`, `opts`, `dir`, `root`, `child`, `state`, `timeout`

### Variables

- Prefer `const` over `let`
- Prefer early returns and ternaries over reassignment
- Avoid unnecessary destructuring; use dot notation when it keeps context clearer

### Control Flow

- Avoid `else` statements when an early return is clearer

### Testing

- Avoid mocks as much as possible
- Test actual implementation, do not duplicate logic into tests
- Tests cannot run from repo root; run them from package dirs like `packages/kx`

### Type Checking

- Always run `bun typecheck` from package directories, never `tsc` directly
