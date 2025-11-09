import type { LogicNode } from '$lib/types/graph';

/**
 * Validation errors for form fields
 */
export interface FormValidationErrors {
    [field: string]: string;
}

/**
 * Node form state for both create and edit operations
 */
export interface NodeFormState {
    node_statement: string;
    node_details: string;
    validation_errors: FormValidationErrors;
    is_submitting: boolean;
}

/**
 * Node form handlers
 */
export interface NodeFormHandlers {
    validate: () => boolean;
    reset: () => void;
    set_submitting: (value: boolean) => void;
}

/**
 * Shared form logic for node creation and editing.
 * Provides validation, state management, and reset functionality.
 *
 * @param initial_values - Optional initial values for editing an existing node
 * @returns Form state and handlers
 *
 * @example
 * ```ts
 * const form = use_node_form({ statement: 'Example', details: 'Test' });
 * if (form.validate()) {
 *   // Form is valid, submit...
 * }
 * ```
 */
export function use_node_form(
    initial_values?: Partial<LogicNode>
): NodeFormState & NodeFormHandlers {
    let node_statement = $state(initial_values?.statement ?? '');
    let node_details = $state(initial_values?.details ?? '');
    let validation_errors = $state<FormValidationErrors>({});
    let is_submitting = $state(false);

    /**
     * Validates the node form fields.
     * Sets validation_errors if any validation fails.
     *
     * @returns true if validation passes, false otherwise
     */
    function validate(): boolean {
        validation_errors = {};

        if (!node_statement.trim()) {
            validation_errors.statement = 'Statement is required';
            return false;
        }

        if (node_statement.length > 100) {
            validation_errors.statement = 'Statement must be less than 100 characters';
            return false;
        }

        if (node_details.length > 500) {
            validation_errors.details = 'Details must be less than 500 characters';
            return false;
        }

        return true;
    }

    /**
     * Resets the form to initial values
     */
    function reset(): void {
        node_statement = initial_values?.statement ?? '';
        node_details = initial_values?.details ?? '';
        validation_errors = {};
        is_submitting = false;
    }

    /**
     * Sets the submitting state
     */
    function set_submitting(value: boolean): void {
        is_submitting = value;
    }

    return {
        // State (with getters and setters)
        get node_statement() {
            return node_statement;
        },
        set node_statement(value: string) {
            node_statement = value;
        },

        get node_details() {
            return node_details;
        },
        set node_details(value: string) {
            node_details = value;
        },

        get validation_errors() {
            return validation_errors;
        },

        get is_submitting() {
            return is_submitting;
        },

        // Handlers
        validate,
        reset,
        set_submitting
    };
}
