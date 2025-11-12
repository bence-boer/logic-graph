/**
 * Animation presets for common visual effects.
 *
 * Provides pre-configured animation settings for frequently used animations,
 * ensuring consistency across the application.
 *
 * @module utils/animations/presets
 */

import type { AnimationPreset } from '$lib/types/animations';
import { AnimationType, EasingType, SlideDirection } from '$lib/types/animations';

/**
 * Fade in preset - smooth appearance from transparent.
 */
export const FADE_IN_PRESET: AnimationPreset = {
    name: 'fade_in',
    type: AnimationType.FADE_IN,
    config: {
        duration: 300,
        easing: EasingType.EASE_OUT
    },
    description: 'Smooth fade in from transparent to opaque'
};

/**
 * Fade out preset - smooth disappearance to transparent.
 */
export const FADE_OUT_PRESET: AnimationPreset = {
    name: 'fade_out',
    type: AnimationType.FADE_OUT,
    config: {
        duration: 300,
        easing: EasingType.EASE_IN
    },
    description: 'Smooth fade out from opaque to transparent'
};

/**
 * Grow in preset - scale from 0 to full size.
 */
export const GROW_IN_PRESET: AnimationPreset = {
    name: 'grow_in',
    type: AnimationType.GROW_IN,
    config: {
        duration: 400,
        easing: EasingType.EASE_OUT
    },
    description: 'Scale in from 0 to full size with ease out'
};

/**
 * Shrink out preset - scale from full size to 0.
 */
export const SHRINK_OUT_PRESET: AnimationPreset = {
    name: 'shrink_out',
    type: AnimationType.SHRINK_OUT,
    config: {
        duration: 300,
        easing: EasingType.EASE_IN
    },
    description: 'Scale out from full size to 0 with ease in'
};

/**
 * Slide in from top preset.
 */
export const SLIDE_IN_TOP_PRESET: AnimationPreset = {
    name: 'slide_in_top',
    type: AnimationType.SLIDE_IN,
    config: {
        duration: 400,
        easing: EasingType.EASE_OUT,
        options: {
            direction: SlideDirection.DOWN,
            distance: 50
        }
    },
    description: 'Slide in from top with ease out'
};

/**
 * Slide in from bottom preset.
 */
export const SLIDE_IN_BOTTOM_PRESET: AnimationPreset = {
    name: 'slide_in_bottom',
    type: AnimationType.SLIDE_IN,
    config: {
        duration: 400,
        easing: EasingType.EASE_OUT,
        options: {
            direction: SlideDirection.UP,
            distance: 50
        }
    },
    description: 'Slide in from bottom with ease out'
};

/**
 * Slide in from left preset.
 */
export const SLIDE_IN_LEFT_PRESET: AnimationPreset = {
    name: 'slide_in_left',
    type: AnimationType.SLIDE_IN,
    config: {
        duration: 400,
        easing: EasingType.EASE_OUT,
        options: {
            direction: SlideDirection.RIGHT,
            distance: 50
        }
    },
    description: 'Slide in from left with ease out'
};

/**
 * Slide in from right preset.
 */
export const SLIDE_IN_RIGHT_PRESET: AnimationPreset = {
    name: 'slide_in_right',
    type: AnimationType.SLIDE_IN,
    config: {
        duration: 400,
        easing: EasingType.EASE_OUT,
        options: {
            direction: SlideDirection.LEFT,
            distance: 50
        }
    },
    description: 'Slide in from right with ease out'
};

/**
 * Slide out to top preset.
 */
export const SLIDE_OUT_TOP_PRESET: AnimationPreset = {
    name: 'slide_out_top',
    type: AnimationType.SLIDE_OUT,
    config: {
        duration: 300,
        easing: EasingType.EASE_IN,
        options: {
            direction: SlideDirection.UP,
            distance: 50
        }
    },
    description: 'Slide out to top with ease in'
};

/**
 * Slide out to bottom preset.
 */
export const SLIDE_OUT_BOTTOM_PRESET: AnimationPreset = {
    name: 'slide_out_bottom',
    type: AnimationType.SLIDE_OUT,
    config: {
        duration: 300,
        easing: EasingType.EASE_IN,
        options: {
            direction: SlideDirection.DOWN,
            distance: 50
        }
    },
    description: 'Slide out to bottom with ease in'
};

/**
 * Pulse preset - brief scale effect for attention.
 */
export const PULSE_PRESET: AnimationPreset = {
    name: 'pulse',
    type: AnimationType.PULSE,
    config: {
        duration: 600,
        easing: EasingType.EASE_IN_OUT,
        options: {
            repeat: 1
        }
    },
    description: 'Brief pulse effect to draw attention'
};

/**
 * Shake preset - horizontal shake for error feedback.
 */
export const SHAKE_PRESET: AnimationPreset = {
    name: 'shake',
    type: AnimationType.SHAKE,
    config: {
        duration: 500,
        easing: EasingType.EASE_IN_OUT,
        options: {
            repeat: 3
        }
    },
    description: 'Horizontal shake for error or invalid action feedback'
};

/**
 * Bounce in preset - bouncy entrance effect.
 */
export const BOUNCE_IN_PRESET: AnimationPreset = {
    name: 'bounce_in',
    type: AnimationType.GROW_IN,
    config: {
        duration: 600,
        easing: EasingType.BOUNCE
    },
    description: 'Bouncy scale in effect for playful entrance'
};

/**
 * Highlight preset - brief color flash for feedback.
 */
export const HIGHLIGHT_PRESET: AnimationPreset = {
    name: 'highlight',
    type: AnimationType.HIGHLIGHT,
    config: {
        duration: 800,
        easing: EasingType.EASE_IN_OUT,
        options: {
            color: '#fbbf24' // Tailwind amber-400
        }
    },
    description: 'Brief highlight flash for feedback'
};

/**
 * Node creation preset - fade in + grow in combination.
 */
export const NODE_CREATE_PRESET: AnimationPreset = {
    name: 'node_create',
    type: AnimationType.GROW_IN,
    config: {
        duration: 400,
        easing: EasingType.EASE_OUT
    },
    description: 'Combined fade and grow for node creation'
};

/**
 * Node deletion preset - shrink out + fade out combination.
 */
export const NODE_DELETE_PRESET: AnimationPreset = {
    name: 'node_delete',
    type: AnimationType.SHRINK_OUT,
    config: {
        duration: 300,
        easing: EasingType.EASE_IN
    },
    description: 'Combined shrink and fade for node deletion'
};

/**
 * Pan animation preset - smooth canvas pan.
 */
export const PAN_PRESET: AnimationPreset = {
    name: 'pan',
    type: AnimationType.PAN,
    config: {
        duration: 600,
        easing: EasingType.EASE_IN_OUT
    },
    description: 'Smooth canvas pan transition'
};

/**
 * Zoom animation preset - smooth canvas zoom.
 */
export const ZOOM_PRESET: AnimationPreset = {
    name: 'zoom',
    type: AnimationType.ZOOM,
    config: {
        duration: 500,
        easing: EasingType.EASE_IN_OUT
    },
    description: 'Smooth canvas zoom transition'
};

/**
 * All animation presets mapped by name.
 */
export const ANIMATION_PRESETS: Record<string, AnimationPreset> = {
    fade_in: FADE_IN_PRESET,
    fade_out: FADE_OUT_PRESET,
    grow_in: GROW_IN_PRESET,
    shrink_out: SHRINK_OUT_PRESET,
    slide_in_top: SLIDE_IN_TOP_PRESET,
    slide_in_bottom: SLIDE_IN_BOTTOM_PRESET,
    slide_in_left: SLIDE_IN_LEFT_PRESET,
    slide_in_right: SLIDE_IN_RIGHT_PRESET,
    slide_out_top: SLIDE_OUT_TOP_PRESET,
    slide_out_bottom: SLIDE_OUT_BOTTOM_PRESET,
    pulse: PULSE_PRESET,
    shake: SHAKE_PRESET,
    bounce_in: BOUNCE_IN_PRESET,
    highlight: HIGHLIGHT_PRESET,
    node_create: NODE_CREATE_PRESET,
    node_delete: NODE_DELETE_PRESET,
    pan: PAN_PRESET,
    zoom: ZOOM_PRESET
};

/**
 * Get an animation preset by name.
 *
 * @param name - Preset name
 * @returns Animation preset or undefined if not found
 *
 * @example
 * ```ts
 * const preset = get_preset('fade_in');
 * if (preset) {
 *   animation_store.start(preset.type, '#element', preset.config);
 * }
 * ```
 */
export function get_preset(name: string): AnimationPreset | undefined {
    return ANIMATION_PRESETS[name];
}

/**
 * Get all available preset names.
 *
 * @returns Array of preset names
 */
export function get_preset_names(): string[] {
    return Object.keys(ANIMATION_PRESETS);
}
