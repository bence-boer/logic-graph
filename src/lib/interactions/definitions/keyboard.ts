/**
 * Keyboard interaction definitions.
 *
 * Defines all keyboard shortcuts for the application.
 * Only Ctrl/Cmd combinations to avoid interfering with typing.
 */

import {
    InteractionContext,
    EventMatcherType,
    KeyModifier,
    type InteractionDefinition
} from '../types';

/**
 * Keyboard shortcut interactions.
 *
 * Only Ctrl/Cmd combinations to avoid interfering with typing.
 */
export const keyboard_interactions: InteractionDefinition[] = [
    // Escape - Close panel/modal or deselect
    {
        id: 'keyboard.escape.close_or_deselect',
        contexts: [InteractionContext.GLOBAL],
        matcher: {
            type: EventMatcherType.KEY,
            key: 'Escape',
            prevent_default: false
        },
        command: 'ui.escape',
        priority: 150,
        description: 'Press Escape to close panel/modal or deselect'
    },

    // Ctrl+Z - Undo
    {
        id: 'keyboard.ctrl_z.undo',
        contexts: [InteractionContext.GLOBAL],
        matcher: {
            type: EventMatcherType.KEY_COMBO,
            key: 'z',
            modifiers: [KeyModifier.CTRL],
            prevent_default: true
        },
        command: 'history.undo',
        priority: 200,
        description: 'Press Ctrl+Z to undo last action'
    },

    // Ctrl+Shift+Z - Redo
    {
        id: 'keyboard.ctrl_shift_z.redo',
        contexts: [InteractionContext.GLOBAL],
        matcher: {
            type: EventMatcherType.KEY_COMBO,
            key: 'z',
            modifiers: [KeyModifier.CTRL, KeyModifier.SHIFT],
            prevent_default: true
        },
        command: 'history.redo',
        priority: 200,
        description: 'Press Ctrl+Shift+Z to redo last undone action'
    },

    // Ctrl+Y - Redo (alternative)
    {
        id: 'keyboard.ctrl_y.redo',
        contexts: [InteractionContext.GLOBAL],
        matcher: {
            type: EventMatcherType.KEY_COMBO,
            key: 'y',
            modifiers: [KeyModifier.CTRL],
            prevent_default: true
        },
        command: 'history.redo',
        priority: 200,
        description: 'Press Ctrl+Y to redo last undone action'
    },

    // Ctrl+S - Export graph
    {
        id: 'keyboard.ctrl_s.export',
        contexts: [InteractionContext.GLOBAL],
        matcher: {
            type: EventMatcherType.KEY_COMBO,
            key: 's',
            modifiers: [KeyModifier.CTRL],
            prevent_default: true
        },
        command: 'file.export',
        priority: 200,
        description: 'Press Ctrl+S to export graph'
    },

    // Ctrl+O - Import graph
    {
        id: 'keyboard.ctrl_o.import',
        contexts: [InteractionContext.GLOBAL],
        matcher: {
            type: EventMatcherType.KEY_COMBO,
            key: 'o',
            modifiers: [KeyModifier.CTRL],
            prevent_default: true
        },
        command: 'file.import',
        priority: 200,
        description: 'Press Ctrl+O to import graph'
    }
];
