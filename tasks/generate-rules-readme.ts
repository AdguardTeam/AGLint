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

/**
 * Normalizes a string by replacing Windows line endings with Unix line endings and ensuring it ends with a newline.
 *
 * @param s The string to normalize.
 *
 * @returns The normalized string.
 */
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

/**
 * Processes examples for a given rule.
 *
 * @param meta The metadata of the rule.
 * @param examples The examples to process.
 *
 * @returns A promise that resolves to the processed examples as a string.
 */
const processExamples = async (meta: LinterRule['meta'], examples: LinterRuleExample[]) => {
    const md: string[] = [];

    for (const example of examples) {
        md.push(`### ${example.name}`);
        md.push('');

        md.push('The following code');
        md.push('');
        md.push('```adblock');
        md.push(example.code);
        md.push('```');
        md.push('');

        const linterResult = await lint(example.code, {
            [meta.docs.name]: example.config ? [LinterRuleSeverity.Error, ...example.config] : LinterRuleSeverity.Error,
        });

        if (meta.configSchema && meta.defaultConfig) {
            md.push('with the following rule config:');
            md.push('');
            md.push('```json');
            if (example.config && Array.isArray(example.config) && example.config.length > 0) {
                md.push(`${JSON.stringify(example.config, null, 2)}`);
            } else {
                md.push(`${JSON.stringify(meta.defaultConfig, null, 2)}`);
            }
            md.push('```');
            md.push('');
        }

        if (linterResult.problems.length > 0) {
            md.push('should be reported as:');
            md.push('');
            md.push('```shell');
            linterResult.problems.forEach((problem) => {
                md.push(`${problem.position.start.line}:${problem.position.start.column} ${problem.message}`);
            });
            md.push('```');
            md.push('');

            if (meta.hasFix && linterResult.problems.some((problem) => problem.fix)) {
                md.push('and should be fixed as:');
                md.push('');
                md.push(mdUnifiedDiff(
                    'original',
                    'fixed',
                    example.code,
                    applyFixesToResult({
                        linterResult,
                        sourceContent: example.code,
                    }),
                ));
                md.push('');
            }

            if (meta.hasSuggestions && linterResult.problems.some((problem) => problem.suggestions)) {
                md.push('and the following suggestions should be offered:');
                md.push('');

                for (const problem of linterResult.problems) {
                    for (const suggestion of problem.suggestions!) {
                        md.push(`- ${suggestion.message}`);
                        md.push('');
                        md.push(mdUnifiedDiff(
                            'original',
                            'fixed',
                            example.code,
                            new FixApplier(example.code).applyFixes([suggestion.fix]).fixedSource,
                        ).split(/\r?\n/).map((line) => `  ${line}`).join('\n'));
                        md.push('');
                    }
                }
            }
        } else {
            md.push('should not be reported');
            md.push('');
        }
    }

    return md.join('\n');
};

/**
 * Generates documentation for a given rule.
 *
 * @param file The path to the rule file.
 * @param rule The rule to generate documentation for.
 *
 * @returns A promise that resolves to the generated documentation as a string.
 */
const generateRuleDocumentation = async (file: string, rule: LinterRule) => {
    const md: string[] = [];

    md.push('<!-- markdownlint-disable -->');
    md.push(`# \`${rule.meta.docs.name}\``);
    md.push('');

    if (rule.meta.docs.recommended) {
        md.push('> ');
        md.push('> ✅ Using `aglint:recommended` preset will enable this rule');
        md.push('> ');
        md.push('');
    }

    md.push('## Description');
    md.push('');
    md.push(rule.meta.docs.description);
    md.push('');

    md.push('## Type');
    md.push('');
    switch (rule.meta.type) {
        case 'problem':
            md.push('Problem. Identifies parts that causes errors or confusing behavior. High priority fix.');
            break;
        case 'suggestion':
            md.push('Suggestion. Identifies better ways to write filters without breaking functionality.');
            break;
        case 'layout':
            md.push('Layout. Focuses on how filters look, not how they work.');
            break;
        default:
            md.push('Unknown type.');
            break;
    }
    md.push('');

    if (rule.meta.hasFix || rule.meta.hasSuggestions) {
        md.push('## Automatic issue fixing');
        md.push('');

        if (rule.meta.hasFix) {
            md.push('- Some reported problems can be fixed automatically 🔧');
        }
        if (rule.meta.hasSuggestions) {
            md.push('- Some reported problems can be fixed via suggestions 💡');
        }

        md.push('');
    }

    if (rule.meta.configSchema && rule.meta.defaultConfig) {
        md.push('## Options');
        md.push('');

        md.push('This rule can be configured using the following options.');
        md.push('');

        md.push('### Options schema');
        md.push('');

        md.push('<details>');
        md.push('<summary>Click to expand</summary>');
        md.push('');
        md.push('```json');
        md.push(`${JSON.stringify(toJsonSchema(rule.meta.configSchema), null, 2)}`);
        md.push('```');
        md.push('');
        md.push('</details>');
        md.push('');

        md.push('### Default options');
        md.push('');
        md.push('```json');
        md.push(`${JSON.stringify(rule.meta.defaultConfig, null, 2)}`);
        md.push('```');
        md.push('');
    }

    if (rule.meta.correctExamples) {
        md.push('## Correct examples');
        md.push('');
        md.push('Examples of correct code:');
        md.push('');
        md.push(await processExamples(rule.meta, rule.meta.correctExamples));
    }

    if (rule.meta.incorrectExamples) {
        md.push('## Incorrect examples');
        md.push('');
        md.push('Examples of incorrect code:');
        md.push('');
        md.push(await processExamples(rule.meta, rule.meta.incorrectExamples));
    }

    if (rule.meta.docs.whenToUseIt) {
        md.push('## When to use it');
        md.push('');
        md.push(`${rule.meta.docs.whenToUseIt}`);
        md.push('');
    }

    if (rule.meta.docs.whenNotToUseIt) {
        md.push('## When not to use it');
        md.push('');
        md.push(`${rule.meta.docs.whenNotToUseIt}`);
        md.push('');
    }

    if (rule.meta.version) {
        md.push('## Version');
        md.push('');
        md.push(`This rule was added in AGLint version ${rule.meta.version}`);
        md.push('');
    }

    md.push('## Rule source');
    md.push('');
    md.push(`${REPO_URL}src/rules/${file}`);
    md.push('');

    md.push('## Test cases');
    md.push('');
    md.push(`${REPO_URL}test/rules/${file.replace('.ts', '.test.ts')}`);
    md.push('');

    // eslint-disable-next-line no-await-in-loop
    await writeFile(path.join(__dirname, '../docs/rules', path.basename(file).replace('.ts', '.md')), md.join('\n'));
};

/**
 * Generates documentation for rules.
 */
async function main() {
    const files = await fg([path.join(__dirname, '../src/rules/*.ts')]);

    const md: string[] = [];

    md.push('<!-- markdownlint-disable -->');
    md.push('# Rules');
    md.push('');
    md.push('| Name | Description | Recommended | Fixable | Suggestions |');
    md.push('| --- | --- | :---: | :---: | :---: |');

    for (const file of files) {
        const fileName = path.basename(file);

        // eslint-disable-next-line no-await-in-loop
        const rule: LinterRule = (await import(file)).default;

        // eslint-disable-next-line max-len
        md.push(`| [${rule.meta.docs.name}](./${fileName.replace('.ts', '.md')}) | ${rule.meta.docs.description} | ${rule.meta.docs.recommended ? '✅' : ''} | ${rule.meta.hasFix ? '🔧' : ''} | ${rule.meta.hasSuggestions ? '💡' : ''} |`);

        // eslint-disable-next-line no-await-in-loop
        await generateRuleDocumentation(fileName, rule);
    }

    md.push('');

    await writeFile(path.join(__dirname, '../docs/rules/README.md'), md.join('\n'));
}

main();
