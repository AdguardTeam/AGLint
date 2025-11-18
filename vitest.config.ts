// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'vitest/config';

export default defineConfig({
    define: {
        __IS_TEST__: true,
    },
    test: {
        watch: false,
        coverage: {
            include: [
                'src/**/*.ts',
            ],
        },
    },
});
