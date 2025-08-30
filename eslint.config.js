import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import vueParser from "vue-eslint-parser";

export default [
  // 基础JavaScript推荐配置
  js.configs.recommended,

  // Vue 3 推荐配置
  ...pluginVue.configs["flat/recommended"],

  // 全局配置
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Node.js globals
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",

        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        HTMLElement: "readonly",
        Event: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",

        // Testing globals
        describe: "readonly",
        test: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",

        // MongoDB shell globals
        db: "readonly",
        print: "readonly",

        // Vite globals
        import: "readonly",
      },
    },
    rules: {
      // JavaScript 规则
      "no-unused-vars": "warn",
      "no-console": "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-prototype-builtins": "warn",

      // Vue 特定规则
      "vue/multi-word-component-names": "off",
      "vue/no-unused-vars": "warn",
      "vue/no-unused-components": "warn",
      "vue/require-default-prop": "off",
      "vue/require-explicit-emits": "warn",
      "vue/no-v-html": "off",
      "vue/component-name-in-template-casing": ["error", "kebab-case"],
      "vue/prop-name-casing": ["error", "camelCase"],
      "vue/custom-event-name-casing": ["error", "camelCase"],
      "vue/no-multiple-template-root": "off", // Vue 3 支持多个根元素
      "vue/no-v-for-template-key": "off", // Vue 3 规则
      "vue/no-v-model-argument": "off", // Vue 3 支持
      "vue/max-attributes-per-line": "off", // 允许一行多个属性
      "vue/singleline-html-element-content-newline": "off", // 允许单行元素内容
      "vue/attributes-order": "off", // 放宽属性顺序要求
      "vue/html-self-closing": [
        "error",
        {
          html: {
            void: "always", // 允许void元素(如img)使用自闭合格式
            normal: "always",
            component: "always",
          },
          svg: "always",
          math: "always",
        },
      ], // 配置自闭合标签规则
    },
  },

  // Vue 文件特定配置
  {
    files: ["*.vue", "**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsparser,
        ecmaVersion: 2022,
        sourceType: "module",
        extraFileExtensions: [".vue"],
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // Vue 组件特定规则
      "vue/component-definition-name-casing": ["error", "PascalCase"],
      "vue/no-unused-refs": "warn",
      "vue/no-mutating-props": "error",

      // TypeScript 规则 (针对 Vue 文件)
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // 禁用可能冲突的规则
      "no-unused-vars": "off", // 使用 @typescript-eslint/no-unused-vars 代替
      "no-undef": "off", // TypeScript 会处理未定义的变量
    },
  },

  // TypeScript 文件配置
  {
    files: ["*.ts", "**/*.ts", "*.tsx", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // TypeScript 规则
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // 禁用可能冲突的规则
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },

  // 测试文件配置
  {
    files: [
      "**/*.test.{js,ts,vue}",
      "**/*.spec.{js,ts,vue}",
      "**/__tests__/**",
    ],
    rules: {
      "no-unused-expressions": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },

  // 忽略文件和目录
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".nuxt/**",
      ".output/**",
      ".vscode/**",
      ".idea/**",
      "*.min.js",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "server/uploads/**",
      "public/**",
      "server-dist/**",
      ".env*",
      "auto-imports.d.ts",
      "components.d.ts",
    ],
  },
];
