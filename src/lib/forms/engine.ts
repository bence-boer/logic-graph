/**
 * Form engine for managing form state and operations.
 * Provides a composable for creating form instances with validation and state management.
 */

import type {
    FormDefinition,
    FormState,
    FormContext,
    FormData,
    FormFieldValue,
    FormField
} from './types';
import { validate_field } from './validation';

/**
 * Creates a form context with state management and validation.
 *
 * @param definition - Form definition
 * @returns Form context with state and handlers
 *
 * @example
 * ```ts
 * const form = create_form(MY_FORM_DEFINITION);
 * form.update_field('statement', 'New value');
 * if (form.validate_form()) {
 *   await form.submit_form();
 * }
 * ```
 */
export function create_form<TFormData extends FormData = FormData>(
    definition: FormDefinition<TFormData>
): FormContext<TFormData> {
    // Initialize form data with defaults
    const initial_data = get_initial_data(definition);

    let data = $state<TFormData>(initial_data);
    let errors = $state<Record<string, string>>({});
    let dirty = $state(false);
    let submitting = $state(false);
    let submitted = $state(false);
    let touched = $state<Set<string>>(new Set());

    const state: FormState<TFormData> = {
        get data() {
            return data;
        },
        get errors() {
            return errors;
        },
        get dirty() {
            return dirty;
        },
        get submitting() {
            return submitting;
        },
        get submitted() {
            return submitted;
        },
        get touched() {
            return touched;
        }
    };

    /**
     * Updates a field value in the form data.
     *
     * @param field_name - Name of the field to update
     * @param value - New value for the field
     */
    function update_field(field_name: string, value: FormFieldValue): void {
        data = { ...data, [field_name]: value };
        dirty = true;

        // Clear error for this field when it's updated
        if (errors[field_name]) {
            const new_errors = { ...errors };
            delete new_errors[field_name];
            errors = new_errors;
        }
    }

    /**
     * Marks a field as touched (for showing validation on blur).
     *
     * @param field_name - Name of the field to mark as touched
     */
    function touch_field(field_name: string): void {
        touched = new Set(touched).add(field_name);

        // Validate the field when it's touched
        validate_field_internal(field_name);
    }

    /**
     * Validates a single field.
     *
     * @param field_name - Name of the field to validate
     * @returns true if field is valid, false otherwise
     */
    function validate_field_internal(field_name: string): boolean {
        const field = get_field_by_name(definition, field_name);
        if (!field || !field.validators || field.validators.length === 0) {
            return true;
        }

        const field_value = data[field_name];
        const error = validate_field(field_name, field_value, field.validators, data);

        if (error) {
            errors = { ...errors, [field_name]: error };
            return false;
        } else {
            const new_errors = { ...errors };
            delete new_errors[field_name];
            errors = new_errors;
            return true;
        }
    }

    /**
     * Validates the entire form.
     *
     * @returns true if all fields are valid, false otherwise
     */
    function validate_form(): boolean {
        const all_fields = get_all_fields(definition);
        const new_errors: Record<string, string> = {};
        let is_valid = true;

        for (const field of all_fields) {
            // Skip validation for invisible fields
            if (field.visible && !field.visible(data)) {
                continue;
            }

            if (!field.validators || field.validators.length === 0) {
                continue;
            }

            const field_value = data[field.name];
            const error = validate_field(field.name, field_value, field.validators, data);

            if (error) {
                new_errors[field.name] = error;
                is_valid = false;
            }
        }

        errors = new_errors;
        return is_valid;
    }

    /**
     * Resets the form to its initial state.
     */
    function reset_form(): void {
        data = get_initial_data(definition);
        errors = {};
        dirty = false;
        submitting = false;
        submitted = false;
        touched = new Set();
    }

    /**
     * Submits the form.
     * Validates the form, executes the submit handler or command, and manages state.
     */
    async function submit_form(): Promise<void> {
        // Validate form before submission
        if (!validate_form()) {
            return;
        }

        submitting = true;

        try {
            // Execute custom submit handler if provided
            if (definition.submit_handler) {
                await definition.submit_handler(data);
            }

            // TODO: Execute submit command if provided (requires command executor integration)
            // if (definition.submit_command && definition.submit_payload) {
            //     const payload = definition.submit_payload(data);
            //     await execute_command(definition.submit_command, payload);
            // }

            submitted = true;

            // Reset form if configured
            if (definition.reset_on_submit) {
                reset_form();
            } else {
                // Just mark as not dirty
                dirty = false;
            }
        } catch (error) {
            console.error('Form submission failed:', error);
            throw error;
        } finally {
            submitting = false;
        }
    }

    /**
     * Sets the submitting state.
     *
     * @param value - New submitting state
     */
    function set_submitting(value: boolean): void {
        submitting = value;
    }

    return {
        definition,
        state,
        update_field,
        touch_field,
        validate_field: validate_field_internal,
        validate_form,
        reset_form,
        submit_form,
        set_submitting
    };
}

/**
 * Gets initial form data from the definition.
 * Combines default values from fields with any provided initial_data.
 *
 * @param definition - Form definition
 * @returns Initial form data
 */
function get_initial_data<TFormData extends FormData>(
    definition: FormDefinition<TFormData>
): TFormData {
    const all_fields = get_all_fields(definition);
    const initial: FormData = {};

    // Set default values from field definitions
    for (const field of all_fields) {
        if (field.default_value !== undefined) {
            initial[field.name] = field.default_value;
        } else {
            // Set sensible defaults based on field type
            initial[field.name] = get_default_value_for_field(field);
        }
    }

    // Override with provided initial_data
    if (definition.initial_data) {
        Object.assign(initial, definition.initial_data);
    }

    return initial as TFormData;
}

/**
 * Gets a default value for a field based on its type.
 *
 * @param field - Form field
 * @returns Default value
 */
function get_default_value_for_field(field: FormField): FormFieldValue {
    // Handle fields with options - use first option or null
    if (field.options) {
        if (Array.isArray(field.options) && field.options.length > 0) {
            return field.options[0].value;
        }
        return null;
    }

    // Default values by type
    switch (field.type.toString()) {
        case 'text':
        case 'textarea':
            return '';
        case 'number':
            return field.min ?? 0;
        case 'checkbox':
            return false;
        case 'multi_select':
            return [];
        default:
            return null;
    }
}

/**
 * Gets all fields from a form definition, including nested fields in sections.
 *
 * @param definition - Form definition
 * @returns Array of all fields
 */
function get_all_fields<TFormData extends FormData>(
    definition: FormDefinition<TFormData>
): FormField[] {
    const fields: FormField[] = [];

    // Add top-level fields
    if (definition.fields) {
        fields.push(...definition.fields);
    }

    // Add fields from sections
    if (definition.sections) {
        for (const section of definition.sections) {
            fields.push(...section.fields);
        }
    }

    return fields;
}

/**
 * Gets a field by its name from a form definition.
 *
 * @param definition - Form definition
 * @param field_name - Name of the field to find
 * @returns Field definition or undefined if not found
 */
function get_field_by_name<TFormData extends FormData>(
    definition: FormDefinition<TFormData>,
    field_name: string
): FormField | undefined {
    const all_fields = get_all_fields(definition);
    return all_fields.find((field) => field.name === field_name);
}
