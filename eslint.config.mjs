import nextConfig from 'eslint-config-next'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import react from 'eslint-plugin-react'
import tailwindcss from 'eslint-plugin-tailwindcss'
import unusedImports from 'eslint-plugin-unused-imports'

const config = [
    ...nextConfig,
    prettierRecommended,
    ...tailwindcss.configs['flat/recommended'],
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
            'react/no-array-index-key': 'error',
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
            'tailwindcss/no-custom-classname': 'off',
            'tailwindcss/classnames-order': 'error',
            '@next/next/no-html-link-for-pages': 'off',
            'jsx-a11y/click-events-have-key-events': 'off',
        },
    },
    {
        ignores: ['.next/', '.contentlayer/', 'node_modules/'],
    },
]

export default config
