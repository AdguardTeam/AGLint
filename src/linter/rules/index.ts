import { LinterRule } from "../rule";
import { AdgScriptletQuotes } from "./adg-scriptlet-quotes";
import { DuplicatedHintPlatforms } from "./duplicated-hint-platforms";
import { DuplicatedModifiers } from "./duplicated-modifiers";
import { IfClosed } from "./if-closed";
import { SingleSelector } from "./single-selector";
import { UnknownPreProcessorDirectives } from "./unknown-preprocessor-directives";

export const defaultLinterRules = new Map<string, LinterRule>([
    ["adg-scriptlet-quotes", AdgScriptletQuotes],
    ["if-closed", IfClosed],
    ["single-selector", SingleSelector],
    ["duplicated-modifiers", DuplicatedModifiers],
    ["unknown-preprocessor-directives", UnknownPreProcessorDirectives],
    ["duplicated-hint-platforms", DuplicatedHintPlatforms],
]);
