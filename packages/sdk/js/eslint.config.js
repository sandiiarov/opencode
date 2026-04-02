import { base, files, ignore, node } from "@kx/config-eslint"

export default [ignore("src/**/*.gen.ts", "src/**/gen/**"), ...base(), ...node(), ...files()]
