import js from "@eslint/js"
import prettier from "eslint-config-prettier"
import checkFile from "eslint-plugin-check-file"
import importPlugin from "eslint-plugin-import"
import globals from "globals"
import tseslint from "typescript-eslint"

const exts = ["**/*.{ts,tsx}"]
const src = ["src/**/*.{ts,tsx}"]
const ignores = [
  "**/node_modules/**",
  "**/dist/**",
  "**/coverage/**",
  "**/.turbo/**",
  "**/*.d.ts",
  "**/*.js",
  "**/*.mjs",
  "**/*.cjs",
]

export const ignore = (...patterns) => ({
  ignores: [...ignores, ...patterns],
})

export const base = () => [
  ignore(),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: exts,
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "import/first": "off",
      "import/newline-after-import": "off",
      "import/no-duplicates": "off",
      "no-async-promise-executor": "off",
      "no-case-declarations": "off",
      "no-control-regex": "off",
      "no-empty": "off",
      "no-fallthrough": "off",
      "no-useless-escape": "off",
      "prefer-const": "off",
      "preserve-caught-error": "off",
      "require-yield": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "no-constant-condition": "off",
      "no-useless-assignment": "off",
      "no-useless-catch": "off",
    },
    plugins: {
      import: importPlugin,
    },
  },
]

export const bun = () => [
  {
    files: exts,
    languageOptions: {
      globals: {
        ...globals.bun,
        ...globals.node,
      },
    },
  },
]

export const node = () => [
  {
    files: exts,
    languageOptions: {
      globals: globals.node,
    },
  },
]

export const jsx = () => [
  {
    files: ["**/*.tsx"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
]

export const files = () => [
  {
    files: src,
    ignores: ["**/*.bun.ts", "**/*.node.ts", "**/*.d.ts", "**/*.gen.ts", "**/*.sql.ts"],
    plugins: {
      "check-file": checkFile,
    },
    rules: {
      "check-file/filename-naming-convention": ["error", { "**/*": "KEBAB_CASE" }],
    },
  },
]
