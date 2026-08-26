import * as v from 'valibot';

/**
 * Pretty-prints a Valibot schema into a human-readable TypeScript-like format.
 * Shows basic types, descriptions, and structure without converting to JSON Schema.
 * Handles transforms gracefully without throwing errors.
 *
 * @param schema The Valibot schema to pretty-print.
 * @param indent The current indentation level.
 *
 * @returns A string representation of the schema.
 */
export function prettyPrintValibotSchema(schema: any, indent = 0): string {
    const indentStr = '  '.repeat(indent);
    const description = v.getDescription(schema);
    const descComment = description ? ` // ${description}` : '';

    // Handle various Valibot schema types
    if (!schema || typeof schema !== 'object') {
        return 'unknown';
    }

    const { type } = schema;

    switch (type) {
        case 'string':
            return `string${descComment}`;

        case 'number':
            return `number${descComment}`;

        case 'boolean':
            return `boolean${descComment}`;

        case 'bigint':
            return `bigint${descComment}`;

        case 'date':
            return `Date${descComment}`;

        case 'array': {
            const itemType = schema.item ? prettyPrintValibotSchema(schema.item, indent) : 'unknown';
            return `${itemType}[]${descComment}`;
        }

        case 'tuple': {
            if (!schema.items || schema.items.length === 0) {
                return `[]${descComment}`;
            }
            const items = schema.items.map((item: any) => (
                prettyPrintValibotSchema(item, indent + 1)
            ));
            if (items.length === 1) {
                return `[\n${indentStr}  ${items[0]}\n${indentStr}]${descComment}`;
            }
            const mapped = items.map((item: string) => `${indentStr}  ${item}`).join(',\n');
            return `[\n${mapped}\n${indentStr}]${descComment}`;
        }

        case 'object':
        case 'strict_object':
        case 'loose_object': {
            if (!schema.entries || Object.keys(schema.entries).length === 0) {
                return `{}${descComment}`;
            }

            const entries = Object.entries(schema.entries).map(([key, valueSchema]: [string, any]) => {
                const valuePretty = prettyPrintValibotSchema(valueSchema, indent + 1);
                const optional = valueSchema.type === 'optional' ? '?' : '';
                return `${indentStr}  ${key}${optional}: ${valuePretty}`;
            });

            return `{${descComment}\n${entries.join('\n')}\n${indentStr}}`;
        }

        case 'optional': {
            const wrapped = schema.wrapped ? prettyPrintValibotSchema(schema.wrapped, indent) : 'unknown';
            return `${wrapped} | undefined${descComment}`;
        }

        case 'nullable': {
            const wrapped = schema.wrapped ? prettyPrintValibotSchema(schema.wrapped, indent) : 'unknown';
            return `${wrapped} | null${descComment}`;
        }

        case 'nullish': {
            const wrapped = schema.wrapped ? prettyPrintValibotSchema(schema.wrapped, indent) : 'unknown';
            return `${wrapped} | null | undefined${descComment}`;
        }

        case 'union': {
            if (!schema.options || schema.options.length === 0) {
                return `never${descComment}`;
            }
            const options = schema.options.map((opt: any) => prettyPrintValibotSchema(opt, indent));
            return `${options.join(' | ')}${descComment}`;
        }

        case 'enum':
        case 'picklist': {
            if (!schema.options || schema.options.length === 0) {
                return `never${descComment}`;
            }
            const values = schema.options.map((opt: any) => {
                if (typeof opt === 'string') {
                    return `"${opt}"`;
                }
                return String(opt);
            });
            return `${values.join(' | ')}${descComment}`;
        }

        case 'literal': {
            const literalValue = schema.literal;
            if (typeof literalValue === 'string') {
                return `"${literalValue}"${descComment}`;
            }
            return `${String(literalValue)}${descComment}`;
        }

        case 'pipe': {
            const baseSchema = schema.wrapped || schema;
            const baseType = baseSchema !== schema
                ? prettyPrintValibotSchema(baseSchema, indent)
                : 'unknown';

            return baseType;
        }

        case 'any':
            return `any${descComment}`;

        case 'unknown':
            return `unknown${descComment}`;

        case 'never':
            return `never${descComment}`;

        case 'void':
            return `void${descComment}`;

        case 'null':
            return `null${descComment}`;

        case 'undefined':
            return `undefined${descComment}`;

        default:
            // Fallback: try to extract meaningful information
            if (schema.wrapped) {
                return prettyPrintValibotSchema(schema.wrapped, indent);
            }
            return `<${type || 'unknown'}>${descComment}`;
    }
}
