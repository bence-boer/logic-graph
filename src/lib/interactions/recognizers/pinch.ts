/**
 * Pinch gesture recognizer.
 *
 * Recognizes two-finger pinch (zoom) gestures.
 */

import type { GestureRecognizer, ActiveGesture, Point } from '$lib/stores/gesture.svelte';
import { GestureType } from '$lib/interactions/types';

/**
 * Minimum scale change to recognize as pinch.
 */
const PINCH_MIN_SCALE_CHANGE = 0.1;

/**
 * Pinch gesture recognizer.
 */
export class PinchRecognizer implements GestureRecognizer {
    id = 'pinch';
    type = GestureType.PINCH;

    private start_points: Point[] = [];
    private current_points: Point[] = [];
    private start_distance: number = 0;
    private start_time: number = 0;
    private target: EventTarget | null = null;
    private recognized_gesture: ActiveGesture | null = null;

    /**
     * Start tracking a potential pinch gesture.
     */
    start(event: PointerEvent | TouchEvent): void {
        this.recognized_gesture = null;

        if (event instanceof TouchEvent && event.touches.length === 2) {
            this.start_points = [
                { x: event.touches[0].clientX, y: event.touches[0].clientY },
                { x: event.touches[1].clientX, y: event.touches[1].clientY }
            ];
            this.current_points = [...this.start_points];
            this.start_distance = this.calculate_distance(
                this.start_points[0],
                this.start_points[1]
            );
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

            const current_distance = this.calculate_distance(
                this.current_points[0],
                this.current_points[1]
            );
            const scale = current_distance / this.start_distance;

            // Check if scale changed enough to be a pinch
            if (Math.abs(scale - 1.0) >= PINCH_MIN_SCALE_CHANGE) {
                const duration = Date.now() - this.start_time;

                this.recognized_gesture = {
                    type: GestureType.PINCH,
                    start_time: this.start_time,
                    last_update: Date.now(),
                    data: {
                        start_points: this.start_points,
                        current_points: this.current_points,
                        distance: current_distance,
                        scale,
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
     * Calculate distance between two points.
     *
     * @param p1 - First point
     * @param p2 - Second point
     * @returns Distance in pixels
     */
    private calculate_distance(p1: Point, p2: Point): number {
        const delta_x = p2.x - p1.x;
        const delta_y = p2.y - p1.y;
        return Math.sqrt(delta_x * delta_x + delta_y * delta_y);
    }
}

/**
 * Global pinch recognizer instance.
 */
export const pinch_recognizer = new PinchRecognizer();
