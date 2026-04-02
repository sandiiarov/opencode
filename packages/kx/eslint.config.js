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
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "import/first": "off",
      "import/newline-after-import": "off",
      "import/no-duplicates": "off",
      "no-async-promise-executor": "off",
      "no-control-regex": "off",
      "prefer-const": "off",
      "preserve-caught-error": "off",
      "require-yield": "off",
      "no-case-declarations": "off",
      "no-constant-condition": "off",
      "no-fallthrough": "off",
      "no-useless-assignment": "off",
      "no-useless-catch": "off",
    },
  },
]
