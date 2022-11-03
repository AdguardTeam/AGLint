import { CosmeticRuleParser } from "../../../src/parser/cosmetic/cosmetic";
import { EMPTY, SPACE } from "../../../src/utils/constants";

describe("CosmeticRuleParser", () => {
    test("parse", async () => {
        expect(CosmeticRuleParser.parse(EMPTY)).toBeNull();
        expect(CosmeticRuleParser.parse(SPACE)).toBeNull();

        expect(CosmeticRuleParser.parse("body")).toBeNull();
        expect(CosmeticRuleParser.parse("body > .ad")).toBeNull();
        expect(CosmeticRuleParser.parse("#")).toBeNull();
        expect(CosmeticRuleParser.parse("# test")).toBeNull();
        expect(CosmeticRuleParser.parse("! test")).toBeNull();
        expect(CosmeticRuleParser.parse("-ad-350px-")).toBeNull();
    });
});
