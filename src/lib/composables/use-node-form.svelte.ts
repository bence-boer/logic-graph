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
    node_name: string;
    node_description: string;
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
 * const form = use_node_form({ name: 'Example', description: 'Test' });
 * if (form.validate()) {
 *   // Form is valid, submit...
 * }
 * ```
 */
export function use_node_form(
    initial_values?: Partial<LogicNode>
): NodeFormState & NodeFormHandlers {
    let node_name = $state(initial_values?.name ?? '');
    let node_description = $state(initial_values?.description ?? '');
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

        if (!node_name.trim()) {
            validation_errors.name = 'Name is required';
            return false;
        }

        if (node_name.length > 100) {
            validation_errors.name = 'Name must be less than 100 characters';
            return false;
        }

        if (node_description.length > 500) {
            validation_errors.description = 'Description must be less than 500 characters';
            return false;
        }

        return true;
    }

    /**
     * Resets the form to initial values
     */
    function reset(): void {
        node_name = initial_values?.name ?? '';
        node_description = initial_values?.description ?? '';
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
        get node_name() {
            return node_name;
        },
        set node_name(value: string) {
            node_name = value;
        },

        get node_description() {
            return node_description;
        },
        set node_description(value: string) {
            node_description = value;
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
