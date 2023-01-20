/* eslint-disable max-len */
import path from "path";
import { scan } from "../../../src/linter/cli/scan";

describe("scan", () => {
    test("run on invalid fixture (double config files)", async () => {
        const base = "test/fixtures/scan/double_config";

        await expect(scan(base)).rejects.toThrowError(
            `Multiple config files found in the same directory: "${path.join(
                base,
                "dir2/aglint.config.json"
            )}" and "${path.join(base, "dir2/aglint.config.yaml")}"`
        );
    });

    test("run on valid fixture", async () => {
        const base = "test/fixtures/scan/valid";
        const result = await scan(base);

        expect(result).toMatchObject({
            configFile: {
                root: "",
                dir: path.join(base),
                base: "aglint.config.json",
                ext: ".json",
                name: "aglint.config",
            },
            lintableFiles: [
                {
                    root: "",
                    dir: path.join(base),
                    base: "root_file1.txt",
                    ext: ".txt",
                    name: "root_file1",
                },
                {
                    root: "",
                    dir: path.join(base),
                    base: "root_file2.txt",
                    ext: ".txt",
                    name: "root_file2",
                },
            ],
            subdirectories: [
                {
                    configFile: null,
                    lintableFiles: [
                        {
                            root: "",
                            dir: path.join(base, "dir1"),
                            base: "dir1_file1.txt",
                            ext: ".txt",
                            name: "dir1_file1",
                        },
                        {
                            root: "",
                            dir: path.join(base, "dir1"),
                            base: "dir1_file2.txt",
                            ext: ".txt",
                            name: "dir1_file2",
                        },
                        {
                            root: "",
                            dir: path.join(base, "dir1"),
                            base: "dir1_file3.adblock",
                            ext: ".adblock",
                            name: "dir1_file3",
                        },
                    ],
                    subdirectories: [
                        {
                            configFile: {
                                root: "",
                                dir: path.join(base, "dir1/dir2"),
                                base: "aglint.config.yml",
                                ext: ".yml",
                                name: "aglint.config",
                            },
                            lintableFiles: [],
                            subdirectories: [],
                        },
                    ],
                },
                {
                    configFile: null,
                    lintableFiles: [
                        {
                            root: "",
                            dir: path.join(base, "dir3"),
                            base: "dir3_file1.txt",
                            ext: ".txt",
                            name: "dir3_file1",
                        },
                        {
                            root: "",
                            dir: path.join(base, "dir3"),
                            base: "dir3_file2.ublock",
                            ext: ".ublock",
                            name: "dir3_file2",
                        },
                    ],
                    subdirectories: [
                        {
                            configFile: null,
                            lintableFiles: [
                                {
                                    root: "",
                                    dir: path.join(base, "dir3", "dir4"),
                                    base: "random.txt",
                                    ext: ".txt",
                                    name: "random",
                                },
                            ],
                            subdirectories: [],
                        },
                    ],
                },
            ],
        });
    });
});
