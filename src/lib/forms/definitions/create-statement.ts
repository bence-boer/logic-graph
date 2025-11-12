/**
 * Form definition for creating a new statement node.
 */

import type { FormDefinition, FormData } from '../types';
import { FieldType, FormActionVariant } from '../types';
import { validators } from '../validation';

/**
 * Data structure for the create statement form.
 */
export interface CreateStatementFormData extends FormData {
    statement: string;
    details: string;
}

/**
 * Form definition for creating a new statement.
 */
export const CREATE_STATEMENT_FORM: FormDefinition<CreateStatementFormData> = {
    id: 'form.create_statement',
    title: 'Create New Statement',
    description: 'Add a new statement to the logic graph',

    fields: [
        {
            name: 'statement',
            label: 'Statement',
            type: FieldType.TEXT,
            placeholder: 'Enter statement...',
            required: true,
            max_length: 100,
            validators: [validators.required('Statement is required'), validators.max_length(100)]
        },
        {
            name: 'details',
            label: 'Details',
            type: FieldType.TEXTAREA,
            placeholder: 'Enter details...',
            hint: 'Optional additional details',
            rows: 4,
            max_length: 500,
            validators: [validators.max_length(500)]
        }
    ],

    actions: [
        {
            label: 'Cancel',
            variant: FormActionVariant.SECONDARY,
            handler: () => {
                // Will be handled by form component to close panel
            }
        },
        {
            label: 'Create Statement',
            variant: FormActionVariant.PRIMARY,
            validate: true,
            payload: (data) => ({
                statement: data.statement.trim(),
                details: data.details.trim()
            })
        }
    ],

    reset_on_submit: true
};
