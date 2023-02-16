import { LinterRule } from "../rule";
import { AdgScriptletQuotes } from "./adg-scriptlet-quotes";
import { IfClosed } from "./if-closed";
import { InvalidModifierName } from "./invalid-modifier-name";
import { SingleSelector } from "./single-selector";
import { UnknownPreProcessorDirectives } from "./unknown-preprocessor-directives";

export const defaultLinterRules = new Map<string, LinterRule>([
    ["adg-scriptlet-quotes", AdgScriptletQuotes],
    ["if-closed", IfClosed],
    ["single-selector", SingleSelector],
    ["unknown-preprocessor-directives", UnknownPreProcessorDirectives],
    ["invalid-modifier-name", InvalidModifierName],
]);
