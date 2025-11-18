module.exports = {
    extends: '../../.eslintrc.cjs',
    env: {
        es2022: true,
        node: false,
        browser: false,
    },
    rules: {
        'import/no-nodejs-modules': 'error',
        'no-restricted-imports': ['error', { patterns: ['node:*'] }],
        'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'process', '__dirname', '__filename'],
        '@typescript-eslint/no-var-requires': 'error',
        'import/no-extraneous-dependencies': ['error', {
            devDependencies: false,
            optionalDependencies: false,
            peerDependencies: true,
        }],
    },
};
