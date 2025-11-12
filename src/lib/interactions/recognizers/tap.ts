/**
 * Tap gesture recognizer.
 *
 * Recognizes single tap/click gestures.
 */

import type { GestureRecognizer, ActiveGesture, Point } from '$lib/stores/gesture.svelte';
import { GestureType } from '$lib/interactions/types';

/**
 * Maximum time for a tap gesture (ms).
 */
const TAP_MAX_DURATION = 300;

/**
 * Maximum movement distance for a tap (pixels).
 */
const TAP_MAX_DISTANCE = 10;

/**
 * Tap gesture recognizer.
 */
export class TapRecognizer implements GestureRecognizer {
    id = 'tap';
    type = GestureType.TAP;

    private start_point: Point | null = null;
    private start_time: number = 0;
    private target: EventTarget | null = null;
    private recognized_gesture: ActiveGesture | null = null;

    /**
     * Start tracking a potential tap gesture.
     */
    start(event: PointerEvent | TouchEvent): void {
        this.recognized_gesture = null;

        if (event instanceof PointerEvent) {
            this.start_point = { x: event.clientX, y: event.clientY };
            this.target = event.target;
        } else if (event instanceof TouchEvent && event.touches.length === 1) {
            const touch = event.touches[0];
            this.start_point = { x: touch.clientX, y: touch.clientY };
            this.target = event.target;
        }

        this.start_time = Date.now();
    }

    /**
     * Update gesture tracking.
     */
    update(event: PointerEvent | TouchEvent): void {
        if (!this.start_point) return;

        // Check if movement exceeds tap threshold
        let current_point: Point;

        if (event instanceof PointerEvent) {
            current_point = { x: event.clientX, y: event.clientY };
        } else if (event instanceof TouchEvent && event.touches.length === 1) {
            const touch = event.touches[0];
            current_point = { x: touch.clientX, y: touch.clientY };
        } else {
            // Multi-touch - not a tap
            this.start_point = null;
            return;
        }

        const distance = Math.sqrt(
            Math.pow(current_point.x - this.start_point.x, 2) +
                Math.pow(current_point.y - this.start_point.y, 2)
        );

        if (distance > TAP_MAX_DISTANCE) {
            // Moved too far - not a tap
            this.start_point = null;
        }
    }

    /**
     * End gesture tracking.
     */
    end(): void {
        if (!this.start_point) return;

        const duration = Date.now() - this.start_time;

        // Check if duration is within tap threshold
        if (duration <= TAP_MAX_DURATION) {
            // Recognized as tap
            this.recognized_gesture = {
                type: GestureType.TAP,
                start_time: this.start_time,
                last_update: Date.now(),
                data: {
                    start_points: [this.start_point],
                    current_points: [this.start_point],
                    delta: { x: 0, y: 0 },
                    duration,
                    target: this.target
                }
            };
        }

        // Reset
        this.start_point = null;
    }

    /**
     * Cancel gesture tracking.
     */
    cancel(): void {
        this.start_point = null;
        this.recognized_gesture = null;
    }

    /**
     * Get current gesture state if recognized.
     */
    get_gesture(): ActiveGesture | null {
        return this.recognized_gesture;
    }
}

/**
 * Global tap recognizer instance.
 */
export const tap_recognizer = new TapRecognizer();
