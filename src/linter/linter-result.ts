import { type AnyLinterResult } from './fixer';

export const hasLinterResultErrors = (result: AnyLinterResult) => {
    return result.errorCount > 0 || result.fatalErrorCount > 0;
};
