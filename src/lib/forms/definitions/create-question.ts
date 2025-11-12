/**
 * Form definition for creating a new question node.
 */

import type { FormDefinition, FormData } from '../types';
import { FieldType, FormActionVariant } from '../types';
import { validators } from '../validation';

/**
 * Data structure for the create question form.
 */
export interface CreateQuestionFormData extends FormData {
    statement: string;
    details: string;
}

/**
 * Form definition for creating a new question.
 */
export const CREATE_QUESTION_FORM: FormDefinition<CreateQuestionFormData> = {
    id: 'form.create_question',
    title: 'Create New Question',
    description: 'Add a new question to the logic graph',

    fields: [
        {
            name: 'statement',
            label: 'Question',
            type: FieldType.TEXT,
            placeholder: 'Enter question...',
            required: true,
            max_length: 100,
            validators: [validators.required('Question is required'), validators.max_length(100)]
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
            label: 'Create Question',
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
