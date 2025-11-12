/**
 * Transition utilities for animating CSS properties.
 *
 * Provides helper functions for creating smooth property transitions on DOM elements.
 *
 * @module utils/animations/transitions
 */

import type { TransitionSpec, TransitionProperty, EasingFunction } from '$lib/types/animations';
import { EasingType } from '$lib/types/animations';
import { get_easing_function } from './easing';

/**
 * Parse a numeric value from a CSS property string.
 *
 * @param value - CSS property value (e.g., "10px", "0.5", "100%")
 * @returns Numeric value
 *
 * @example
 * ```ts
 * parse_numeric_value("10px"); // Returns 10
 * parse_numeric_value("0.5"); // Returns 0.5
 * ```
 */
function parse_numeric_value(value: string | number): number {
    if (typeof value === 'number') return value;
    return parseFloat(value);
}

/**
 * Format a numeric value with unit.
 *
 * @param value - Numeric value
 * @param unit - CSS unit (px, %, em, etc.)
 * @returns Formatted CSS value string
 *
 * @example
 * ```ts
 * format_value(10, "px"); // Returns "10px"
 * format_value(0.5, ""); // Returns "0.5"
 * ```
 */
function format_value(value: number, unit?: string): string {
    if (!unit) return value.toString();
    return `${value}${unit}`;
}

/**
 * Apply a transition to a DOM element property.
 *
 * @param element - Target DOM element
 * @param spec - Transition specification
 * @param progress - Animation progress (0-1)
 * @param easing - Easing function or type
 *
 * @example
 * ```ts
 * const spec = {
 *   property: TransitionProperty.OPACITY,
 *   from: 0,
 *   to: 1,
 * };
 * apply_transition(element, spec, 0.5, EasingType.EASE_OUT);
 * ```
 */
export function apply_transition(
    element: HTMLElement | SVGElement,
    spec: TransitionSpec,
    progress: number,
    easing: EasingType | EasingFunction = EasingType.LINEAR
): void {
    const easing_fn = typeof easing === 'function' ? easing : get_easing_function(easing);
    const eased_progress = easing_fn(progress);

    const from = parse_numeric_value(spec.from);
    const to = parse_numeric_value(spec.to);
    const current = from + (to - from) * eased_progress;

    const value = format_value(current, spec.unit);

    // Apply based on property type
    switch (spec.property) {
        case 'opacity':
            element.style.opacity = value;
            break;
        case 'transform':
            element.style.transform = value;
            break;
        case 'scale':
            element.style.transform = `scale(${value})`;
            break;
        case 'translateX':
            element.style.transform = `translateX(${value})`;
            break;
        case 'translateY':
            element.style.transform = `translateY(${value})`;
            break;
        case 'backgroundColor':
            element.style.backgroundColor = value;
            break;
        case 'borderColor':
            element.style.borderColor = value;
            break;
        case 'color':
            element.style.color = value;
            break;
        case 'width':
            element.style.width = value;
            break;
        case 'height':
            element.style.height = value;
            break;
    }
}

/**
 * Create an opacity transition specification.
 *
 * @param from - Start opacity (0-1)
 * @param to - End opacity (0-1)
 * @returns Transition spec
 *
 * @example
 * ```ts
 * const fade_in_spec = opacity_transition(0, 1);
 * const fade_out_spec = opacity_transition(1, 0);
 * ```
 */
export function opacity_transition(from: number, to: number): TransitionSpec {
    return {
        property: 'opacity' as TransitionProperty,
        from,
        to
    };
}

/**
 * Create a scale transition specification.
 *
 * @param from - Start scale
 * @param to - End scale
 * @returns Transition spec
 *
 * @example
 * ```ts
 * const grow_spec = scale_transition(0, 1);
 * const shrink_spec = scale_transition(1, 0);
 * ```
 */
export function scale_transition(from: number, to: number): TransitionSpec {
    return {
        property: 'scale' as TransitionProperty,
        from,
        to
    };
}

/**
 * Create a translateX transition specification.
 *
 * @param from - Start X position
 * @param to - End X position
 * @param unit - CSS unit (default: 'px')
 * @returns Transition spec
 *
 * @example
 * ```ts
 * const slide_right_spec = translate_x_transition(-100, 0);
 * ```
 */
export function translate_x_transition(from: number, to: number, unit = 'px'): TransitionSpec {
    return {
        property: 'translateX' as TransitionProperty,
        from,
        to,
        unit
    };
}

/**
 * Create a translateY transition specification.
 *
 * @param from - Start Y position
 * @param to - End Y position
 * @param unit - CSS unit (default: 'px')
 * @returns Transition spec
 *
 * @example
 * ```ts
 * const slide_down_spec = translate_y_transition(-100, 0);
 * ```
 */
export function translate_y_transition(from: number, to: number, unit = 'px'): TransitionSpec {
    return {
        property: 'translateY' as TransitionProperty,
        from,
        to,
        unit
    };
}

/**
 * Create a width transition specification.
 *
 * @param from - Start width
 * @param to - End width
 * @param unit - CSS unit (default: 'px')
 * @returns Transition spec
 */
export function width_transition(from: number, to: number, unit = 'px'): TransitionSpec {
    return {
        property: 'width' as TransitionProperty,
        from,
        to,
        unit
    };
}

/**
 * Create a height transition specification.
 *
 * @param from - Start height
 * @param to - End height
 * @param unit - CSS unit (default: 'px')
 * @returns Transition spec
 */
export function height_transition(from: number, to: number, unit = 'px'): TransitionSpec {
    return {
        property: 'height' as TransitionProperty,
        from,
        to,
        unit
    };
}

/**
 * Animate a DOM element through a sequence of transitions.
 *
 * @param element - Target DOM element
 * @param transitions - Array of transition specs to apply simultaneously
 * @param duration - Animation duration in milliseconds
 * @param easing - Easing function or type
 * @returns Promise that resolves when animation completes
 *
 * @example
 * ```ts
 * await animate_element(
 *   element,
 *   [
 *     opacity_transition(0, 1),
 *     scale_transition(0.8, 1)
 *   ],
 *   300,
 *   EasingType.EASE_OUT
 * );
 * ```
 */
export function animate_element(
    element: HTMLElement | SVGElement,
    transitions: TransitionSpec[],
    duration: number,
    easing: EasingType | EasingFunction = EasingType.LINEAR
): Promise<void> {
    return new Promise((resolve) => {
        const start_time = Date.now();

        const animate = () => {
            const elapsed = Date.now() - start_time;
            const progress = Math.min(elapsed / duration, 1);

            // Apply all transitions
            transitions.forEach((spec) => {
                apply_transition(element, spec, progress, easing);
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        };

        requestAnimationFrame(animate);
    });
}

/**
 * Fade in an element.
 *
 * @param element - Target element
 * @param duration - Duration in milliseconds
 * @param easing - Easing function or type
 * @returns Promise that resolves when complete
 *
 * @example
 * ```ts
 * await fade_in(element, 300);
 * ```
 */
export function fade_in(
    element: HTMLElement | SVGElement,
    duration = 300,
    easing: EasingType | EasingFunction = EasingType.EASE_OUT
): Promise<void> {
    return animate_element(element, [opacity_transition(0, 1)], duration, easing);
}

/**
 * Fade out an element.
 *
 * @param element - Target element
 * @param duration - Duration in milliseconds
 * @param easing - Easing function or type
 * @returns Promise that resolves when complete
 *
 * @example
 * ```ts
 * await fade_out(element, 300);
 * ```
 */
export function fade_out(
    element: HTMLElement | SVGElement,
    duration = 300,
    easing: EasingType | EasingFunction = EasingType.EASE_IN
): Promise<void> {
    return animate_element(element, [opacity_transition(1, 0)], duration, easing);
}

/**
 * Scale in an element (grow from 0 to full size).
 *
 * @param element - Target element
 * @param duration - Duration in milliseconds
 * @param easing - Easing function or type
 * @returns Promise that resolves when complete
 *
 * @example
 * ```ts
 * await scale_in(element, 300, EasingType.BOUNCE);
 * ```
 */
export function scale_in(
    element: HTMLElement | SVGElement,
    duration = 300,
    easing: EasingType | EasingFunction = EasingType.EASE_OUT
): Promise<void> {
    return animate_element(element, [scale_transition(0, 1)], duration, easing);
}

/**
 * Scale out an element (shrink to 0).
 *
 * @param element - Target element
 * @param duration - Duration in milliseconds
 * @param easing - Easing function or type
 * @returns Promise that resolves when complete
 *
 * @example
 * ```ts
 * await scale_out(element, 300);
 * ```
 */
export function scale_out(
    element: HTMLElement | SVGElement,
    duration = 300,
    easing: EasingType | EasingFunction = EasingType.EASE_IN
): Promise<void> {
    return animate_element(element, [scale_transition(1, 0)], duration, easing);
}
