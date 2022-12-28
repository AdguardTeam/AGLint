/* eslint-disable max-len */
import path from "path";
import { scan } from "../../../src/linter/cli/scan";

describe("scan", () => {
    test("run on fixture", async () => {
        const result = await scan("test/fixtures/scan");

        // Use path.join to make sure the paths are correct on any OS
        expect(result).toMatchObject({
            configFiles: [
                path.join("test/fixtures/scan", "aglint.config.json"),
                path.join("test/fixtures/scan", "dir1/dir2/aglint.config.yml"),
            ],
            lintableFiles: [
                path.join("test/fixtures/scan", "dir1/dir1_file1.txt"),
                path.join("test/fixtures/scan", "dir1/dir1_file2.txt"),
                path.join("test/fixtures/scan", "dir1/dir1_file3.adblock"),

                path.join("test/fixtures/scan", "dir3/dir3_file1.txt"),
                path.join("test/fixtures/scan", "dir3/dir3_file2.ublock"),
                path.join("test/fixtures/scan", "dir3/dir4/random.txt"),

                path.join("test/fixtures/scan", "root_file1.txt"),
                path.join("test/fixtures/scan", "root_file2.txt"),
            ],
        });
    });
});
