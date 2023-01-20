import { join, parse, ParsedPath } from "path";
import { walk } from "../../../src/linter/cli/walk";
import { scan } from "../../../src/linter/cli/scan";
import { LinterConfig } from "../../../src/linter/config";

/**
 * Represents an event that is emitted by the walk function,
 * just for testing purposes
 */
interface StoredEvent {
    event: "dir" | "file";
    path: ParsedPath;
    config: LinterConfig;
    fix: boolean;
}

describe("walk", () => {
    test("run on bad fixture", async () => {
        const base = "test/fixtures/walk/invalid_config";

        // Invalid config option "unknown" in "test/fixtures/walk/invalid_config/aglint.config.json"
        await expect(
            walk(await scan(base), {
                dir: async () => {},
                file: async () => {},
            })
        ).rejects.toThrowError(/Expected a value of type `never`, but received: `1`/);
    });

    test("run on good fixture", async () => {
        const base = "test/fixtures/scan/valid";
        const events: StoredEvent[] = [];

        // Scan the directory and walk it, and store all events
        await walk(await scan(base), {
            dir: async (path: ParsedPath, config: LinterConfig, fix: boolean) => {
                events.push({ event: "dir", path, config, fix });
            },
            file: async (path: ParsedPath, config: LinterConfig, fix: boolean) => {
                events.push({ event: "file", path, config, fix });
            },
        });

        expect(events).toMatchObject([
            {
                event: "dir",
                path: parse(join(base)),
                config: {
                    allowInlineConfig: true,
                    rules: {
                        "rule-1": ["warn", "value-1", "value-2"],
                        "rule-2": ["error", "value-1", "value-2"],
                    },
                },
                fix: false,
            },
            {
                event: "file",
                path: parse(join(base, "root_file1.txt")),
                config: {
                    allowInlineConfig: true,
                    rules: {
                        "rule-1": ["warn", "value-1", "value-2"],
                        "rule-2": ["error", "value-1", "value-2"],
                    },
                },
                fix: false,
            },
            {
                event: "file",
                path: parse(join(base, "root_file2.txt")),
                config: {
                    allowInlineConfig: true,
                    rules: {
                        "rule-1": ["warn", "value-1", "value-2"],
                        "rule-2": ["error", "value-1", "value-2"],
                    },
                },
                fix: false,
            },
            {
                event: "dir",
                path: parse(join(base, "dir1")),
                config: {
                    allowInlineConfig: true,
                    rules: {
                        "rule-1": ["warn", "value-1", "value-2"],
                        "rule-2": ["error", "value-1", "value-2"],
                    },
                },
                fix: false,
            },
            {
                event: "file",
                path: parse(join(base, "dir1/dir1_file1.txt")),
                config: {
                    allowInlineConfig: true,
                    rules: {
                        "rule-1": ["warn", "value-1", "value-2"],
                        "rule-2": ["error", "value-1", "value-2"],
                    },
                },
                fix: false,
            },
            {
                event: "file",
                path: parse(join(base, "dir1/dir1_file2.txt")),
                config: {
                    allowInlineConfig: true,
                    rules: {
                        "rule-1": ["warn", "value-1", "value-2"],
                        "rule-2": ["error", "value-1", "value-2"],
                    },
                },
                fix: false,
            },
            {
                event: "file",
                path: parse(join(base, "dir1/dir1_file3.adblock")),
                config: {
                    allowInlineConfig: true,
                    rules: {
                        "rule-1": ["warn", "value-1", "value-2"],
                        "rule-2": ["error", "value-1", "value-2"],
                    },
                },
                fix: false,
            },
            {
                event: "dir",
                path: parse(join(base, "dir1/dir2")),
                config: {
                    allowInlineConfig: true,
                    rules: {
                        "rule-1": ["error", "value-1", "value-2"],
                    },
                },
                fix: false,
            },
            {
                event: "dir",
                path: parse(join(base, "dir3")),
                config: {
                    allowInlineConfig: true,
                    rules: {
                        "rule-1": ["warn", "value-1", "value-2"],
                        "rule-2": ["error", "value-1", "value-2"],
                    },
                },
                fix: false,
            },
            {
                event: "file",
                path: parse(join(base, "dir3/dir3_file1.txt")),
                config: {
                    allowInlineConfig: true,
                    rules: {
                        "rule-1": ["warn", "value-1", "value-2"],
                        "rule-2": ["error", "value-1", "value-2"],
                    },
                },
                fix: false,
            },
            {
                event: "file",
                path: parse(join(base, "dir3/dir3_file2.ublock")),
                config: {
                    allowInlineConfig: true,
                    rules: {
                        "rule-1": ["warn", "value-1", "value-2"],
                        "rule-2": ["error", "value-1", "value-2"],
                    },
                },
                fix: false,
            },
            {
                event: "dir",
                path: parse(join(base, "dir3/dir4")),
                config: {
                    allowInlineConfig: true,
                    rules: {
                        "rule-1": ["warn", "value-1", "value-2"],
                        "rule-2": ["error", "value-1", "value-2"],
                    },
                },
                fix: false,
            },
            {
                event: "file",
                path: parse(join(base, "dir3/dir4/random.txt")),
                config: {
                    allowInlineConfig: true,
                    rules: {
                        "rule-1": ["warn", "value-1", "value-2"],
                        "rule-2": ["error", "value-1", "value-2"],
                    },
                },
                fix: false,
            },
        ]);
    });
});
