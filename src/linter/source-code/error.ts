import { type LinterPositionRange } from './source-code';

export class LinterSourceCodeError extends Error {
    constructor(
        message: string,
        public readonly location: LinterPositionRange,
    ) {
        super(message);
    }
}
