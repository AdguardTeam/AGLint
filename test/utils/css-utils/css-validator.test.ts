import { type Declaration, parse } from '@adguard/ecss-tree';
import { describe, expect, test } from 'vitest';

import { validateDeclaration } from '../../../src/utils/css-utils/css-validator';

describe('validateDeclaration', () => {
    describe('valid CSS declarations', () => {
        test('should return no errors for valid color property', () => {
            const declaration = parse('color: red', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should return no errors for valid display property', () => {
            const declaration = parse('display: flex', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should return no errors for valid margin property', () => {
            const declaration = parse('margin: 10px', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should return no errors for valid padding property with multiple values', () => {
            const declaration = parse('padding: 10px 20px 30px 40px', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should return no errors for valid background property', () => {
            const declaration = parse('background: #fff', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should return no errors for valid font-size property', () => {
            const declaration = parse('font-size: 16px', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should return no errors for valid width property with percentage', () => {
            const declaration = parse('width: 100%', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should return no errors for valid opacity property', () => {
            const declaration = parse('opacity: 0.5', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should return no errors for valid z-index property', () => {
            const declaration = parse('z-index: 999', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should return no errors for valid border property', () => {
            const declaration = parse('border: 1px solid black', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });
    });

    describe('custom properties', () => {
        test('should ignore custom properties (--variables)', () => {
            const declaration = parse('--custom-color: red', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should ignore custom properties with invalid values', () => {
            const declaration = parse('--my-var: anything goes here 123', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should ignore custom properties with complex values', () => {
            const declaration = parse('--theme-color: rgb(255, 0, 0)', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });
    });

    describe('invalid property names', () => {
        test('should return error for unknown property name', () => {
            const declaration = parse('unknown-property: red', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(1);
            expect(errors[0]?.message).toContain('unknown-property');
        });

        test('should return error for misspelled property name', () => {
            const declaration = parse('colour: red', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(1);
            expect(errors[0]?.message).toBeDefined();
        });
    });

    describe('invalid property values', () => {
        test('should return error for invalid color value', () => {
            const declaration = parse('color: invalid-color', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(1);
            expect(errors[0]?.message).toContain("Invalid value for 'color' property");
        });

        test('should return error for invalid display value', () => {
            const declaration = parse('display: invalid', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(1);
            expect(errors[0]?.message).toContain("Invalid value for 'display' property");
        });

        test('should return error for invalid margin value', () => {
            const declaration = parse('margin: invalid', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(1);
            expect(errors[0]?.message).toContain("Invalid value for 'margin' property");
        });

        test('should return error for invalid z-index value', () => {
            const declaration = parse('z-index: abc', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(1);
            expect(errors[0]?.message).toContain("Invalid value for 'z-index' property");
        });

        test('should return error for invalid width value', () => {
            const declaration = parse('width: invalid', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(1);
            expect(errors[0]?.message).toContain("Invalid value for 'width' property");
        });
    });

    describe('error details', () => {
        test('should include syntax information in error message when available', () => {
            const declaration = parse('color: invalid-color', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(1);
            expect(errors[0]?.message).toContain('mismatch with syntax');
        });

        test('should include start and end offsets when location is available', () => {
            const declaration = parse('color: red', { context: 'declaration' });

            // Valid declaration, but checking structure
            if (declaration.loc) {
                expect(declaration.loc.start.offset).toBeDefined();
                expect(declaration.loc.end.offset).toBeDefined();
            }
        });

        test('should handle errors with location info', () => {
            const declaration = parse('color: invalid', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(1);
            expect(errors[0]?.start).toBeDefined();
            expect(errors[0]?.end).toBeDefined();
        });
    });

    describe('complex CSS declarations', () => {
        test('should validate complex background shorthand', () => {
            const declaration = parse('background: url(image.png) no-repeat center', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should validate font shorthand', () => {
            const declaration = parse('font: bold 16px Arial, sans-serif', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should validate border shorthand', () => {
            const declaration = parse('border: 2px dashed #ccc', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should validate transform property', () => {
            const declaration = parse('transform: rotate(45deg)', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should validate animation property', () => {
            const declaration = parse('animation: slide 2s ease-in-out', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should return error for invalid transform value', () => {
            const declaration = parse('transform: invalid-function()', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(1);
            expect(errors[0]?.message).toContain("Invalid value for 'transform' property");
        });
    });

    describe('edge cases', () => {
        test('should handle declarations with important flag', () => {
            const declaration = parse('color: red !important', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should validate calc() function', () => {
            const declaration = parse('width: calc(100% - 20px)', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should validate rgb() color function', () => {
            const declaration = parse('color: rgb(255, 0, 0)', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should validate rgba() color function', () => {
            const declaration = parse('color: rgba(255, 0, 0, 0.5)', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should validate hex color values', () => {
            const declaration = parse('color: #ff0000', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should validate short hex color values', () => {
            const declaration = parse('color: #f00', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should validate var() function with custom properties', () => {
            const declaration = parse('color: var(--my-color)', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });

        test('should validate var() function with fallback', () => {
            const declaration = parse('color: var(--my-color, red)', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(0);
        });
    });

    describe('specific property value constraints', () => {
        test('should allow valid position values', () => {
            const validValues = ['static', 'relative', 'absolute', 'fixed', 'sticky'];

            for (const value of validValues) {
                const declaration = parse(`position: ${value}`, { context: 'declaration' });
                const errors = validateDeclaration(declaration as Declaration);
                expect(errors).toHaveLength(0);
            }
        });

        test('should allow valid text-align values', () => {
            const validValues = ['left', 'right', 'center', 'justify'];

            for (const value of validValues) {
                const declaration = parse(`text-align: ${value}`, { context: 'declaration' });
                const errors = validateDeclaration(declaration as Declaration);
                expect(errors).toHaveLength(0);
            }
        });

        test('should allow valid overflow values', () => {
            const validValues = ['visible', 'hidden', 'scroll', 'auto'];

            for (const value of validValues) {
                const declaration = parse(`overflow: ${value}`, { context: 'declaration' });
                const errors = validateDeclaration(declaration as Declaration);
                expect(errors).toHaveLength(0);
            }
        });

        test('should reject invalid position value', () => {
            const declaration = parse('position: invalid', { context: 'declaration' });
            const errors = validateDeclaration(declaration as Declaration);

            expect(errors).toHaveLength(1);
            expect(errors[0]?.message).toContain("Invalid value for 'position' property");
        });
    });
});
