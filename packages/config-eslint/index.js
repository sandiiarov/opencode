import js from "@eslint/js"
import prettier from "eslint-config-prettier"
import checkFile from "eslint-plugin-check-file"
import importPlugin from "eslint-plugin-import"
import reactHooks from "eslint-plugin-react-hooks"
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
    plugins: {
      import: importPlugin,
    },
    rules: {
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "separate-type-imports" }],
      "@typescript-eslint/no-empty-object-type": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-namespace": "error",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-this-alias": "error",
      "@typescript-eslint/no-unused-expressions": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
        },
      ],
      "import/first": "error",
      "import/newline-after-import": ["error", { count: 1 }],
      "import/no-duplicates": "error",
      "no-async-promise-executor": "error",
      "no-case-declarations": "error",
      "no-control-regex": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-fallthrough": "error",
      "no-constant-condition": ["error", { checkLoops: false }],
      "no-useless-assignment": "error",
      "no-useless-catch": "error",
      "no-useless-escape": "error",
      "prefer-const": "error",
      "preserve-caught-error": "error",
      "require-yield": "error",
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
export const react = () => [
  reactHooks.configs.flat["recommended-latest"],
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
