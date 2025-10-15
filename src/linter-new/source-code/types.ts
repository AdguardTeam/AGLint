import { type LinterSourceCodeError } from './error';

export type OnParseError = (error: LinterSourceCodeError) => void;
