import { AdblockSyntax } from "../../utils/adblockers";
import { SPACE } from "../../utils/constants";
import { StringUtils } from "../../utils/string";
import { RuleCategories } from "../common";
import { CommentMarker, CommentRuleType, IComment } from "./common";

const AGENT_LIST_OPEN = "[";
const AGENT_LIST_CLOSE = "]";
const AGENT_SEPARATOR = ";";

/**
 * Represents an agent (eg `Adblock Plus 2.0`, where adblock is `Adblock Plus` and version is `2.0`).
 * Specifying the version is optional.
 */
export interface IAgentMember {
    adblock: string;
    version?: string;
}

/**
 * Represents an agent comment.
 *
 * There can be several agents in a rule. For example, if the rule is `[Adblock Plus 2.0; AdGuard]`,
 * then there are two agent members: `Adblock Plus 2.0` and `AdGuard` (without version).
 */
export interface IAgent extends IComment {
    type: CommentRuleType.Agent;
    agents: IAgentMember[];
}

/**
 * AgentParser is responsible for parsing an Adblock agent comment.
 * Adblock agent comment marks that the filter list is supposed to be used by the specified
 * ad blockers.
 *
 * Examples:
 *  - ```adblock
 *    [AdGuard]
 *    ```
 *  - ```adblock
 *    [Adblock Plus 2.0]
 *    ```
 *  - ```adblock
 *    [uBlock Origin]
 *    ```
 */
export class AgentParser {
    /**
     * Determines whether a rule is an adblock agent.
     *
     * @param {string} raw - Raw rule
     * @returns {boolean} true/false
     */
    public static isAgent(raw: string): boolean {
        const trimmed = raw.trim();

        if (trimmed[0] == AGENT_LIST_OPEN) {
            if (trimmed[trimmed.length - 1] == AGENT_LIST_CLOSE) {
                return true;
            }
        }

        return false;
    }

    /**
     * Parses an adblock agent member.
     *
     * @param {string} raw - Raw agent member, eg `Adblock Plus 2.0`
     * @returns {IAgentMember} - Agent member AST
     * @example
     * ```js
     * AgentParser.parseAgent('Adblock Plus 2.0');
     * AgentParser.parseAgent('uBlock Origin 1.40.1');
     * ```
     */
    private static parseAgent(raw: string): IAgentMember {
        const trimmed = raw.trim();
        const splitted = trimmed.split(SPACE);

        for (let i = 0; i < splitted.length; i++) {
            // Part contains dot or number
            // Since this function rarely runs, it's okay to use regex here
            if (splitted[i].indexOf(".") > -1 || /\d/.test(splitted[i])) {
                // Missing adblock name
                if (i == 0) {
                    break;
                }

                return {
                    adblock: splitted.slice(0, i).join(SPACE),
                    version: splitted.slice(i).join(SPACE),
                };
            }
        }

        return {
            adblock: trimmed,
        };
    }

    /**
     * Parses a raw rule as an adblock agent comment.
     *
     * @param {string} raw - Raw rule
     * @returns {IAgent | null} Adblock agent AST or null (if the raw rule cannot be parsed as an adblock agent comment)
     */
    public static parse(raw: string): IAgent | null {
        const trimmed = raw.trim();

        // Check basic adblock agents pattern: [...], ![...], ! [...], #[...], etc.
        let openingBracketIndex = -1;
        const ruleLength = trimmed.length;

        if (ruleLength > 1 && trimmed[ruleLength - 1] == AGENT_LIST_CLOSE) {
            if (trimmed[0] == AGENT_LIST_OPEN) {
                openingBracketIndex = 0;
            } else if (trimmed[0] == CommentMarker.Regular || trimmed[0] == CommentMarker.Hashmark) {
                if (trimmed[1] == AGENT_LIST_OPEN) {
                    openingBracketIndex = 1;
                } else {
                    // Skip comment marker
                    const shift = 1;
                    const firstNonWhitespaceIndex = StringUtils.findFirstNonWhitespaceCharacter(trimmed.slice(shift));
                    if (trimmed[firstNonWhitespaceIndex + shift] == AGENT_LIST_OPEN) {
                        openingBracketIndex = firstNonWhitespaceIndex + shift;
                    }
                }
            }
        }

        // Parse content between brackets
        if (openingBracketIndex != -1) {
            const collectedAgents: IAgentMember[] = [];
            const rawAgents = trimmed.slice(openingBracketIndex + 1, -1);
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
                category: RuleCategories.Comment,
                type: CommentRuleType.Agent,
                syntax: AdblockSyntax.Unknown,
                agents: collectedAgents,
            };
        }

        return null;
    }

    /**
     * Converts an adblock agent AST to a string.
     *
     * @param {IAgent} ast - Agent AST
     * @returns {string} Raw string
     */
    public static generate(ast: IAgent): string {
        let result = AGENT_LIST_OPEN;

        result += ast.agents
            .map(({ adblock, version }) => {
                let subresult = adblock;

                if (version) {
                    subresult += SPACE;
                    subresult += version;
                }

                return subresult;
            })
            .join(AGENT_SEPARATOR + SPACE);

        result += AGENT_LIST_CLOSE;

        return result;
    }
}
