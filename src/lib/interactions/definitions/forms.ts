/**
 * Form interaction definitions.
 *
 * Defines all interactions within forms.
 */

import { InteractionContext, EventMatcherType, type InteractionDefinition } from '../types';

/**
 * Form interactions.
 */
export const form_interactions: InteractionDefinition[] = [
    // Enter in input to submit form
    {
        id: 'form.input.enter.submit',
        contexts: [InteractionContext.FORM],
        matcher: {
            type: EventMatcherType.KEY,
            key: 'Enter',
            target: 'input[type="text"], input[type="search"], textarea',
            prevent_default: true
        },
        command: 'form.submit',
        priority: 100,
        description: 'Press Enter in input to submit form'
    },

    // Escape in input to blur (close form)
    {
        id: 'form.input.escape.blur',
        contexts: [InteractionContext.FORM],
        matcher: {
            type: EventMatcherType.KEY,
            key: 'Escape',
            target: 'input, textarea, select',
            prevent_default: true
        },
        command: 'form.blur',
        priority: 100,
        description: 'Press Escape in input to blur and close form'
    },

    // Click cancel button
    {
        id: 'form.button.click.cancel',
        contexts: [InteractionContext.FORM],
        matcher: {
            type: EventMatcherType.CLICK,
            target: 'button[data-action="cancel"]',
            prevent_default: true
        },
        command: 'form.cancel',
        priority: 50,
        description: 'Click cancel button to close form'
    },

    // Click submit button
    {
        id: 'form.button.click.submit',
        contexts: [InteractionContext.FORM],
        matcher: {
            type: EventMatcherType.CLICK,
            target: 'button[data-action="submit"]',
            prevent_default: true
        },
        command: 'form.submit',
        priority: 50,
        description: 'Click submit button to submit form'
    }
];
