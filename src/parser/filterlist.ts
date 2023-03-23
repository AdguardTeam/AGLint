import { AnyRule, FilterList, defaultLocation } from './nodes';
import { RuleParser } from './rule';
import { LF } from '../utils/constants';
import { StringUtils } from '../utils/string';

/**
 * `FilterListParser` is responsible for parsing a whole adblock filter list (list of rules).
 * It is a wrapper around `RuleParser` which parses each line separately.
 */
export class FilterListParser {
    /**
     * Parses a whole adblock filter list (list of rules).
     *
     * @param raw Filter list source code
     * @returns AST of the source code
     */
    public static parse(raw: string): FilterList {
        let offset = 0;
        const rules: AnyRule[] = [];

        const splitted = StringUtils.splitStringByNewLinesEx(raw);

        for (let i = 0; i < splitted.length; i += 1) {
            const line = splitted[i];

            const ruleAst = RuleParser.parse(splitted[i][0], {
                offset,
                line: i + 1,
                column: 1,
            });

            rules.push(ruleAst);

            offset += line[0].length;

            if (line[1]) {
                if (line[1] === 'crlf') {
                    offset += 2;
                } else {
                    offset += 1;
                }
            }
        }

        return {
            type: 'FilterList',
            loc: {
                // Start location is always the same
                start: defaultLocation,

                // Calculate end location
                end: {
                    offset: raw.length,
                    line: splitted.length,
                    column: splitted[splitted.length - 1][0].length,
                },
            },
            rules,
        };
    }

    /**
     * Serializes a whole adblock filter list (list of rules).
     *
     * @param ast AST to generate
     * @returns Serialized filter list
     */
    public static generate(ast: FilterList): string {
        // Simply generate each rule and join them with a line feed character
        return ast.rules.map((rule) => RuleParser.generate(rule)).join(LF);
    }
}
