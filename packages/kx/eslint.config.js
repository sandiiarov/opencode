import { base, bun, files, jsx } from "@kx/config-eslint"

export default [
  ...base(),
  ...bun(),
  ...jsx(),
  ...files(),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": "off",
    },
  },
]
