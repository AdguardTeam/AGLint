import { LinterRule } from "../rule";
import { AdgScriptletQuotes } from "./adg-scriptlet-quotes";
import { DuplicatedModifiers } from "./duplicated-modifiers";
import { IfClosed } from "./if-closed";
import { SingleSelector } from "./single-selector";

export const defaultLinterRules = new Map<string, LinterRule>([
    ["adg-scriptlet-quotes", AdgScriptletQuotes],
    ["if-closed", IfClosed],
    ["single-selector", SingleSelector],
    ["duplicated-modifiers", DuplicatedModifiers],
]);
