/**
 * Tests for form validation utilities.
 */

import { describe, it, expect } from 'vitest';
import { validate_field, validators } from './validation';
import { ValidationRuleType } from './types';
import type { FormData } from './types';

describe('Form Validation', () => {
    describe('validate_field', () => {
        it('should pass validation when no validators are provided', () => {
            const error = validate_field('test', 'value', [], {});
            expect(error).toBeNull();
        });

        it('should validate required fields', () => {
            const validator = validators.required();
            const error_empty = validate_field('test', '', [validator], {});
            const error_null = validate_field('test', null, [validator], {});
            const error_valid = validate_field('test', 'value', [validator], {});

            expect(error_empty).toBe('This field is required');
            expect(error_null).toBe('This field is required');
            expect(error_valid).toBeNull();
        });

        it('should validate max_length', () => {
            const validator = validators.max_length(5);
            const error_too_long = validate_field('test', 'toolong', [validator], {});
            const error_valid = validate_field('test', 'ok', [validator], {});

            expect(error_too_long).toBe('Must be at most 5 characters');
            expect(error_valid).toBeNull();
        });

        it('should validate min_length', () => {
            const validator = validators.min_length(5);
            const error_too_short = validate_field('test', 'hi', [validator], {});
            const error_valid = validate_field('test', 'hello', [validator], {});

            expect(error_too_short).toBe('Must be at least 5 characters');
            expect(error_valid).toBeNull();
        });

        it('should validate number min', () => {
            const validator = validators.min(10);
            const error_too_small = validate_field('test', 5, [validator], {});
            const error_valid = validate_field('test', 15, [validator], {});

            expect(error_too_small).toBe('Must be at least 10');
            expect(error_valid).toBeNull();
        });

        it('should validate number max', () => {
            const validator = validators.max(100);
            const error_too_large = validate_field('test', 150, [validator], {});
            const error_valid = validate_field('test', 50, [validator], {});

            expect(error_too_large).toBe('Must be at most 100');
            expect(error_valid).toBeNull();
        });

        it('should validate pattern', () => {
            const validator = validators.pattern('^[A-Z]+$', 'Must be uppercase letters only');
            const error_invalid = validate_field('test', 'hello', [validator], {});
            const error_valid = validate_field('test', 'HELLO', [validator], {});

            expect(error_invalid).toBe('Must be uppercase letters only');
            expect(error_valid).toBeNull();
        });

        it('should validate custom validators', () => {
            const validator = validators.custom(
                (value) => typeof value === 'string' && value.includes('test'),
                'Must contain "test"'
            );
            const error_invalid = validate_field('test', 'hello', [validator], {});
            const error_valid = validate_field('test', 'test123', [validator], {});

            expect(error_invalid).toBe('Must contain "test"');
            expect(error_valid).toBeNull();
        });

        it('should validate arrays with min_length', () => {
            const validator = validators.min_length(2);
            const error_too_short = validate_field('test', ['one'], [validator], {});
            const error_valid = validate_field('test', ['one', 'two'], [validator], {});

            expect(error_too_short).toBe('Must be at least 2 characters');
            expect(error_valid).toBeNull();
        });

        it('should run multiple validators and return first error', () => {
            const validators_list = [
                validators.required(),
                validators.min_length(5),
                validators.max_length(10)
            ];

            const error_required = validate_field('test', '', validators_list, {});
            const error_min = validate_field('test', 'hi', validators_list, {});
            const error_max = validate_field('test', 'this is way too long', validators_list, {});
            const error_valid = validate_field('test', 'hello', validators_list, {});

            expect(error_required).toBe('This field is required');
            expect(error_min).toBe('Must be at least 5 characters');
            expect(error_max).toBe('Must be at most 10 characters');
            expect(error_valid).toBeNull();
        });

        it('should access form data in custom validator', () => {
            const form_data: FormData = { password: 'secret123', confirm: 'secret456' };
            const validator = validators.custom(
                (value, data) => value === data.password,
                'Passwords must match'
            );

            const error = validate_field('confirm', form_data.confirm, [validator], form_data);
            expect(error).toBe('Passwords must match');

            form_data.confirm = 'secret123';
            const error_valid = validate_field(
                'confirm',
                form_data.confirm,
                [validator],
                form_data
            );
            expect(error_valid).toBeNull();
        });
    });

    describe('validators builders', () => {
        it('should build required validator with custom message', () => {
            const validator = validators.required('Custom required message');
            expect(validator.type).toBe(ValidationRuleType.REQUIRED);
            expect(validator.message).toBe('Custom required message');
        });

        it('should build max_length validator with default message', () => {
            const validator = validators.max_length(50);
            expect(validator.type).toBe(ValidationRuleType.MAX_LENGTH);
            expect(validator.value).toBe(50);
            expect(validator.message).toBe('Must be at most 50 characters');
        });

        it('should build min validator with custom message', () => {
            const validator = validators.min(18, 'Must be 18 or older');
            expect(validator.type).toBe(ValidationRuleType.MIN);
            expect(validator.value).toBe(18);
            expect(validator.message).toBe('Must be 18 or older');
        });
    });
});
