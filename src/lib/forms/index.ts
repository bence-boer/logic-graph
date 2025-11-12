/**
 * Form registry and exports.
 * Central location for all form definitions and utilities.
 */

import type { FormDefinition, FormData as FormDataType } from './types';
import { CREATE_STATEMENT_FORM } from './definitions/create-statement';
import { EDIT_STATEMENT_FORM } from './definitions/edit-statement';
import { CREATE_QUESTION_FORM } from './definitions/create-question';

// Export types
export type {
    FormDefinition,
    FormField,
    FormAction,
    FormSection,
    FormState,
    FormContext,
    FormData,
    FormFieldValue,
    FieldValidator,
    FieldOption
} from './types';

export { FieldType, ValidationRuleType, FormActionVariant } from './types';

// Export validation utilities
export { validate_field, validators } from './validation';

// Export form engine
export { create_form } from './engine';

// Export form definitions
export {
    CREATE_STATEMENT_FORM,
    type CreateStatementFormData
} from './definitions/create-statement';

export { EDIT_STATEMENT_FORM, type EditStatementFormData } from './definitions/edit-statement';

export { CREATE_QUESTION_FORM, type CreateQuestionFormData } from './definitions/create-question';

/**
 * Form registry mapping form IDs to definitions.
 */
export const FORM_REGISTRY = {
    'form.create_statement': CREATE_STATEMENT_FORM,
    'form.edit_statement': EDIT_STATEMENT_FORM,
    'form.create_question': CREATE_QUESTION_FORM
} as const;

/**
 * Gets a form definition by ID from the registry.
 *
 * @param form_id - ID of the form to retrieve
 * @returns Form definition or undefined if not found
 */
export function get_form_definition<TFormData extends FormDataType = FormDataType>(
    form_id: string
): FormDefinition<TFormData> | undefined {
    const form = FORM_REGISTRY[form_id as keyof typeof FORM_REGISTRY];
    // Type assertion needed because registry contains multiple form types
    return form as unknown as FormDefinition<TFormData> | undefined;
}
