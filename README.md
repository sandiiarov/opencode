<h1 align="center">kx</h1>
<p align="center">The open source AI coding agent.</p>
<p align="center">
  <a href="https://kx.ai/discord"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
</p>

---

### Development

```bash
bun install
bun run --cwd packages/kx dev
```

To build a local binary instead, run `bun run --cwd packages/kx build -- --single`.

### Agents

kx includes two built-in agents you can switch between with the `Tab` key.

- **build** - Default, full-access agent for development work
- **plan** - Read-only agent for analysis and code exploration
  - Denies file edits by default
  - Asks permission before running bash commands
  - Ideal for exploring unfamiliar codebases or planning changes

Also included is a **general** subagent for complex searches and multistep tasks.
This is used internally and can be invoked using `@general` in messages.

Learn more about [agents](https://kx.ai/docs/agents).

### Documentation

For more info on how to configure kx, [**head over to our docs**](https://kx.ai/docs).

### Building on kx

If you are working on a project that's related to kx and is using "kx" as part of its name, for example "kx-dashboard" or "kx-mobile", please add a note to your README to clarify that it is not built by the kx team and is not affiliated with us in any way.

### FAQ

#### How is this different from Claude Code?

It's very similar to Claude Code in terms of capability. Here are the key differences:

- 100% open source
- Not coupled to any provider. Although we recommend the models we provide through [kx Zen](https://kx.ai/zen), kx can be used with Claude, OpenAI, Google, or even local models. As models evolve, the gaps between them will close and pricing will drop, so being provider-agnostic is important.
- Out-of-the-box LSP support
- A focus on TUI. kx is built by neovim users and the creators of [terminal.shop](https://terminal.shop); we are going to push the limits of what's possible in the terminal.
- A client/server architecture. This, for example, can allow kx to run on your computer while you drive it remotely from a mobile app, meaning that the TUI frontend is just one of the possible clients.

---

**Join our community** [Discord](https://discord.gg/kx) | [X.com](https://x.com/kx)
