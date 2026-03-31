#!/usr/bin/env bun

import { $ } from "bun"

await $`bun ./packages/sdk/js/script/build.ts`

await $`bun --cwd packages/kx run schema`

await $`bun dev generate > ../sdk/openapi.json`.cwd("packages/kx")

await $`./script/format.ts`
