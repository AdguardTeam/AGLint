import { AdblockSyntax } from "../../utils/adblockers";
import { StringUtils } from "../../utils/string";
import { RuleCategories } from "../common";
import { CommentMarker, CommentRuleType, IComment } from "./common";

const AGENT_LIST_OPEN = "[";
const AGENT_LIST_CLOSE = "]";
const AGENT_SEPARATOR = ";";

export interface IAgentMember {
    adblock: string;
    version?: string;
}

export interface IAgent extends IComment {
    type: CommentRuleType.Agent;
    agents: IAgentMember[];
}

export class AgentParser {
    /**
     * Determines whether a rule is an adblock agent.
     *
     * @param {string} raw - Raw rule
     * @returns {boolean}
     */
    public static isAgent(raw: string): boolean {
        if (raw[0] == AGENT_LIST_OPEN) {
            const len = raw.length;
            if (raw[len - 1] == AGENT_LIST_CLOSE) {
                return true;
            }
        }

        return false;
    }

    /**
     * Parses an adblock agent.
     *
     * @param {string} raw - Raw agent, eg `Adblock Plus 2.0`
     * @returns {IAdblockAgentData}
     *
     * @example
     * ```js
     * AgentParser.parseAgent('Adblock Plus 2.0');
     * AgentParser.parseAgent('uBlock Origin 1.40.1');
     * ```
     */
    private static parseAgent(raw: string): IAgentMember {
        const trimmed = raw.trim();

        // Since this function rarely runs, it's okay to use regex here
        const splitted = trimmed.split(" ");
        const len = splitted.length;

        for (let i = 0; i < len; i++) {
            // Part contains dot or number
            if (splitted[i].indexOf(".") > -1 || /\d/.test(splitted[i])) {
                // Missing adblock name
                if (i == 0) {
                    break;
                }

                return {
                    adblock: splitted.slice(0, i).join(" "),
                    version: splitted.slice(i).join(" "),
                };
            }
        }

        return {
            adblock: trimmed,
        };
    }

    /**
     * Parses the rule that specifying adblock agents. If the rule doesn't match the adblock agent pattern,
     * it returns null. If it matches and there is an invalid agent, it throws a syntax error.
     *
     * @param {string} raw - Raw agent rule, eg `[Adblock Plus 2.0; AdGuard]`
     * @returns {IAdblockAgent[] | null}
     * @throws {SyntaxError} If there is an invalid agent.
     *
     * @example
     * ```js
     * // Single agent
     * AgentParser.parse('[Adblock Plus 2.0]')
     * // Multiple agents
     * AgentParser.parse('[Adblock Plus 2.0; AdGuard]')
     * ```
     */
    public static parse(raw: string): IAgent | null {
        // Check basic adblock agents pattern: [...], ![...], ! [...], #[...], etc.
        let openingBracketIndex = -1;
        const ruleLength = raw.length;

        if (ruleLength > 1 && raw[ruleLength - 1] == AGENT_LIST_CLOSE) {
            if (raw[0] == AGENT_LIST_OPEN) {
                openingBracketIndex = 0;
            } else if (raw[0] == CommentMarker.Regular || raw[0] == CommentMarker.Hashmark) {
                if (raw[1] == AGENT_LIST_OPEN) {
                    openingBracketIndex = 1;
                } else {
                    // Skip comment marker
                    const shift = 1;
                    const firstNonWhitespaceIndex = StringUtils.findFirstNonWhitespaceCharacter(
                        raw.slice(shift)
                    );
                    if (raw[firstNonWhitespaceIndex + shift] == AGENT_LIST_OPEN) {
                        openingBracketIndex = firstNonWhitespaceIndex + shift;
                    }
                }
            }
        }

        // Parse content between [ and ]
        if (openingBracketIndex != -1) {
            const collectedAgents: IAgentMember[] = [];
            const rawAgents = raw.slice(openingBracketIndex + 1, -1);
            const agents = rawAgents.split(AGENT_SEPARATOR);
            for (const agent of agents) {
                const trimmedAgent = agent.trim();
                const parsedAgent = AgentParser.parseAgent(trimmedAgent);

                // Filter out empty agents
                if (parsedAgent.adblock.length > 0) {
                    collectedAgents.push(parsedAgent);
                }
            }

            return {
                syntax: AdblockSyntax.Unknown,
                category: RuleCategories.Comment,
                type: CommentRuleType.Agent,
                agents: collectedAgents,
            };
        }

        return null;
    }

    /**
     * Converts AST to String.
     *
     * @param {IAgent} ast
     * @returns {string} Raw data
     */
    public static generate(ast: IAgent): string {
        let result = AGENT_LIST_OPEN;

        result += ast.agents
            .map(({ adblock, version }) => {
                let subresult = adblock;

                if (version) {
                    subresult += " " + version;
                }

                return subresult;
            })
            .join(AGENT_SEPARATOR + " ");

        result += AGENT_LIST_CLOSE;

        return result;
    }
}
