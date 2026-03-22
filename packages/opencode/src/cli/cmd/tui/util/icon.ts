import { RGBA } from "@opentui/core"
import path from "path"

const langs: Record<string, string> = {
  astro: "",
  bash: "",
  biome: "",
  css: "",
  deno: "",
  dockerfile: "󰡨",
  eslint: "",
  go: "",
  gopls: "",
  graphql: "",
  html: "",
  js: "",
  javascript: "",
  json: "",
  jsx: "",
  lua: "",
  markdown: "",
  mdx: "",
  node: "",
  nodejs: "",
  prisma: "",
  python: "",
  rust: "",
  sql: "",
  stylelint: "",
  svelte: "",
  tailwindcss: "󱏿",
  terraform: "",
  toml: "",
  ts: "",
  tsx: "",
  typescript: "",
  vue: "",
  yaml: "",
  yml: "",
}

const servers: Record<string, string> = {
  eslint: "",
  graphql: "",
  stylelint: "",
  typescript: "",
}

const mocha = {
  blue: RGBA.fromHex("#89b4fa"),
  flamingo: RGBA.fromHex("#f2cdcd"),
  green: RGBA.fromHex("#a6e3a1"),
  lavender: RGBA.fromHex("#b4befe"),
  maroon: RGBA.fromHex("#eba0ac"),
  mauve: RGBA.fromHex("#cba6f7"),
  peach: RGBA.fromHex("#fab387"),
  pink: RGBA.fromHex("#f5c2e7"),
  red: RGBA.fromHex("#f38ba8"),
  sapphire: RGBA.fromHex("#74c7ec"),
  sky: RGBA.fromHex("#89dceb"),
  subtext0: RGBA.fromHex("#a6adc8"),
  teal: RGBA.fromHex("#94e2d5"),
  yellow: RGBA.fromHex("#f9e2af"),
} as const

const tones: Record<string, RGBA> = {
  astro: mocha.mauve,
  bash: mocha.subtext0,
  biome: mocha.peach,
  css: mocha.sapphire,
  deno: mocha.green,
  dockerfile: mocha.blue,
  eslint: mocha.lavender,
  go: mocha.sapphire,
  gopls: mocha.sapphire,
  graphql: mocha.pink,
  html: mocha.peach,
  javascript: mocha.yellow,
  json: mocha.peach,
  js: mocha.yellow,
  jsx: mocha.blue,
  lua: mocha.lavender,
  markdown: mocha.subtext0,
  mdx: mocha.mauve,
  node: mocha.green,
  nodejs: mocha.green,
  prisma: mocha.mauve,
  python: mocha.yellow,
  rust: mocha.peach,
  sql: mocha.sky,
  stylelint: mocha.pink,
  svelte: mocha.maroon,
  tailwindcss: mocha.teal,
  terraform: mocha.mauve,
  toml: mocha.subtext0,
  ts: mocha.blue,
  tsx: mocha.blue,
  typescript: mocha.blue,
  vue: mocha.green,
  yaml: mocha.yellow,
  yml: mocha.yellow,
}

const serverTones: Record<string, RGBA> = {
  eslint: mocha.lavender,
  graphql: mocha.pink,
  stylelint: mocha.pink,
  typescript: mocha.blue,
}

function sourcekey(input?: string) {
  if (!input) return ""
  const key = input.toLowerCase().trim()
  return key.split(":")[0]?.trim() ?? key
}

function filekey(input?: string) {
  if (!input) return ""
  return input.toLowerCase().trim()
}

export function langicon(input?: string) {
  if (!input) return "󰈙"
  const key = filekey(input)
  return langs[key] ?? langs[path.extname(key).slice(1)] ?? "󰈙"
}

export function langcolor(input?: string) {
  if (!input) return mocha.subtext0
  const key = filekey(input)
  return tones[key] ?? tones[path.extname(key).slice(1)] ?? mocha.subtext0
}

export function lspicon(input?: string) {
  if (!input) return "󰈙"
  const key = sourcekey(input)
  return servers[key] ?? langs[key] ?? "󰈙"
}

export function lspcolor(input?: string) {
  if (!input) return mocha.subtext0
  const key = sourcekey(input)
  return serverTones[key] ?? tones[key] ?? mocha.subtext0
}

export function pathicon(input?: string) {
  if (!input) return "󰉋"
  const base = path.basename(input).toLowerCase()
  if (base === "." || !path.extname(base)) return "󰉋"
  return langicon(base)
}

export function pathlabel(input?: string) {
  if (!input) return pathicon(input)
  return `${pathicon(input)} ${input}`
}
