import { type AnyLinterRule } from '../common';

import { DuplicatedHintPlatforms } from './duplicated-hint-platforms';
import { DuplicatedHints } from './duplicated-hints';
import { DuplicatedModifiers } from './duplicated-modifiers';
import { IfClosed } from './if-closed';
import { InconsistentHintPlatforms } from './inconsistent-hint-platforms';
import { InvalidDomainList } from './invalid-domain-list';
import { InvalidModifiers } from './invalid-modifiers';
import { NoExcludedRules } from './no-excluded-rules';
import { NoInvalidCssDeclaration } from './no-invalid-css-declaration';
import { NoInvalidCssSyntax } from './no-invalid-css-syntax';
import { NoShortRules } from './no-short-rules';
import { SingleSelector } from './single-selector';
import { UnknownHintsAndPlatforms } from './unknown-hints-and-platforms';
import { UnknownPreProcessorDirectives } from './unknown-preprocessor-directives';

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
