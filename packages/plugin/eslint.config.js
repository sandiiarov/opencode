import { base, files, node } from "@kx/config-eslint"

export default [
  ...base(),
  ...node(),
  ...files(),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]
