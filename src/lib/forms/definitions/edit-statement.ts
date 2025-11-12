/**
 * Form definition for editing an existing statement node.
 */

import type { FormDefinition, FormData } from '../types';
import { FieldType, FormActionVariant } from '../types';
import { validators } from '../validation';

/**
 * Data structure for the edit statement form.
 */
export interface EditStatementFormData extends FormData {
    node_id: string;
    statement: string;
    details: string;
    is_pinned: boolean;
}

/**
 * Form definition for editing an existing statement.
 */
export const EDIT_STATEMENT_FORM: FormDefinition<EditStatementFormData> = {
    id: 'form.edit_statement',
    title: 'Edit Statement',
    description: 'Modify an existing statement',

    fields: [
        {
            name: 'node_id',
            label: 'Node ID',
            type: FieldType.TEXT,
            readonly: true,
            visible: () => false // Hidden field
        },
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
        },
        {
            name: 'is_pinned',
            label: 'Pin this statement',
            type: FieldType.CHECKBOX,
            hint: 'Pinned statements remain in fixed positions'
        }
    ],

    actions: [
        {
            label: 'Delete',
            variant: FormActionVariant.DANGER,
            payload: (data) => ({
                node_id: data.node_id
            })
        },
        {
            label: 'Cancel',
            variant: FormActionVariant.SECONDARY,
            handler: () => {
                // Will be handled by form component to close panel
            }
        },
        {
            label: 'Save Changes',
            variant: FormActionVariant.PRIMARY,
            validate: true,
            payload: (data) => ({
                node_id: data.node_id,
                statement: data.statement.trim(),
                details: data.details.trim(),
                is_pinned: data.is_pinned
            })
        }
    ],

    reset_on_submit: false
};
