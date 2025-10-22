export class NoFilesForPattern extends Error {
    public readonly pattern: string;

    constructor(pattern: string) {
        super(`No files matched pattern: "${pattern}"`);
        this.name = 'NoFilesForPattern';
        this.pattern = pattern;
    }
}
