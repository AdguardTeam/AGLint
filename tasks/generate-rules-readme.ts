/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-loop-func */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { toJsonSchema } from '@valibot/to-json-schema';
import fg from 'fast-glob';
import * as v from 'valibot';

import { applyFixesToResult } from '../src';
import { type LinterRule, LinterRuleSeverity } from '../src/linter/rule';
import { lint } from '../test/rules/helpers/lint';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = new URL('.', import.meta.url).pathname;

const REPO_URL = 'https://github.com/AdguardTeam/AGLint/';

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
        const fileName = path.basename(file);

        // eslint-disable-next-line no-await-in-loop
        const rule: LinterRule = (await import(file)).default;

        // eslint-disable-next-line max-len
        md += `| [${rule.meta.docs.name}](./${file.replace('.ts', '.md')}) | ${rule.meta.docs.description} | ${rule.meta.docs.recommended ? '✅' : ''} | ${rule.meta.hasFix ? '🔧' : ''} | ${rule.meta.hasSuggestions ? '💡' : ''} |\n`;

        let ruleMd = '<!-- markdownlint-disable -->\n';
        ruleMd += `# ${rule.meta.docs.name}\n\n`;

        ruleMd += '## Description\n\n';
        ruleMd += `${rule.meta.docs.description}\n\n`;

        ruleMd += '## Metadata\n\n';
        ruleMd += `- Fixable: ${rule.meta.hasFix ? '✅' : '❌'}\n`;
        ruleMd += `- Suggestions: ${rule.meta.hasSuggestions ? '✅' : '❌'}\n`;
        ruleMd += `- Recommended: ${rule.meta.docs.recommended ? '✅' : '❌'}\n`;
        ruleMd += `- Type: ${rule.meta.type}\n\n`;

        if (rule.meta.configSchema) {
            ruleMd += '## Options\n\n';
            ruleMd += '```json\n';
            ruleMd += `${JSON.stringify(toJsonSchema(rule.meta.configSchema), null, 2)}\n`;
            ruleMd += '```\n\n';

            ruleMd += '### Default options\n\n';
            ruleMd += '```json\n';
            ruleMd += `${JSON.stringify(v.getDefaults(rule.meta.configSchema), null, 2)}\n`;
            ruleMd += '```\n\n';
        }

        if (rule.meta.examples) {
            ruleMd += '## Examples\n\n';

            for (let i = 0; i < rule.meta.examples.length; i += 1) {
                const example = rule.meta.examples[i]!;

                ruleMd += `### Example ${i + 1}\n\n`;

                ruleMd += '```adblock\n';
                ruleMd += `${example}\n`;
                ruleMd += '```\n\n';

                const linterResult = await lint(example, {
                    [rule.meta.docs.name]: LinterRuleSeverity.Error,
                });

                if (linterResult.problems.length > 0) {
                    ruleMd += 'should be reported as:\n\n';

                    ruleMd += '```shell\n';
                    linterResult.problems.forEach((problem) => {
                        ruleMd += `${problem.position.start.line}:${problem.position.start.column} ${problem.message}\n`;
                    });
                    ruleMd += '```\n';

                    if (rule.meta.hasFix) {
                        ruleMd += '\nand should be fixed as:\n\n';
                        ruleMd += '```diff\n';
                        ruleMd += `- ${example}\n`;
                        applyFixesToResult({
                            linterResult,
                            sourceContent: example,
                        }).split(/\r?\n/).forEach((line) => {
                            ruleMd += `+ ${line}\n`;
                        });
                        ruleMd += '```\n';
                    }
                } else {
                    ruleMd += 'should not be reported\n\n';
                }
            }
        }

        ruleMd += '## Rule source\n\n';
        ruleMd += `${REPO_URL}src/rules/${fileName}\n\n`;

        ruleMd += '## Test cases\n\n';
        ruleMd += `${REPO_URL}test/rules/${fileName.replace('.ts', '.test.ts')}\n\n`;

        // eslint-disable-next-line no-await-in-loop
        await writeFile(path.join(__dirname, '../docs/rules', path.basename(file).replace('.ts', '.md')), ruleMd);
    }

    await writeFile(path.join(__dirname, '../docs/rules/README.md'), md);
}

main();
