/* eslint-disable max-len */
import path from "path";
import { parseConfigFile } from "../../../src/linter/cli/config-reader";

describe("parseConfigFile", () => {
    test("run on invalid fixtures", async () => {
        const base = "test/fixtures/config/invalid";

        await expect(parseConfigFile(path.join(base, ".aglintrc"))).rejects.toThrowError();
        await expect(parseConfigFile(path.join(base, "aglint.config.json"))).rejects.toThrowError();
        await expect(parseConfigFile(path.join(base, "aglint.config.yaml"))).rejects.toThrowError();
        await expect(parseConfigFile(path.join(base, "aglint.config.yml"))).rejects.toThrowError();

        await expect(parseConfigFile(path.join(base, "aglint.config.txt"))).rejects.toThrowError(
            "Unsupported config file extension: .txt"
        );
    });

    test("run on valid fixtures", async () => {
        const base = "test/fixtures/config/valid";

        const expected = {
            allowInlineConfig: true,
            rules: {
                "rule-1": ["warn", "value-1", "value-2"],
                "rule-2": ["error", "value-1", "value-2"],
                "rule-3": "off",
                "rule-4": 2,
            },
        };

        expect(await parseConfigFile(path.join(base, ".aglintrc"))).toMatchObject(expected);
        expect(await parseConfigFile(path.join(base, "aglint.config.json"))).toMatchObject(expected);
        expect(await parseConfigFile(path.join(base, "aglint.config.yaml"))).toMatchObject(expected);
        expect(await parseConfigFile(path.join(base, "aglint.config.yml"))).toMatchObject(expected);
    });
});
