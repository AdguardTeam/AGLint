import { EXT_JSON } from '../../config-file/config-file';
import { type FileSystemAdapter } from '../fs-adapter';
import { type PathAdapter } from '../path-adapter';

/**
 * Resolves preset references like "aglint:recommended" to file paths.
 */
export class PresetResolver {
    /**
     * Creates a new PresetResolver instance.
     *
     * @param fs The file system adapter to use for file operations.
     * @param pathAdapter The path adapter to use for path operations.
     * @param presetsRoot The root directory for presets.
     */
    constructor(
        private fs: FileSystemAdapter,
        private pathAdapter: PathAdapter,
        private presetsRoot: string,
    ) {}

    /**
     * Resolves a preset name to an absolute path.
     *
     * @param presetName Preset name (e.g., "recommended", "all").
     *
     * @returns Absolute path to the preset file.
     *
     * @throws If preset doesn't exist.
     */
    public async resolve(presetName: string): Promise<string> {
        const presetPath = this.pathAdapter.toPosix(
            this.pathAdapter.join(this.presetsRoot, `${presetName}${EXT_JSON}`),
        );

        if (!(await this.fs.exists(presetPath))) {
            throw new Error(`Preset "${presetName}" not found at ${presetPath}`);
        }

        return presetPath;
    }
}
