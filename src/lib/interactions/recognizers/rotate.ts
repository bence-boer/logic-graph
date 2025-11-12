/**
 * Rotate gesture recognizer.
 *
 * Recognizes two-finger rotation gestures.
 */

import type { GestureRecognizer, ActiveGesture, Point } from '$lib/stores/gesture.svelte';
import { GestureType } from '$lib/interactions/types';

/**
 * Minimum rotation angle in degrees.
 */
const ROTATE_MIN_ANGLE = 10;

/**
 * Rotate gesture recognizer.
 */
export class RotateRecognizer implements GestureRecognizer {
    id = 'rotate';
    type = GestureType.ROTATE;

    private start_points: Point[] = [];
    private current_points: Point[] = [];
    private start_angle: number = 0;
    private start_time: number = 0;
    private target: EventTarget | null = null;
    private recognized_gesture: ActiveGesture | null = null;

    /**
     * Start tracking a potential rotate gesture.
     */
    start(event: PointerEvent | TouchEvent): void {
        this.recognized_gesture = null;

        if (event instanceof TouchEvent && event.touches.length === 2) {
            this.start_points = [
                { x: event.touches[0].clientX, y: event.touches[0].clientY },
                { x: event.touches[1].clientX, y: event.touches[1].clientY }
            ];
            this.current_points = [...this.start_points];
            this.start_angle = this.calculate_angle(this.start_points[0], this.start_points[1]);
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

            const current_angle = this.calculate_angle(
                this.current_points[0],
                this.current_points[1]
            );
            let angle_delta = current_angle - this.start_angle;

            // Normalize angle to -180 to 180
            if (angle_delta > 180) {
                angle_delta -= 360;
            } else if (angle_delta < -180) {
                angle_delta += 360;
            }

            // Check if rotation is significant enough
            if (Math.abs(angle_delta) >= ROTATE_MIN_ANGLE) {
                const duration = Date.now() - this.start_time;

                this.recognized_gesture = {
                    type: GestureType.ROTATE,
                    start_time: this.start_time,
                    last_update: Date.now(),
                    data: {
                        start_points: this.start_points,
                        current_points: this.current_points,
                        angle: angle_delta,
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
     * Calculate angle between two points in degrees.
     *
     * @param p1 - First point
     * @param p2 - Second point
     * @returns Angle in degrees (0-360)
     */
    private calculate_angle(p1: Point, p2: Point): number {
        const delta_x = p2.x - p1.x;
        const delta_y = p2.y - p1.y;
        const radians = Math.atan2(delta_y, delta_x);
        const degrees = radians * (180 / Math.PI);
        return degrees;
    }
}

/**
 * Global rotate recognizer instance.
 */
export const rotate_recognizer = new RotateRecognizer();
