/**
 * Easing functions for animation interpolation.
 *
 * Provides standard easing functions that control the rate of change during animations.
 * All functions take a normalized time value (0-1) and return an eased value.
 *
 * @module utils/animations/easing
 */

import type { EasingFunction } from '$lib/types/animations';
import { EasingType } from '$lib/types/animations';

/**
 * Linear easing (no acceleration).
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value (0-1)
 *
 * @example
 * ```ts
 * const value = linear(0.5); // Returns 0.5
 * ```
 */
export function linear(t: number): number {
    return t;
}

/**
 * Ease in (slow start, accelerating).
 *
 * Uses quadratic easing for smooth acceleration.
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value (0-1)
 *
 * @example
 * ```ts
 * const value = ease_in(0.5); // Returns 0.25
 * ```
 */
export function ease_in(t: number): number {
    return t * t;
}

/**
 * Ease out (fast start, decelerating).
 *
 * Uses quadratic easing for smooth deceleration.
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value (0-1)
 *
 * @example
 * ```ts
 * const value = ease_out(0.5); // Returns 0.75
 * ```
 */
export function ease_out(t: number): number {
    return t * (2 - t);
}

/**
 * Ease in-out (slow start and end, fast middle).
 *
 * Uses cubic easing for smooth acceleration and deceleration.
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value (0-1)
 *
 * @example
 * ```ts
 * const value = ease_in_out(0.5); // Returns 0.5
 * ```
 */
export function ease_in_out(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Cubic ease in (very slow start).
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value (0-1)
 */
export function ease_in_cubic(t: number): number {
    return t * t * t;
}

/**
 * Cubic ease out (very slow end).
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value (0-1)
 */
export function ease_out_cubic(t: number): number {
    return 1 + --t * t * t;
}

/**
 * Cubic ease in-out.
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value (0-1)
 */
export function ease_in_out_cubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

/**
 * Quartic ease in (extremely slow start).
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value (0-1)
 */
export function ease_in_quart(t: number): number {
    return t * t * t * t;
}

/**
 * Quartic ease out (extremely slow end).
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value (0-1)
 */
export function ease_out_quart(t: number): number {
    return 1 - --t * t * t * t;
}

/**
 * Quartic ease in-out.
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value (0-1)
 */
export function ease_in_out_quart(t: number): number {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
}

/**
 * Bounce easing (bounces at the end).
 *
 * Creates a bouncing effect at the end of the animation.
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value (can exceed 1 during bounce)
 *
 * @example
 * ```ts
 * const value = bounce(0.9); // Returns value > 1 (mid-bounce)
 * ```
 */
export function bounce(t: number): number {
    if (t < 1 / 2.75) {
        return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
}

/**
 * Elastic easing (spring-like oscillation).
 *
 * Creates an elastic/spring effect with oscillation.
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value (can exceed 0-1 range during oscillation)
 *
 * @example
 * ```ts
 * const value = elastic(0.8); // Returns value with oscillation
 * ```
 */
export function elastic(t: number): number {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
}

/**
 * Elastic in easing (oscillation at start).
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value (can be negative during oscillation)
 */
export function elastic_in(t: number): number {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return -(Math.pow(2, 10 * (t - 1)) * Math.sin(((t - 1 - s) * (2 * Math.PI)) / p));
}

/**
 * Elastic out easing (oscillation at end).
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value (can exceed 1 during oscillation)
 */
export function elastic_out(t: number): number {
    return elastic(t);
}

/**
 * Back in easing (pulls back before moving forward).
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value (can be negative at start)
 */
export function back_in(t: number): number {
    const s = 1.70158;
    return t * t * ((s + 1) * t - s);
}

/**
 * Back out easing (overshoots and pulls back).
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value (can exceed 1 then pull back)
 */
export function back_out(t: number): number {
    const s = 1.70158;
    return --t * t * ((s + 1) * t + s) + 1;
}

/**
 * Back in-out easing.
 *
 * @param t - Normalized time (0-1)
 * @returns Eased value
 */
export function back_in_out(t: number): number {
    const s = 1.70158 * 1.525;
    if ((t *= 2) < 1) {
        return 0.5 * (t * t * ((s + 1) * t - s));
    }
    return 0.5 * ((t -= 2) * t * ((s + 1) * t + s) + 2);
}

/**
 * Get an easing function by type.
 *
 * @param type - Easing type enum value
 * @returns Corresponding easing function
 *
 * @example
 * ```ts
 * const easer = get_easing_function(EasingType.EASE_IN_OUT);
 * const value = easer(0.5);
 * ```
 */
export function get_easing_function(type: EasingType): EasingFunction {
    switch (type) {
        case EasingType.LINEAR:
            return linear;
        case EasingType.EASE_IN:
            return ease_in;
        case EasingType.EASE_OUT:
            return ease_out;
        case EasingType.EASE_IN_OUT:
            return ease_in_out;
        case EasingType.BOUNCE:
            return bounce;
        case EasingType.ELASTIC:
            return elastic;
        default:
            return linear;
    }
}

/**
 * Apply easing to a value transition.
 *
 * @param from - Start value
 * @param to - End value
 * @param progress - Normalized time (0-1)
 * @param easing - Easing function or type
 * @returns Interpolated value
 *
 * @example
 * ```ts
 * const value = apply_easing(0, 100, 0.5, EasingType.EASE_OUT);
 * // Returns 75 (eased halfway point)
 * ```
 */
export function apply_easing(
    from: number,
    to: number,
    progress: number,
    easing: EasingType | EasingFunction
): number {
    const easing_fn = typeof easing === 'function' ? easing : get_easing_function(easing);
    const eased_progress = easing_fn(progress);
    return from + (to - from) * eased_progress;
}
