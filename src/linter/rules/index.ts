import { LinterRule } from "../rule";
import { AdgScriptletQuotes } from "./adg-scriptlet-quotes";
import { UnknownHintsAndPlatforms } from "./unknown-hints-and-platforms";
import { DuplicatedModifiers } from "./duplicated-modifiers";
import { IfClosed } from "./if-closed";
import { InvalidDomainList } from "./invalid-domain-list";
import { InconsistentHintPlatforms } from "./inconsistent-hint-platforms";
import { SingleSelector } from "./single-selector";
import { UnknownPreProcessorDirectives } from "./unknown-preprocessor-directives";

export const defaultLinterRules = new Map<string, LinterRule>([
    ["adg-scriptlet-quotes", AdgScriptletQuotes],
    ["if-closed", IfClosed],
    ["single-selector", SingleSelector],
    ["duplicated-modifiers", DuplicatedModifiers],
    ["unknown-preprocessor-directives", UnknownPreProcessorDirectives],
    ["unknown-hints-and-platforms", UnknownHintsAndPlatforms],
    ["invalid-domain-list", InvalidDomainList],
    ["inconsistent-hint-platforms", InconsistentHintPlatforms],
]);
