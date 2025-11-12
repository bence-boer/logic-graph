/**
 * Example usage of the form system.
 * Demonstrates how to use form definitions with the DynamicForm component.
 */

import { CREATE_STATEMENT_FORM } from '$lib/forms/definitions/create-statement';

// Example 1: Basic usage with DynamicForm component
function example_basic_usage() {
    // In a Svelte component:
    /*
    <script lang="ts">
        import { CREATE_STATEMENT_FORM } from '$lib/forms';
        import DynamicForm from '$lib/components/forms/DynamicForm.svelte';
        
        function handle_submit(data) {
            console.log('Form submitted:', data);
            // data = { statement: '...', details: '...' }
        }
        
        function handle_cancel() {
            console.log('Form cancelled');
        }
    </script>
    
    <DynamicForm 
        definition={CREATE_STATEMENT_FORM}
        onsubmit={handle_submit}
        oncancel={handle_cancel}
    />
    */
}

// Example 2: Using the form engine programmatically
import { create_form } from '$lib/forms';

function example_programmatic_usage() {
    // Create a form instance
    const form = create_form(CREATE_STATEMENT_FORM);

    // Access form state
    console.log('Form data:', form.state.data);
    console.log('Validation errors:', form.state.errors);
    console.log('Is dirty:', form.state.dirty);
    console.log('Is submitting:', form.state.submitting);

    // Update a field
    form.update_field('statement', 'New statement');

    // Mark field as touched (triggers validation display)
    form.touch_field('statement');

    // Validate a single field
    form.validate_field('statement');

    // Validate entire form
    const form_is_valid = form.validate_form();

    // Submit form
    if (form_is_valid) {
        form.submit_form().then(() => {
            console.log('Form submitted successfully');
        });
    }

    // Reset form
    form.reset_form();
}

// Example 3: Creating a custom form definition
import type { FormDefinition, FormData, FormFieldValue } from '$lib/forms';
import { FieldType, FormActionVariant, validators } from '$lib/forms';

interface CustomFormData extends FormData {
    username: string;
    email: string;
    age: number;
    accept_terms: boolean;
}

const CUSTOM_FORM: FormDefinition<CustomFormData> = {
    id: 'form.custom',
    title: 'Custom Form',
    description: 'Example custom form definition',

    fields: [
        {
            name: 'username',
            label: 'Username',
            type: FieldType.TEXT,
            required: true,
            validators: [
                validators.required('Username is required'),
                validators.min_length(3),
                validators.max_length(20),
                validators.pattern('^[a-zA-Z0-9_]+$', 'Only letters, numbers, and underscores')
            ]
        },
        {
            name: 'email',
            label: 'Email',
            type: FieldType.TEXT,
            required: true,
            validators: [
                validators.required('Email is required'),
                validators.pattern('^[^@]+@[^@]+\\.[^@]+$', 'Invalid email format')
            ]
        },
        {
            name: 'age',
            label: 'Age',
            type: FieldType.NUMBER,
            min: 18,
            max: 120,
            validators: [
                validators.required('Age is required'),
                validators.min(18, 'Must be at least 18 years old'),
                validators.max(120)
            ]
        },
        {
            name: 'accept_terms',
            label: 'I accept the terms and conditions',
            type: FieldType.CHECKBOX,
            required: true,
            validators: [validators.custom((value) => value === true, 'You must accept the terms')]
        }
    ],

    actions: [
        {
            label: 'Cancel',
            variant: FormActionVariant.SECONDARY,
            handler: () => {
                console.log('Form cancelled');
            }
        },
        {
            label: 'Submit',
            variant: FormActionVariant.PRIMARY,
            validate: true,
            handler: async (data) => {
                console.log('Submitting:', data);
                // Perform submission logic
            }
        }
    ]
};

// Example 4: Conditional field visibility
interface ConditionalFormData {
    user_type: string;
    company_name: string;
    [key: string]: FormFieldValue;
}

const CONDITIONAL_FORM: FormDefinition<ConditionalFormData> = {
    id: 'form.conditional',
    title: 'Conditional Form',

    fields: [
        {
            name: 'user_type',
            label: 'User Type',
            type: FieldType.SELECT,
            options: [
                { value: 'individual', label: 'Individual' },
                { value: 'business', label: 'Business' }
            ],
            default_value: 'individual'
        },
        {
            name: 'company_name',
            label: 'Company Name',
            type: FieldType.TEXT,
            // Only show if user_type is 'business'
            visible: (data) => data.user_type === 'business',
            validators: [validators.required('Company name is required')]
        }
    ],

    actions: [
        {
            label: 'Submit',
            variant: FormActionVariant.PRIMARY,
            validate: true
        }
    ]
};

// Example 5: Cross-field validation
interface PasswordFormData {
    password: string;
    confirm_password: string;
    [key: string]: FormFieldValue;
}

const PASSWORD_FORM: FormDefinition<PasswordFormData> = {
    id: 'form.password',
    title: 'Change Password',

    fields: [
        {
            name: 'password',
            label: 'Password',
            type: FieldType.TEXT,
            validators: [
                validators.required('Password is required'),
                validators.min_length(8, 'Password must be at least 8 characters')
            ]
        },
        {
            name: 'confirm_password',
            label: 'Confirm Password',
            type: FieldType.TEXT,
            validators: [
                validators.required('Please confirm your password'),
                validators.custom(
                    (value, form_data) => value === form_data.password,
                    'Passwords must match'
                )
            ]
        }
    ],

    actions: [
        {
            label: 'Update Password',
            variant: FormActionVariant.PRIMARY,
            validate: true
        }
    ]
};

export {
    example_basic_usage,
    example_programmatic_usage,
    CUSTOM_FORM,
    CONDITIONAL_FORM,
    PASSWORD_FORM
};
