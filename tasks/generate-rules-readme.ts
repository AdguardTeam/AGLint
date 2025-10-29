/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-loop-func */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { toJsonSchema } from '@valibot/to-json-schema';
import { createTwoFilesPatch } from 'diff';
import fg from 'fast-glob';

import { applyFixesToResult } from '../src';
import { type LinterRule, type LinterRuleExample, LinterRuleSeverity } from '../src/linter/rule';
import { FixApplier } from '../src/linter/source-code/fix-applier';
import { lint } from '../test/rules/helpers/lint';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = new URL('.', import.meta.url).pathname;

const REPO_URL = 'https://github.com/AdguardTeam/AGLint/';

const norm = (s: string) => (s.replace(/\r\n/g, '\n').endsWith('\n') ? s : `${s}\n`);

/**
 * Creates a unified diff between two strings.
 *
 * @param oldPath The path to the old file.
 * @param newPath The path to the new file.
 * @param oldText The content of the old file.
 * @param newText The content of the new file.
 *
 * @returns The unified diff between the two strings.
 */
export function mdUnifiedDiff(
    oldPath: string,
    newPath: string,
    oldText: string,
    newText: string,
): string {
    const patch = createTwoFilesPatch(
        oldPath,
        newPath,
        norm(oldText),
        norm(newText),
    );
    return `\`\`\`diff
${patch.slice(0, -1)}
\`\`\``;
}

const processExamples = async (meta: LinterRule['meta'], examples: LinterRuleExample[]) => {
    let ruleMd = '';

    for (const example of examples) {
        ruleMd += `### ${example.name}\n\n`;

        ruleMd += '```adblock\n';
        ruleMd += `${example.code}\n`;
        ruleMd += '```\n\n';

        const linterResult = await lint(example.code, {
            [meta.docs.name]: example.config ?? LinterRuleSeverity.Error,
        });

        if (meta.configSchema && meta.defaultConfig) {
            ruleMd += 'with config:\n\n';
            ruleMd += '```json\n';
            if (example.config && Array.isArray(example.config) && example.config.length > 1) {
                ruleMd += `${JSON.stringify(example.config.slice(1), null, 2)}\n`;
            } else {
                ruleMd += `${JSON.stringify(meta.defaultConfig, null, 2)}\n`;
            }
            ruleMd += '```\n\n';
        }

        if (linterResult.problems.length > 0) {
            ruleMd += 'should be reported as:\n\n';

            ruleMd += '```shell\n';
            linterResult.problems.forEach((problem) => {
                ruleMd += `${problem.position.start.line}:${problem.position.start.column} ${problem.message}\n`;
            });
            ruleMd += '```\n\n';

            if (meta.hasFix && linterResult.problems.some((problem) => problem.fix)) {
                ruleMd += '\nand should be fixed as:\n\n';
                ruleMd += mdUnifiedDiff(
                    'original',
                    'fixed',
                    example.code,
                    applyFixesToResult({
                        linterResult,
                        sourceContent: example.code,
                    }),
                );
                ruleMd += '\n\n';
            }

            if (meta.hasSuggestions && linterResult.problems.some((problem) => problem.suggestions)) {
                ruleMd += '\nand should offer the following suggestions:\n\n';

                for (const problem of linterResult.problems) {
                    for (const suggestion of problem.suggestions!) {
                        ruleMd += `- ${suggestion.message}\n`;
                        ruleMd += '\n';
                        ruleMd += mdUnifiedDiff(
                            'original',
                            'fixed',
                            example.code,
                            new FixApplier(example.code).applyFixes([suggestion.fix]).fixedSource,
                        ).split(/\r?\n/).map((line) => `  ${line}`).join('\n');
                        ruleMd += '\n\n';
                    }
                }
            }
        } else {
            ruleMd += 'should not be reported\n\n';
        }
    }

    return ruleMd;
};

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
        md += `| [${rule.meta.docs.name}](./${fileName.replace('.ts', '.md')}) | ${rule.meta.docs.description} | ${rule.meta.docs.recommended ? '✅' : ''} | ${rule.meta.hasFix ? '🔧' : ''} | ${rule.meta.hasSuggestions ? '💡' : ''} |\n`;

        let ruleMd = '<!-- markdownlint-disable -->\n';
        ruleMd += `# \`${rule.meta.docs.name}\`\n\n`;

        if (rule.meta.docs.recommended) {
            ruleMd += '> \n';
            ruleMd += '> ✅ Using `aglint:recommended` preset will enable this rule\n';
            ruleMd += '> \n';
        }

        ruleMd += '\n';

        ruleMd += '## Description\n\n';
        ruleMd += `${rule.meta.docs.description}\n\n`;

        ruleMd += '## Features\n\n';

        if (rule.meta.hasFix) {
            ruleMd += '- Some reported problems can be fixed automatically 🔧\n';
        }
        if (rule.meta.hasSuggestions) {
            ruleMd += '- Some reported problems can be fixed via suggestions 💡\n';
        }

        ruleMd += '\n';

        if (rule.meta.configSchema && rule.meta.defaultConfig) {
            ruleMd += '## Options\n\n';

            ruleMd += 'This rule can be configured using the following options:\n\n';

            ruleMd += '### Options schema\n\n';

            ruleMd += '<details>\n<summary>Click to expand</summary>\n\n';

            ruleMd += '```json\n';
            ruleMd += `${JSON.stringify(toJsonSchema(rule.meta.configSchema), null, 2)}\n`;
            ruleMd += '```\n\n';

            ruleMd += '</details>\n\n';

            ruleMd += '### Default options\n\n';
            ruleMd += '```json\n';
            ruleMd += `${JSON.stringify(rule.meta.defaultConfig, null, 2)}\n`;
            ruleMd += '```\n\n';
        }

        if (rule.meta.correctExamples) {
            ruleMd += '## Correct examples\n\n';
            ruleMd += 'Examples of correct code:\n\n';
            ruleMd += await processExamples(rule.meta, rule.meta.correctExamples);
        }

        if (rule.meta.incorrectExamples) {
            ruleMd += '## Incorrect examples\n\n';
            ruleMd += 'Examples of incorrect code:\n\n';
            ruleMd += await processExamples(rule.meta, rule.meta.incorrectExamples);
        }

        if (rule.meta.docs.whenToUseIt) {
            ruleMd += '## When to use it\n\n';
            ruleMd += `${rule.meta.docs.whenToUseIt}\n\n`;
        }

        if (rule.meta.docs.whenNotToUseIt) {
            ruleMd += '## When not to use it\n\n';
            ruleMd += `${rule.meta.docs.whenNotToUseIt}\n\n`;
        }

        if (rule.meta.version) {
            ruleMd += '## Version\n\n';
            ruleMd += `This rule was added in AGLint version ${rule.meta.version}\n\n`;
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
