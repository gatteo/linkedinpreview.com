import nextConfig from 'eslint-config-next'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import react from 'eslint-plugin-react'
import unusedImports from 'eslint-plugin-unused-imports'

const config = [
    // Global ignores - must be first and standalone to skip directory traversal
    {
        ignores: [
            '.next/',
            '.contentlayer/',
            '.claude/',
            'node_modules/',
            'public/',
            'dev/',
            'docs/',
            'contents/',
            'supabase/',
            'references/',
        ],
    },
    ...nextConfig,
    prettierRecommended,
    {
        plugins: {
            react,
            'unused-imports': unusedImports,
        },
        rules: {
            'linebreak-style': ['error', 'unix'],
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            'react/prop-types': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/no-unescaped-entities': 'off',
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],
            '@next/next/no-html-link-for-pages': 'off',
            'jsx-a11y/click-events-have-key-events': 'off',
        },
    },
]

export default config
