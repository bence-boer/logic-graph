/**
 * Tests for command validation utilities.
 */

import { describe, it, expect } from 'vitest';
import {
    valid,
    invalid,
    invalid_fields,
    required,
    max_length,
    min_length,
    combine
} from './validator';

describe('Validator utilities', () => {
    describe('valid', () => {
        it('should return valid result', () => {
            const result = valid();
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });
    });

    describe('invalid', () => {
        it('should return invalid result with error', () => {
            const result = invalid('Something went wrong');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Something went wrong');
        });
    });

    describe('invalid_fields', () => {
        it('should return invalid result with field errors', () => {
            const result = invalid_fields({
                field1: 'Error 1',
                field2: 'Error 2'
            });
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Validation failed');
            expect(result.field_errors).toEqual({
                field1: 'Error 1',
                field2: 'Error 2'
            });
        });
    });

    describe('required', () => {
        it('should pass for non-empty value', () => {
            const result = required('test', 'field');
            expect(result.valid).toBe(true);
        });

        it('should fail for empty string', () => {
            const result = required('', 'field');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('required');
        });

        it('should fail for null', () => {
            const result = required(null, 'field');
            expect(result.valid).toBe(false);
        });

        it('should fail for undefined', () => {
            const result = required(undefined, 'field');
            expect(result.valid).toBe(false);
        });

        it('should include field name in error', () => {
            const result = required(null, 'username');
            expect(result.error).toContain('username');
        });
    });

    describe('max_length', () => {
        it('should pass for string within limit', () => {
            const result = max_length('test', 10, 'field');
            expect(result.valid).toBe(true);
        });

        it('should pass for string at exact limit', () => {
            const result = max_length('test', 4, 'field');
            expect(result.valid).toBe(true);
        });

        it('should fail for string exceeding limit', () => {
            const result = max_length('test', 3, 'field');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('3 characters');
        });

        it('should include field name in error', () => {
            const result = max_length('toolong', 5, 'username');
            expect(result.error).toContain('username');
        });
    });

    describe('min_length', () => {
        it('should pass for string meeting minimum', () => {
            const result = min_length('test', 3, 'field');
            expect(result.valid).toBe(true);
        });

        it('should pass for string at exact minimum', () => {
            const result = min_length('test', 4, 'field');
            expect(result.valid).toBe(true);
        });

        it('should fail for string below minimum', () => {
            const result = min_length('hi', 3, 'field');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('at least 3');
        });

        it('should include field name in error', () => {
            const result = min_length('a', 3, 'username');
            expect(result.error).toContain('username');
        });
    });

    describe('combine', () => {
        it('should return valid if all results are valid', () => {
            const result = combine([valid(), valid(), valid()]);
            expect(result.valid).toBe(true);
        });

        it('should return first invalid result', () => {
            const result = combine([valid(), invalid('Error 1'), invalid('Error 2')]);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Error 1');
        });

        it('should handle empty array', () => {
            const result = combine([]);
            expect(result.valid).toBe(true);
        });

        it('should work with real validators', () => {
            const value = '';
            const result = combine([required(value, 'field'), max_length(value, 10, 'field')]);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('required');
        });
    });
});
