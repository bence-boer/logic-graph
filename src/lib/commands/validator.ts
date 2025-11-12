/**
 * Command validation utilities.
 *
 * Provides helper functions for validating command payloads.
 */

import type { ValidationResult } from './types';

/**
 * Create a successful validation result.
 *
 * @returns Valid result
 *
 * @example
 * ```ts
 * return valid();
 * ```
 */
export function valid(): ValidationResult {
    return { valid: true };
}

/**
 * Create a failed validation result with an error message.
 *
 * @param error - Error message
 * @returns Invalid result
 *
 * @example
 * ```ts
 * return invalid('Node ID is required');
 * ```
 */
export function invalid(error: string): ValidationResult {
    return { valid: false, error };
}

/**
 * Create a failed validation result with field-specific errors.
 *
 * @param field_errors - Map of field names to error messages
 * @returns Invalid result with field errors
 *
 * @example
 * ```ts
 * return invalid_fields({
 *   statement: 'Statement cannot be empty',
 *   details: 'Details too long'
 * });
 * ```
 */
export function invalid_fields(field_errors: Record<string, string>): ValidationResult {
    return {
        valid: false,
        error: 'Validation failed',
        field_errors
    };
}

/**
 * Validate that a value is not null or undefined.
 *
 * @param value - Value to check
 * @param field_name - Name of field being validated
 * @returns Validation result
 *
 * @example
 * ```ts
 * const result = required(payload.statement, 'statement');
 * if (!result.valid) return result;
 * ```
 */
export function required<T>(value: T | null | undefined, field_name: string): ValidationResult {
    if (value === null || value === undefined || value === '') {
        return invalid(`${field_name} is required`);
    }
    return valid();
}

/**
 * Validate that a string does not exceed maximum length.
 *
 * @param value - String to validate
 * @param max_length - Maximum allowed length
 * @param field_name - Name of field being validated
 * @returns Validation result
 *
 * @example
 * ```ts
 * const result = max_length(payload.statement, 100, 'statement');
 * if (!result.valid) return result;
 * ```
 */
export function max_length(
    value: string,
    max_length: number,
    field_name: string
): ValidationResult {
    if (value.length > max_length) {
        return invalid(`${field_name} must be ${max_length} characters or less`);
    }
    return valid();
}

/**
 * Validate that a string meets minimum length requirement.
 *
 * @param value - String to validate
 * @param min_length - Minimum required length
 * @param field_name - Name of field being validated
 * @returns Validation result
 *
 * @example
 * ```ts
 * const result = min_length(payload.statement, 3, 'statement');
 * if (!result.valid) return result;
 * ```
 */
export function min_length(
    value: string,
    min_length: number,
    field_name: string
): ValidationResult {
    if (value.length < min_length) {
        return invalid(`${field_name} must be at least ${min_length} characters`);
    }
    return valid();
}

/**
 * Combine multiple validation results.
 * Returns the first invalid result, or valid if all are valid.
 *
 * @param results - Array of validation results
 * @returns Combined result
 *
 * @example
 * ```ts
 * return combine([
 *   required(payload.statement, 'statement'),
 *   max_length(payload.statement, 100, 'statement'),
 *   required(payload.node_type, 'node_type')
 * ]);
 * ```
 */
export function combine(results: ValidationResult[]): ValidationResult {
    for (const result of results) {
        if (!result.valid) {
            return result;
        }
    }
    return valid();
}
