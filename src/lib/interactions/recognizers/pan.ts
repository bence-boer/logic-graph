/**
 * Pan gesture recognizer.
 *
 * Recognizes two-finger pan/drag gestures.
 */

import type { GestureRecognizer, ActiveGesture, Point } from '$lib/stores/gesture.svelte';
import { GestureType } from '$lib/interactions/types';

/**
 * Minimum pan distance (pixels).
 */
const PAN_MIN_DISTANCE = 10;

/**
 * Pan gesture recognizer.
 */
export class PanRecognizer implements GestureRecognizer {
    id = 'pan';
    type = GestureType.PAN;

    private start_points: Point[] = [];
    private current_points: Point[] = [];
    private start_time: number = 0;
    private target: EventTarget | null = null;
    private recognized_gesture: ActiveGesture | null = null;

    /**
     * Start tracking a potential pan gesture.
     */
    start(event: PointerEvent | TouchEvent): void {
        this.recognized_gesture = null;

        if (event instanceof TouchEvent && event.touches.length === 2) {
            this.start_points = [
                { x: event.touches[0].clientX, y: event.touches[0].clientY },
                { x: event.touches[1].clientX, y: event.touches[1].clientY }
            ];
            this.current_points = [...this.start_points];
            this.start_time = Date.now();
            this.target = event.target;
        } else {
            // Not a two-finger touch
            this.start_points = [];
            this.current_points = [];
        }
    }

    /**
     * Update gesture tracking.
     */
    update(event: PointerEvent | TouchEvent): void {
        if (this.start_points.length !== 2) return;

        if (event instanceof TouchEvent && event.touches.length === 2) {
            this.current_points = [
                { x: event.touches[0].clientX, y: event.touches[0].clientY },
                { x: event.touches[1].clientX, y: event.touches[1].clientY }
            ];

            // Calculate center point movement
            const start_center = this.calculate_center(this.start_points);
            const current_center = this.calculate_center(this.current_points);

            const delta_x = current_center.x - start_center.x;
            const delta_y = current_center.y - start_center.y;
            const distance = Math.sqrt(delta_x * delta_x + delta_y * delta_y);

            // Check if movement is enough to be a pan
            if (distance >= PAN_MIN_DISTANCE) {
                const duration = Date.now() - this.start_time;

                this.recognized_gesture = {
                    type: GestureType.PAN,
                    start_time: this.start_time,
                    last_update: Date.now(),
                    data: {
                        start_points: [start_center],
                        current_points: [current_center],
                        delta: { x: delta_x, y: delta_y },
                        velocity: { x: delta_x / duration, y: delta_y / duration },
                        duration,
                        target: this.target
                    }
                };
            }
        } else {
            // Lost second finger
            this.start_points = [];
            this.current_points = [];
            this.recognized_gesture = null;
        }
    }

    /**
     * End gesture tracking.
     */
    end(): void {
        this.start_points = [];
        this.current_points = [];
    }

    /**
     * Cancel gesture tracking.
     */
    cancel(): void {
        this.start_points = [];
        this.current_points = [];
        this.recognized_gesture = null;
    }

    /**
     * Get current gesture state if recognized.
     */
    get_gesture(): ActiveGesture | null {
        return this.recognized_gesture;
    }

    /**
     * Calculate center point of two points.
     *
     * @param points - Array of two points
     * @returns Center point
     */
    private calculate_center(points: Point[]): Point {
        return {
            x: (points[0].x + points[1].x) / 2,
            y: (points[0].y + points[1].y) / 2
        };
    }
}

/**
 * Global pan recognizer instance.
 */
export const pan_recognizer = new PanRecognizer();
