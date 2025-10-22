import { type AnyLinterResult } from '../../linter/fixer';

export const hasLinterResultErrors = (result: AnyLinterResult) => {
    return result.errorCount > 0 || result.fatalErrorCount > 0;
};
