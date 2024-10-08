import { type AnyLinterRule } from '../common';
import { DuplicatedHintPlatforms } from './duplicated-hint-platforms';
import { DuplicatedHints } from './duplicated-hints';
import { UnknownHintsAndPlatforms } from './unknown-hints-and-platforms';
import { DuplicatedModifiers } from './duplicated-modifiers';
import { IfClosed } from './if-closed';
import { InvalidDomainList } from './invalid-domain-list';
import { InvalidModifiers } from './invalid-modifiers';
import { InconsistentHintPlatforms } from './inconsistent-hint-platforms';
import { SingleSelector } from './single-selector';
import { UnknownPreProcessorDirectives } from './unknown-preprocessor-directives';
import { NoShortRules } from './no-short-rules';
import { NoExcludedRules } from './no-excluded-rules';
import { NoInvalidCssSyntax } from './no-invalid-css-syntax';
import { NoInvalidCssDeclaration } from './no-invalid-css-declaration';

export const defaultLinterRules = new Map<string, AnyLinterRule>([
    ['no-invalid-css-syntax', NoInvalidCssSyntax],
    ['no-invalid-css-declaration', NoInvalidCssDeclaration],
    ['if-closed', IfClosed],
    ['single-selector', SingleSelector],
    ['duplicated-modifiers', DuplicatedModifiers],
    ['unknown-preprocessor-directives', UnknownPreProcessorDirectives],
    ['duplicated-hint-platforms', DuplicatedHintPlatforms],
    ['duplicated-hints', DuplicatedHints],
    ['unknown-hints-and-platforms', UnknownHintsAndPlatforms],
    ['invalid-domain-list', InvalidDomainList],
    ['invalid-modifiers', InvalidModifiers],
    ['inconsistent-hint-platforms', InconsistentHintPlatforms],
    ['no-short-rules', NoShortRules],
    ['no-excluded-rules', NoExcludedRules],
]);
