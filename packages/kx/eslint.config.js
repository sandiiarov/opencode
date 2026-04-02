import { base, bun, files, jsx } from "@kx/config-eslint"

export default [
  ...base(),
  ...bun(),
  ...jsx(),
  ...files(),
  {
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "prefer-const": "off",
      "require-yield": "off",
    },
  },
]
