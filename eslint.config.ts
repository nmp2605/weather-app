import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginOxlint from 'eslint-plugin-oxlint'
import sonarjs from 'eslint-plugin-sonarjs'
import skipFormatting from 'eslint-config-prettier/flat'
import type { Linter } from 'eslint'

// The plugin types its presets loosely (flat | legacy); `recommended` is a flat config.
const sonarRecommended = sonarjs.configs?.recommended as Linter.Config

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/coverage/**', 'prototype/**']),

  ...pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommendedTypeChecked,

  sonarRecommended,

  {
    name: 'app/rules',
    rules: {
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/define-emits-declaration': ['error', 'type-literal'],
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/no-unused-refs': 'error',
      'vue/no-useless-v-bind': 'error',
      'vue/require-typed-ref': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/**'],
  },

  {
    name: 'app/tests',
    files: ['src/**/__tests__/**'],
    rules: {
      // Test fixtures use fake coordinates and timestamps on purpose.
      'sonarjs/no-hardcoded-ip': 'off',
      'sonarjs/no-duplicate-string': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
)
