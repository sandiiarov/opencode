import { base, files, ignore, node } from "@kx/config-eslint"

export default [
  ignore("src/**/*.gen.ts", "src/**/gen/**"),
  ...base(),
  ...node(),
  ...files(),
  {
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "import/first": "off",
      "import/newline-after-import": "off",
    },
  },
]
