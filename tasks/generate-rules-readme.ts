import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import fg from 'fast-glob';

import { type LinterRule } from '../src/linter/rule';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = new URL('.', import.meta.url).pathname;

/**
 * Generates the rules README.md file.
 */
async function main() {
    const files = await fg([path.join(__dirname, '../src/rules/*.ts')]);

    let md = '# Rules\n\n';

    md += '<!-- markdownlint-disable -->\n';
    md += '| Name | Description | Recommended | Fixable | Suggestions |\n';
    md += '| --- | --- | :---: | :---: | :---: |\n';

    for (const file of files) {
        // eslint-disable-next-line no-await-in-loop
        const rule: LinterRule = (await import(file)).default;

        // eslint-disable-next-line max-len
        md += `| [${rule.meta.docs.name}](./${file.replace('.ts', '.md')}) | ${rule.meta.docs.description} | ${rule.meta.docs.recommended ? '✅' : ''} | ${rule.meta.hasFix ? '🔧' : ''} | ${rule.meta.hasSuggestions ? '💡' : ''} |\n`;
    }

    await writeFile(path.join(__dirname, '../docs/rules/README.md'), md);
}

main();
