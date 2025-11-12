/**
 * Form system type definitions.
 * Provides types for declarative form definitions, field validation, and form actions.
 */

import type { CommandPayload } from '$lib/commands/types';

/**
 * Type representing valid form field values.
 * Supports primitives, nulls, and arrays of primitives.
 */
export type FormFieldValue = string | number | boolean | null | string[] | number[];

/**
 * Record type for form data where keys are field names and values are FormFieldValue types.
 */
export type FormData = Record<string, FormFieldValue>;

/**
 * Field types supported by the form system.
 */
export enum FieldType {
    /** Single-line text input */
    TEXT = 'text',
    /** Multi-line text input */
    TEXTAREA = 'textarea',
    /** Number input */
    NUMBER = 'number',
    /** Checkbox input */
    CHECKBOX = 'checkbox',
    /** Radio button group */
    RADIO = 'radio',
    /** Select dropdown */
    SELECT = 'select',
    /** Multi-select dropdown */
    MULTI_SELECT = 'multi_select',
    /** Date picker */
    DATE = 'date',
    /** Custom field renderer (use section prop) */
    CUSTOM = 'custom'
}

/**
 * Validation rule types.
 */
export enum ValidationRuleType {
    REQUIRED = 'required',
    MIN_LENGTH = 'min_length',
    MAX_LENGTH = 'max_length',
    MIN = 'min',
    MAX = 'max',
    PATTERN = 'pattern',
    CUSTOM = 'custom'
}

/**
 * Field validation rule.
 */
export interface FieldValidator {
    /** Type of validation rule */
    type: ValidationRuleType;

    /** Value for the validation (e.g., max length, pattern) */
    value?: string | number;

    /** Custom validation function (for ValidationRuleType.Custom) */
    validate?: (field_value: FormFieldValue, form_data: FormData) => boolean;

    /** Error message to display when validation fails */
    message: string;
}

/**
 * Option for select/radio fields.
 */
export interface FieldOption {
    /** Option value */
    value: string | number;

    /** Display label */
    label: string;

    /** Optional disabled state */
    disabled?: boolean;
}

/**
 * Form field definition.
 */
export interface FormField {
    /** Field name (key in form data) */
    name: string;

    /** Display label */
    label: string;

    /** Field type */
    type: FieldType;

    /** Placeholder text */
    placeholder?: string;

    /** Help text/hint */
    hint?: string;

    /** Default value */
    default_value?: FormFieldValue;

    /** Whether field is required */
    required?: boolean;

    /** Whether field is disabled */
    disabled?: boolean;

    /** Whether field is read-only */
    readonly?: boolean;

    /** Validation rules */
    validators?: FieldValidator[];

    /** Options for select/radio fields */
    options?: FieldOption[] | ((form_data: FormData) => FieldOption[]);

    /** Number of rows for textarea */
    rows?: number;

    /** Maximum length for text inputs */
    max_length?: number;

    /** Minimum value for number inputs */
    min?: number;

    /** Maximum value for number inputs */
    max?: number;

    /** Step value for number inputs */
    step?: number;

    /** Custom field renderer component (for FieldType.Custom) */
    component?: unknown; // Would be a Svelte component constructor

    /** Conditional visibility based on form data */
    visible?: (form_data: FormData) => boolean;
}

/**
 * Form action button variants.
 */
export enum FormActionVariant {
    /** Primary action (e.g., Submit) */
    PRIMARY = 'primary',
    /** Secondary action (e.g., Cancel) */
    SECONDARY = 'secondary',
    /** Danger action (e.g., Delete) */
    DANGER = 'danger'
}

/**
 * Form action button definition.
 */
export interface FormAction<TFormData extends FormData = FormData> {
    /** Action label */
    label: string;

    /** Button variant */
    variant: FormActionVariant;

    /** Command to execute when action is triggered */
    command?: string;

    /** Custom handler function (alternative to command) */
    handler?: (form_data: TFormData) => void | Promise<void>;

    /** Whether action is disabled */
    disabled?: boolean | ((form_data: TFormData) => boolean);

    /** Whether action is currently loading */
    loading?: boolean;

    /** Icon component for the action */
    icon?: unknown; // Would be a Svelte component constructor

    /** Conditional visibility based on form data */
    visible?: (form_data: TFormData) => boolean;

    /** Payload mapper for command execution */
    payload?: (form_data: TFormData) => CommandPayload;

    /** Whether to validate form before executing action */
    validate?: boolean;
}

/**
 * Form section definition for grouping fields.
 */
export interface FormSection {
    /** Section title */
    title?: string;

    /** Section description */
    description?: string;

    /** Fields in this section */
    fields: FormField[];

    /** Whether section is collapsible */
    collapsible?: boolean;

    /** Whether section is initially collapsed */
    collapsed?: boolean;

    /** Custom section renderer component */
    component?: unknown; // Would be a Svelte component constructor

    /** Conditional visibility based on form data */
    visible?: (form_data: FormData) => boolean;
}

/**
 * Complete form definition.
 */
export interface FormDefinition<TFormData extends FormData = FormData> {
    /** Unique form ID */
    id: string;

    /** Form title */
    title: string;

    /** Form description */
    description?: string;

    /** Form fields (flat structure) */
    fields?: FormField[];

    /** Form sections (grouped structure) */
    sections?: FormSection[];

    /** Form actions (buttons) */
    actions: FormAction<TFormData>[];

    /** Initial form data */
    initial_data?: Partial<TFormData>;

    /** Command to execute on form submission */
    submit_command?: string;

    /** Payload mapper for submit command */
    submit_payload?: (form_data: TFormData) => CommandPayload;

    /** Custom submit handler (alternative to submit_command) */
    submit_handler?: (form_data: TFormData) => void | Promise<void>;

    /** Whether to reset form after successful submission */
    reset_on_submit?: boolean;

    /** Whether to close form after successful submission */
    close_on_submit?: boolean;
}

/**
 * Form state for tracking form data and validation.
 */
export interface FormState<TFormData extends FormData = FormData> {
    /** Current form data */
    data: TFormData;

    /** Validation errors by field name */
    errors: Record<string, string>;

    /** Whether form has been modified */
    dirty: boolean;

    /** Whether form is currently being submitted */
    submitting: boolean;

    /** Whether form has been successfully submitted */
    submitted: boolean;

    /** Touched fields (for showing validation on blur) */
    touched: Set<string>;
}

/**
 * Form context for managing form state and actions.
 */
export interface FormContext<TFormData extends FormData = FormData> {
    /** Form definition */
    definition: FormDefinition<TFormData>;

    /** Current form state */
    state: FormState<TFormData>;

    /** Update a field value */
    update_field: (field_name: string, value: FormFieldValue) => void;

    /** Mark a field as touched */
    touch_field: (field_name: string) => void;

    /** Validate a single field */
    validate_field: (field_name: string) => boolean;

    /** Validate entire form */
    validate_form: () => boolean;

    /** Reset form to initial state */
    reset_form: () => void;

    /** Submit form */
    submit_form: () => Promise<void>;

    /** Set submitting state */
    set_submitting: (submitting: boolean) => void;
}
