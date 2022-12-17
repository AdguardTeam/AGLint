import { LinterRule } from "../rule";
import { IfClosed } from "./if-closed";
import { SingleSelector } from "./single-selector";

export const defaultLinterRules = new Map<string, LinterRule>([
    ["if-closed", IfClosed],
    ["single-selector", SingleSelector],
]);
