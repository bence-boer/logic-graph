/**
 * Form validation utilities.
 * Provides validators for common field validation rules.
 */

import type { FieldValidator, FormFieldValue, FormData } from './types';
import { ValidationRuleType as VRT } from './types';

/**
 * Validates a field value against a set of validation rules.
 *
 * @param field_name - Name of the field being validated
 * @param field_value - Current value of the field
 * @param validators - Array of validation rules to apply
 * @param form_data - Complete form data (for cross-field validation)
 * @returns Error message if validation fails, null if validation passes
 *
 * @example
 * ```ts
 * const error = validate_field('email', 'test@example.com', [
 *   { type: ValidationRuleType.REQUIRED, message: 'Email is required' },
 *   { type: ValidationRuleType.PATTERN, value: '^[^@]+@[^@]+\.[^@]+$', message: 'Invalid email' }
 * ], form_data);
 * ```
 */
export function validate_field(
    field_name: string,
    field_value: FormFieldValue,
    validators: FieldValidator[],
    form_data: FormData
): string | null {
    for (const validator of validators) {
        const is_valid = validate_rule(validator, field_value, form_data);
        if (!is_valid) {
            return validator.message;
        }
    }
    return null;
}

/**
 * Validates a single validation rule.
 *
 * @param validator - Validation rule to check
 * @param field_value - Current value of the field
 * @param form_data - Complete form data (for cross-field validation)
 * @returns true if validation passes, false otherwise
 */
function validate_rule(
    validator: FieldValidator,
    field_value: FormFieldValue,
    form_data: FormData
): boolean {
    switch (validator.type) {
        case VRT.REQUIRED:
            return validate_required(field_value);

        case VRT.MIN_LENGTH:
            return validate_min_length(field_value, validator.value as number);

        case VRT.MAX_LENGTH:
            return validate_max_length(field_value, validator.value as number);

        case VRT.MIN:
            return validate_min(field_value, validator.value as number);

        case VRT.MAX:
            return validate_max(field_value, validator.value as number);

        case VRT.PATTERN:
            return validate_pattern(field_value, validator.value as string);

        case VRT.CUSTOM:
            return validator.validate?.(field_value, form_data) ?? true;

        default:
            console.warn(`Unknown validation rule type: ${validator.type}`);
            return true;
    }
}

/**
 * Validates that a field has a value (is not null, undefined, or empty).
 *
 * @param field_value - Value to validate
 * @returns true if field has a value, false otherwise
 */
function validate_required(field_value: FormFieldValue): boolean {
    if (field_value === null || field_value === undefined) {
        return false;
    }

    if (typeof field_value === 'string') {
        return field_value.trim().length > 0;
    }

    if (Array.isArray(field_value)) {
        return field_value.length > 0;
    }

    return true;
}

/**
 * Validates that a string or array meets a minimum length requirement.
 *
 * @param field_value - Value to validate
 * @param min_length - Minimum required length
 * @returns true if length is at least min_length, false otherwise
 */
function validate_min_length(field_value: FormFieldValue, min_length: number): boolean {
    if (field_value === null || field_value === undefined) {
        return true; // Skip validation for empty values (use required validator)
    }

    if (typeof field_value === 'string') {
        return field_value.length >= min_length;
    }

    if (Array.isArray(field_value)) {
        return field_value.length >= min_length;
    }

    return true;
}

/**
 * Validates that a string or array does not exceed a maximum length.
 *
 * @param field_value - Value to validate
 * @param max_length - Maximum allowed length
 * @returns true if length is at most max_length, false otherwise
 */
function validate_max_length(field_value: FormFieldValue, max_length: number): boolean {
    if (field_value === null || field_value === undefined) {
        return true; // Skip validation for empty values
    }

    if (typeof field_value === 'string') {
        return field_value.length <= max_length;
    }

    if (Array.isArray(field_value)) {
        return field_value.length <= max_length;
    }

    return true;
}

/**
 * Validates that a number meets a minimum value requirement.
 *
 * @param field_value - Value to validate
 * @param min - Minimum allowed value
 * @returns true if value is at least min, false otherwise
 */
function validate_min(field_value: FormFieldValue, min: number): boolean {
    if (field_value === null || field_value === undefined) {
        return true; // Skip validation for empty values
    }

    if (typeof field_value === 'number') {
        return field_value >= min;
    }

    return true;
}

/**
 * Validates that a number does not exceed a maximum value.
 *
 * @param field_value - Value to validate
 * @param max - Maximum allowed value
 * @returns true if value is at most max, false otherwise
 */
function validate_max(field_value: FormFieldValue, max: number): boolean {
    if (field_value === null || field_value === undefined) {
        return true; // Skip validation for empty values
    }

    if (typeof field_value === 'number') {
        return field_value <= max;
    }

    return true;
}

/**
 * Validates that a string matches a regular expression pattern.
 *
 * @param field_value - Value to validate
 * @param pattern - Regular expression pattern (as string)
 * @returns true if value matches pattern, false otherwise
 */
function validate_pattern(field_value: FormFieldValue, pattern: string): boolean {
    if (field_value === null || field_value === undefined) {
        return true; // Skip validation for empty values
    }

    if (typeof field_value === 'string') {
        const regex = new RegExp(pattern);
        return regex.test(field_value);
    }

    return true;
}

/**
 * Common validation rule builders for convenience.
 */
export const validators = {
    /**
     * Creates a required field validator.
     *
     * @param message - Custom error message (optional)
     * @returns FieldValidator for required validation
     */
    required: (message = 'This field is required'): FieldValidator => ({
        type: VRT.REQUIRED,
        message
    }),

    /**
     * Creates a minimum length validator.
     *
     * @param min_length - Minimum required length
     * @param message - Custom error message (optional)
     * @returns FieldValidator for min length validation
     */
    min_length: (min_length: number, message?: string): FieldValidator => ({
        type: VRT.MIN_LENGTH,
        value: min_length,
        message: message ?? `Must be at least ${min_length} characters`
    }),

    /**
     * Creates a maximum length validator.
     *
     * @param max_length - Maximum allowed length
     * @param message - Custom error message (optional)
     * @returns FieldValidator for max length validation
     */
    max_length: (max_length: number, message?: string): FieldValidator => ({
        type: VRT.MAX_LENGTH,
        value: max_length,
        message: message ?? `Must be at most ${max_length} characters`
    }),

    /**
     * Creates a minimum value validator.
     *
     * @param min - Minimum allowed value
     * @param message - Custom error message (optional)
     * @returns FieldValidator for min value validation
     */
    min: (min: number, message?: string): FieldValidator => ({
        type: VRT.MIN,
        value: min,
        message: message ?? `Must be at least ${min}`
    }),

    /**
     * Creates a maximum value validator.
     *
     * @param max - Maximum allowed value
     * @param message - Custom error message (optional)
     * @returns FieldValidator for max value validation
     */
    max: (max: number, message?: string): FieldValidator => ({
        type: VRT.MAX,
        value: max,
        message: message ?? `Must be at most ${max}`
    }),

    /**
     * Creates a pattern validator.
     *
     * @param pattern - Regular expression pattern
     * @param message - Error message
     * @returns FieldValidator for pattern validation
     */
    pattern: (pattern: string, message: string): FieldValidator => ({
        type: VRT.PATTERN,
        value: pattern,
        message
    }),

    /**
     * Creates a custom validator.
     *
     * @param validate - Custom validation function
     * @param message - Error message
     * @returns FieldValidator for custom validation
     */
    custom: (
        validate: (field_value: FormFieldValue, form_data: FormData) => boolean,
        message: string
    ): FieldValidator => ({
        type: VRT.CUSTOM,
        validate,
        message
    })
};
