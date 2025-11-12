/**
 * Swipe gesture recognizer.
 *
 * Recognizes fast directional swipe gestures.
 */

import type { GestureRecognizer, ActiveGesture, Point } from '$lib/stores/gesture.svelte';
import { GestureType } from '$lib/interactions/types';

/**
 * Minimum swipe distance (pixels).
 */
const SWIPE_MIN_DISTANCE = 50;

/**
 * Maximum swipe duration (ms).
 */
const SWIPE_MAX_DURATION = 500;

/**
 * Minimum swipe velocity (pixels/ms).
 */
const SWIPE_MIN_VELOCITY = 0.3;

/**
 * Swipe gesture recognizer.
 */
export class SwipeRecognizer implements GestureRecognizer {
    id = 'swipe';
    type = GestureType.SWIPE;

    private start_point: Point | null = null;
    private current_point: Point | null = null;
    private start_time: number = 0;
    private target: EventTarget | null = null;
    private recognized_gesture: ActiveGesture | null = null;

    /**
     * Start tracking a potential swipe gesture.
     */
    start(event: PointerEvent | TouchEvent): void {
        this.recognized_gesture = null;

        if (event instanceof PointerEvent) {
            this.start_point = { x: event.clientX, y: event.clientY };
            this.current_point = { ...this.start_point };
            this.target = event.target;
        } else if (event instanceof TouchEvent && event.touches.length === 1) {
            const touch = event.touches[0];
            this.start_point = { x: touch.clientX, y: touch.clientY };
            this.current_point = { ...this.start_point };
            this.target = event.target;
        }

        this.start_time = Date.now();
    }

    /**
     * Update gesture tracking.
     */
    update(event: PointerEvent | TouchEvent): void {
        if (!this.start_point) return;

        if (event instanceof PointerEvent) {
            this.current_point = { x: event.clientX, y: event.clientY };
        } else if (event instanceof TouchEvent && event.touches.length === 1) {
            const touch = event.touches[0];
            this.current_point = { x: touch.clientX, y: touch.clientY };
        } else {
            // Multi-touch - not a swipe
            this.start_point = null;
            this.current_point = null;
        }
    }

    /**
     * End gesture tracking.
     */
    end(): void {
        if (!this.start_point || !this.current_point) return;

        const duration = Date.now() - this.start_time;
        const delta_x = this.current_point.x - this.start_point.x;
        const delta_y = this.current_point.y - this.start_point.y;
        const distance = Math.sqrt(delta_x * delta_x + delta_y * delta_y);
        const velocity = distance / duration;

        // Check if it's a swipe
        if (
            distance >= SWIPE_MIN_DISTANCE &&
            duration <= SWIPE_MAX_DURATION &&
            velocity >= SWIPE_MIN_VELOCITY
        ) {
            // Determine direction
            const direction = this.calculate_direction(delta_x, delta_y);

            this.recognized_gesture = {
                type: GestureType.SWIPE,
                start_time: this.start_time,
                last_update: Date.now(),
                data: {
                    start_points: [this.start_point],
                    current_points: [this.current_point],
                    delta: { x: delta_x, y: delta_y },
                    velocity: { x: delta_x / duration, y: delta_y / duration },
                    direction,
                    duration,
                    target: this.target
                }
            };
        }

        // Reset
        this.start_point = null;
        this.current_point = null;
    }

    /**
     * Cancel gesture tracking.
     */
    cancel(): void {
        this.start_point = null;
        this.current_point = null;
        this.recognized_gesture = null;
    }

    /**
     * Get current gesture state if recognized.
     */
    get_gesture(): ActiveGesture | null {
        return this.recognized_gesture;
    }

    /**
     * Calculate swipe direction from delta.
     *
     * @param delta_x - Horizontal delta
     * @param delta_y - Vertical delta
     * @returns Swipe direction
     */
    private calculate_direction(
        delta_x: number,
        delta_y: number
    ): 'up' | 'down' | 'left' | 'right' {
        const abs_x = Math.abs(delta_x);
        const abs_y = Math.abs(delta_y);

        if (abs_x > abs_y) {
            // Horizontal swipe
            return delta_x > 0 ? 'right' : 'left';
        } else {
            // Vertical swipe
            return delta_y > 0 ? 'down' : 'up';
        }
    }
}

/**
 * Global swipe recognizer instance.
 */
export const swipe_recognizer = new SwipeRecognizer();
