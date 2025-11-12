/**
 * Long press gesture recognizer.
 *
 * Recognizes long press (press and hold) gestures.
 */

import type { GestureRecognizer, ActiveGesture, Point } from '$lib/stores/gesture.svelte';
import { GestureType } from '$lib/interactions/types';

/**
 * Minimum time for a long press gesture (ms).
 */
const LONG_PRESS_DURATION = 500;

/**
 * Maximum movement distance for a long press (pixels).
 */
const LONG_PRESS_MAX_DISTANCE = 10;

/**
 * Long press gesture recognizer.
 */
export class LongPressRecognizer implements GestureRecognizer {
    id = 'long_press';
    type = GestureType.LONG_PRESS;

    private start_point: Point | null = null;
    private start_time: number = 0;
    private target: EventTarget | null = null;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private recognized_gesture: ActiveGesture | null = null;

    /**
     * Start tracking a potential long press gesture.
     */
    start(event: PointerEvent | TouchEvent): void {
        this.recognized_gesture = null;
        this.clear_timer();

        if (event instanceof PointerEvent) {
            this.start_point = { x: event.clientX, y: event.clientY };
            this.target = event.target;
        } else if (event instanceof TouchEvent && event.touches.length === 1) {
            const touch = event.touches[0];
            this.start_point = { x: touch.clientX, y: touch.clientY };
            this.target = event.target;
        }

        this.start_time = Date.now();

        // Set timer to recognize long press
        this.timer = setTimeout(() => {
            if (this.start_point) {
                this.recognize_long_press();
            }
        }, LONG_PRESS_DURATION);
    }

    /**
     * Update gesture tracking.
     */
    update(event: PointerEvent | TouchEvent): void {
        if (!this.start_point) return;

        // Check if movement exceeds threshold
        let current_point: Point;

        if (event instanceof PointerEvent) {
            current_point = { x: event.clientX, y: event.clientY };
        } else if (event instanceof TouchEvent && event.touches.length === 1) {
            const touch = event.touches[0];
            current_point = { x: touch.clientX, y: touch.clientY };
        } else {
            // Multi-touch - not a long press
            this.clear_timer();
            this.start_point = null;
            return;
        }

        const distance = Math.sqrt(
            Math.pow(current_point.x - this.start_point.x, 2) +
                Math.pow(current_point.y - this.start_point.y, 2)
        );

        if (distance > LONG_PRESS_MAX_DISTANCE) {
            // Moved too far - not a long press
            this.clear_timer();
            this.start_point = null;
        }
    }

    /**
     * End gesture tracking.
     */
    end(): void {
        this.clear_timer();
        this.start_point = null;
    }

    /**
     * Cancel gesture tracking.
     */
    cancel(): void {
        this.clear_timer();
        this.start_point = null;
        this.recognized_gesture = null;
    }

    /**
     * Get current gesture state if recognized.
     */
    get_gesture(): ActiveGesture | null {
        return this.recognized_gesture;
    }

    /**
     * Recognize as long press.
     */
    private recognize_long_press(): void {
        if (!this.start_point) return;

        const duration = Date.now() - this.start_time;

        this.recognized_gesture = {
            type: GestureType.LONG_PRESS,
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

    /**
     * Clear the long press timer.
     */
    private clear_timer(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}

/**
 * Global long press recognizer instance.
 */
export const long_press_recognizer = new LongPressRecognizer();
