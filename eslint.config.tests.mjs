import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.spec.ts", "**/tests/**/*.ts", "**/page-objects/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.object.name='test'][callee.property.name='skip']",
          message: "test.skip() is forbidden. Use proper expect() assertions instead of conditional skips.",
        },
        {
          selector: "CallExpression[callee.object.name='test'][callee.property.name='only']",
          message: "test.only() is forbidden. Remove .only() before committing.",
        },
        {
          selector: "CallExpression[callee.property.name='waitForTimeout']",
          message: "waitForTimeout() is forbidden. Use state-based waits: waitForLoadState(), expect().toBeVisible(), element.waitFor().",
        },
        {
          selector: "CallExpression[callee.property.name='or']",
          message: ".or() fallback selectors are forbidden. Use single, correct selectors with strict expect() assertions.",
        },
      ],
    },
  },
];

export default eslintConfig;