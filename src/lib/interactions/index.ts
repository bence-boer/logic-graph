/**
 * Interaction system exports.
 *
 * Central export point for the interaction system.
 */

import { canvas_interactions } from './definitions/canvas';
import { form_interactions } from './definitions/forms';
import { gesture_interactions } from './definitions/gestures';
import { keyboard_interactions } from './definitions/keyboard';
import type { InteractionDefinition } from './types';

/**
 * All registered interactions.
 */
export const all_interactions: InteractionDefinition[] = [
    ...canvas_interactions,
    ...keyboard_interactions,
    ...gesture_interactions,
    ...form_interactions
];

/**
 * Export individual interaction groups.
 */
export { canvas_interactions, form_interactions, gesture_interactions, keyboard_interactions };

/**
 * Export types and router.
 */
export * from './router';
export * from './types';
