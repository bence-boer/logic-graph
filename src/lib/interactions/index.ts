/**
 * Interaction system exports.
 *
 * Central export point for the interaction system.
 */

import { canvas_interactions } from './definitions/canvas';
import { keyboard_interactions } from './definitions/keyboard';
import { gesture_interactions } from './definitions/gestures';
import { form_interactions } from './definitions/forms';
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
export { canvas_interactions, keyboard_interactions, gesture_interactions, form_interactions };

/**
 * Export types and router.
 */
export * from './types';
export * from './router';
