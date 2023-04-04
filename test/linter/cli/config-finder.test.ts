import path from 'path';
import { findRootConfig } from '../../../src/linter/cli/config-finder';

describe('scan', () => {
    test('should run on valid fixture', async () => {
        const base = 'test/fixtures/config-finder/valid/subdir1/subdir2/subdir3';
        const result = await findRootConfig(base);

        expect(result).not.toBeNull();

        // Get Jest environment root directory
        const rootDir = path.resolve(__dirname, '../../');

        // Get relative path from the result to the test fixture. It is safe
        // to use non-null assertion here, because we already checked that
        // the result is not null.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const relativePath = path.relative(rootDir, result!);

        expect(relativePath).toBe(
            path.join('fixtures/config-finder/valid/subdir1/subdir2/.aglintrc.yml'),
        );
    });

    test('should run on invalid fixture', async () => {
        const base = 'test/fixtures/config-finder/invalid/subdir';

        await expect(findRootConfig(base)).rejects.toThrowError(/^Multiple config files found/);
    });

    test('should return null if no config file was found', async () => {
        const base = 'test/fixtures/config-finder/nothing';

        const result = await findRootConfig(base);

        expect(result).toBeNull();
    });
});
