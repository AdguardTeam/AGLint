import { StringUtils } from "../utils/string";
import { AnyRule, RuleParser } from "./rule";

export enum FilterListEntryType {
    ValidEntry,
    InvalidEntry,
}

export type FilterListEntries = (InvalidFilterListEntry | ValidFilterListEntry)[];

interface FilterListEntry {
    type: FilterListEntryType;
    raw: string;
    line: number;
}

export interface InvalidFilterListEntry extends FilterListEntry {
    type: FilterListEntryType.InvalidEntry;
    error: Error;
}

export interface ValidFilterListEntry extends FilterListEntry {
    type: FilterListEntryType.ValidEntry;
    ast: AnyRule;
}

export class FilterListParser {
    public static parse(raw: string): FilterListEntries {
        const rawLines = StringUtils.splitStringByNewLines(raw);
        const entries: FilterListEntries = [];

        for (let i = 0; i < rawLines.length; i++) {
            try {
                const ast = RuleParser.parse(rawLines[i]);

                entries.push({
                    type: FilterListEntryType.ValidEntry,
                    raw: rawLines[i],
                    line: i + 1,
                    ast,
                });
            } catch (error) {
                if (error instanceof Error) {
                    entries.push({
                        type: FilterListEntryType.InvalidEntry,
                        raw: rawLines[i],
                        line: i + 1,
                        error,
                    });
                }
            }
        }

        return entries;
    }
}
