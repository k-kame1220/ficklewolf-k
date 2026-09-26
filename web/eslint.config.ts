import eslint from "@eslint/js";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import eslintReact from "@eslint-react/eslint-plugin";
import vitest from "@vitest/eslint-plugin";
import { defineConfig } from "eslint/config";
import boundaries from "eslint-plugin-boundaries";
import functional from "eslint-plugin-functional";
import { importX } from "eslint-plugin-import-x";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import reactRefresh from "eslint-plugin-react-refresh";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

const MAX_NESTING_DEPTH = 3;

const LINEAR_SEARCH_METHODS = [
  "some",
  "every",
  "find",
  "findIndex",
  "findLast",
  "findLastIndex",
  "includes",
  "indexOf",
  "lastIndexOf"
];

const BASE_RESTRICTED_SYNTAX: { selector: string; message: string }[] = [
  {
    selector: `CallExpression[callee.type='MemberExpression'][callee.property.name=/^(${LINEAR_SEARCH_METHODS.join("|")})$/]`,
    message:
      "線形探索（O(n)）は避け、Map / Set を作って has / get で O(1) で引いてください。どうしても必要な場合は理由を書いて無効化してください。"
  },
  {
    selector: "TSEnumDeclaration",
    message: "enum は使わず、文字列リテラルのユニオン型か `as const` のオブジェクトを使ってください。"
  },
  {
    selector: "ClassDeclaration:not([superClass.name=/Error$/]), ClassExpression:not([superClass.name=/Error$/])",
    message: "class は Error を継承する場合だけ使えます。それ以外は型とプレーンなオブジェクト・関数で書いてください。"
  },
  {
    selector: "ForInStatement",
    message: "for...in は使わず、for...of と Object.entries / Map を使ってください。"
  },
  {
    selector: "LabeledStatement",
    message: "ラベル付きの文は使わないでください。"
  }
];

export default defineConfig(
  {
    ignores: ["dist", "node_modules", "coverage", "public", "src/api/generated", "playwright-report", "test-results"]
  },

  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintComments.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser },
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error"
    },
    plugins: {
      functional,
      "import-x": importX,
      "unused-imports": unusedImports
    },
    settings: {
      "import-x/resolver": {
        typescript: { alwaysTryTypes: true, project: ["./tsconfig.json"] }
      }
    },
    rules: {
      "functional/no-let": "error",
      "prefer-const": "error",
      "no-var": "error",
      "no-param-reassign": ["error", { props: true }],
      "functional/immutable-data": [
        "error",
        {
          ignoreImmediateMutation: true,
          ignoreClasses: false,
          ignoreMapsAndSets: false
        }
      ],
      "no-plusplus": "error",

      "no-nested-ternary": "error",
      "no-else-return": ["error", { allowElseIf: false }],
      "max-depth": ["error", MAX_NESTING_DEPTH],
      eqeqeq: ["error", "always"],
      "object-shorthand": ["error", "always"],
      "no-implicit-coercion": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-restricted-syntax": ["error", ...BASE_RESTRICTED_SYNTAX],

      "no-restricted-globals": [
        "error",
        { name: "sessionStorage", message: "sessionStorage は使いません。" },
        { name: "localStorage", message: "端末への保存は shared/storage を経由してください。" },
        { name: "indexedDB", message: "端末への保存は shared/storage を経由してください。" },
        { name: "alert", message: "alert は使わず、shared/ui のダイアログを使ってください。" },
        { name: "confirm", message: "confirm は使わず、shared/ui のダイアログを使ってください。" },
        { name: "prompt", message: "prompt は使わず、shared/ui のダイアログを使ってください。" }
      ],
      "no-restricted-properties": [
        "error",
        { object: "window", property: "sessionStorage", message: "sessionStorage は使いません。" },
        { object: "window", property: "localStorage", message: "端末への保存は shared/storage を経由してください。" },
        { object: "document", property: "cookie", message: "cookie は使いません。" }
      ],

      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "zod", message: "バリデーションは valibot を使ってください。" },
            {
              name: "zustand",
              importNames: ["create"],
              message:
                "グローバルなストアは作りません。createStore をスコープの Provider 内で作り、Context 経由で useStore してください（docs/03 §4）。"
            },
            { name: "zustand/traditional", message: "グローバルなストアは作りません（docs/03 §4）。" },
            {
              name: "zustand/middleware",
              importNames: ["persist"],
              message: "永続化は shared/storage を経由してください。"
            },
            { name: "lodash", message: "標準の JS / TS で書いてください。" },
            { name: "axios", message: "通信は api/client（openapi-fetch）を使ってください。" }
          ],
          patterns: [
            {
              group: ["@/features/*/*"],
              message: "feature は index.ts から公開されたものだけを使ってください（`@/features/xxx`）。"
            },
            {
              group: ["../../*"],
              message: "2 階層以上さかのぼる相対 import は使わず、`@/` のエイリアスを使ってください。"
            }
          ]
        }
      ],
      "unused-imports/no-unused-imports": "error",
      "import-x/no-cycle": "error",
      "import-x/no-self-import": "error",
      "import-x/no-duplicates": "error",
      "import-x/no-useless-path-segments": "error",
      "import-x/no-mutable-exports": "error",
      "import-x/first": "error",
      "import-x/newline-after-import": "error",
      "import-x/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "object", "type"],
          pathGroups: [{ pattern: "@/**", group: "internal", position: "after" }],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true }
        }
      ],

      "no-magic-numbers": "off",
      "@typescript-eslint/no-magic-numbers": [
        "error",
        {
          ignore: [0, 1, -1],
          enforceConst: true,
          detectObjects: false,
          ignoreArrayIndexes: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true
        }
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", disallowTypeAnnotations: false }
      ],
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        { requireDefaultForNonUnion: true, considerDefaultExhaustiveForUnions: false }
      ],
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        { allowString: false, allowNumber: false, allowNullableObject: true }
      ],
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "variable", modifiers: ["const", "global"], format: ["camelCase", "PascalCase", "UPPER_CASE"] },
        { selector: "variable", format: ["camelCase", "PascalCase"], leadingUnderscore: "allow" },
        { selector: "function", format: ["camelCase", "PascalCase"] },
        {
          selector: "variable",
          types: ["boolean"],
          format: ["PascalCase"],
          prefix: ["is", "has", "can", "should", "was", "did"],
          filter: { regex: "^_", match: false }
        }
      ],

      "@eslint-community/eslint-comments/require-description": ["error", { ignore: [] }],
      "@eslint-community/eslint-comments/no-unlimited-disable": "error",
      "@eslint-community/eslint-comments/disable-enable-pair": ["error", { allowWholeFile: false }],
      "@eslint-community/eslint-comments/no-unused-disable": "error"
    }
  },

  {
    files: ["src/**/*.tsx"],
    ...eslintReact.configs["strict-type-checked"],
    plugins: {
      ...eslintReact.configs["strict-type-checked"].plugins,
      "react-refresh": reactRefresh
    },
    rules: {
      ...eslintReact.configs["strict-type-checked"].rules,
      "@eslint-react/exhaustive-deps": "error",
      "@eslint-react/no-array-index-key": "error",
      "@eslint-react/dom-no-missing-button-type": "error",
      "@eslint-react/no-unstable-context-value": "error",
      "@eslint-react/no-unstable-default-props": "error",
      "@eslint-react/no-leaked-conditional-rendering": "error",
      "@eslint-react/jsx-no-useless-fragment": "error",
      "@eslint-react/no-unused-props": "error",
      "@eslint-react/dom-no-dangerously-set-innerhtml": "error",
      "react-refresh/only-export-components": "off"
    }
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*"],
      "import/resolver": { typescript: { alwaysTryTypes: true, project: ["./tsconfig.json"] } },
      "boundaries/elements": [
        { type: "app", pattern: "src/app" },
        { type: "pages", pattern: "src/pages" },
        { type: "feature", pattern: "src/features/*", capture: ["featureName"] },
        { type: "api", pattern: "src/api" },
        { type: "domain", pattern: "src/domain" },
        { type: "shared", pattern: "src/shared" },
        { type: "test-support", pattern: "src/test" }
      ],
      "boundaries/files": [{ category: "test", pattern: "**/*.test.{ts,tsx}" }]
    },
    rules: {
      "boundaries/no-unknown-files": "error",
      "boundaries/no-unknown-dependencies": "error",
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: { to: { element: { types: { anyOf: ["pages", "feature", "api", "domain", "shared"] } } } }
            },
            {
              from: { element: { type: "pages" } },
              allow: { to: { element: { types: { anyOf: ["feature", "shared"] } } } }
            },
            {
              from: { element: { type: "feature" } },
              allow: { to: { element: { types: { anyOf: ["api", "domain", "shared"] } } } }
            },
            {
              from: { element: { type: "api" } },
              allow: { to: { element: { types: { anyOf: ["domain", "shared"] } } } }
            },
            { from: { element: { type: "domain" } }, disallow: { to: { element: { type: "*" } } } },
            { from: { file: { categories: "test" } }, allow: { to: { element: { type: "test-support" } } } },
            {
              from: { element: { type: "test-support" } },
              allow: { to: { element: { types: { anyOf: ["api", "domain", "shared"] } } } }
            }
          ]
        }
      ]
    }
  },

  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["react", "react-dom", "react/*"], message: "domain は React に依存しません。" },
            {
              group: ["@tanstack/*", "zustand", "zustand/*", "openapi-fetch", "howler", "motion", "motion/*"],
              message: "domain は純粋な TS だけで書きます。"
            }
          ]
        }
      ],
      "no-restricted-globals": [
        "error",
        { name: "window", message: "domain はブラウザ API を使いません。" },
        { name: "document", message: "domain はブラウザ API を使いません。" },
        { name: "fetch", message: "domain は通信しません。" },
        { name: "setTimeout", message: "domain は時間を扱いません（演出のタイミングは features 側）。" },
        { name: "setInterval", message: "domain は時間を扱いません。" },
        { name: "localStorage", message: "domain は端末に保存しません。" },
        { name: "sessionStorage", message: "sessionStorage は使いません。" }
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message: "乱数は引数で受け取ったシード付き乱数（ctx.rng）を使ってください。"
        },
        { object: "Date", property: "now", message: "現在時刻は引数で受け取ってください。" }
      ],
      "no-restricted-syntax": [
        "error",
        ...BASE_RESTRICTED_SYNTAX,
        {
          selector: "NewExpression[callee.name='Date']",
          message: "domain で Date を作らないでください。時刻は引数で受け取ります。"
        },
        { selector: "ThrowStatement", message: "domain では例外を投げず、`{ ok: false, reason }` を返してください。" },
        { selector: "ClassDeclaration, ClassExpression", message: "domain では class を使いません。" }
      ]
    }
  },

  {
    files: ["src/api/mocks/**/*.ts", "src/api/**/*.mock.ts"],
    rules: {
      "functional/immutable-data": [
        "error",
        { ignoreImmediateMutation: true, ignoreClasses: false, ignoreMapsAndSets: true }
      ]
    }
  },

  {
    files: ["src/shared/storage/**/*.ts"],
    rules: {
      "no-restricted-globals": ["error", { name: "sessionStorage", message: "sessionStorage は使いません。" }],
      "no-restricted-properties": [
        "error",
        { object: "window", property: "sessionStorage", message: "sessionStorage は使いません。" },
        { object: "document", property: "cookie", message: "cookie は使いません。" }
      ]
    }
  },

  {
    files: ["src/**/*.test.{ts,tsx}", "e2e/**/*.ts"],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      "vitest/consistent-test-it": ["error", { fn: "it" }],
      "vitest/no-focused-tests": "error",
      "vitest/no-disabled-tests": "error",
      "vitest/require-top-level-describe": "error",
      "@typescript-eslint/no-magic-numbers": "off"
    }
  },

  {
    files: ["*.config.ts"],
    languageOptions: { globals: { ...globals.node } }
  },

  eslintPluginPrettierRecommended
);
