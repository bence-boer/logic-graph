/**
 * Gesture recognition store.
 *
 * Manages gesture state and coordinates gesture recognizers for unified
 * touch and pointer event handling.
 */

import type { GestureType } from '$lib/interactions/types';
import {
    tap_recognizer,
    long_press_recognizer,
    swipe_recognizer,
    pinch_recognizer,
    pan_recognizer,
    rotate_recognizer
} from '$lib/interactions/recognizers';

/**
 * Point with x/y coordinates.
 */
export interface Point {
    x: number;
    y: number;
}

/**
 * Gesture data that varies by type.
 */
export type GestureData = {
    /** Starting point(s) of gesture */
    start_points?: Point[];
    /** Current point(s) of gesture */
    current_points?: Point[];
    /** Delta from start */
    delta?: Point;
    /** Distance between two points (for pinch) */
    distance?: number;
    /** Scale factor (for pinch) */
    scale?: number;
    /** Rotation angle in degrees (for rotate) */
    angle?: number;
    /** Velocity of movement */
    velocity?: Point;
    /** Direction of swipe */
    direction?: 'up' | 'down' | 'left' | 'right';
    /** Duration in milliseconds */
    duration?: number;
    /** Target element */
    target?: EventTarget | null;
};

/**
 * Active gesture information.
 */
export interface ActiveGesture {
    /** Type of gesture */
    type: GestureType;
    /** Start timestamp */
    start_time: number;
    /** Last update timestamp */
    last_update: number;
    /** Gesture-specific data */
    data: GestureData;
}

/**
 * Gesture recognizer interface.
 */
export interface GestureRecognizer {
    /** Unique recognizer ID */
    id: string;
    /** Gesture type this recognizer handles */
    type: GestureType;
    /** Start tracking a potential gesture */
    start(event: PointerEvent | TouchEvent): void;
    /** Update gesture tracking */
    update(event: PointerEvent | TouchEvent): void;
    /** End gesture tracking */
    end(event: PointerEvent | TouchEvent): void;
    /** Cancel gesture tracking */
    cancel(event: PointerEvent | TouchEvent): void;
    /** Get current gesture state if recognized */
    get_gesture(): ActiveGesture | null;
}

/**
 * Gesture store for unified gesture recognition.
 */
export const gesture_store = (() => {
    let _active_gesture = $state<ActiveGesture | null>(null);
    let _recognizers = $state<GestureRecognizer[]>([
        tap_recognizer,
        long_press_recognizer,
        swipe_recognizer,
        pinch_recognizer,
        pan_recognizer,
        rotate_recognizer
    ]);
    let _is_tracking = $state(false);

    return {
        /**
         * Current active gesture (if any).
         */
        get active_gesture() {
            return _active_gesture;
        },

        /**
         * Whether gesture tracking is active.
         */
        get is_tracking() {
            return _is_tracking;
        },

        /**
         * Registered gesture recognizers.
         */
        get recognizers() {
            return _recognizers;
        },

        /**
         * Register a gesture recognizer.
         *
         * @param recognizer - Gesture recognizer to register
         *
         * @example
         * ```ts
         * gesture_store.register_recognizer(tap_recognizer);
         * ```
         */
        register_recognizer(recognizer: GestureRecognizer): void {
            _recognizers.push(recognizer);
        },

        /**
         * Unregister a gesture recognizer.
         *
         * @param id - Recognizer ID to remove
         *
         * @example
         * ```ts
         * gesture_store.unregister_recognizer('tap');
         * ```
         */
        unregister_recognizer(id: string): void {
            _recognizers = _recognizers.filter((r) => r.id !== id);
        },

        /**
         * Start gesture tracking.
         *
         * @param event - Pointer or touch event
         *
         * @example
         * ```ts
         * gesture_store.start(pointerdown_event);
         * ```
         */
        start(event: PointerEvent | TouchEvent): void {
            _is_tracking = true;
            _active_gesture = null;

            // Notify all recognizers
            for (const recognizer of _recognizers) {
                recognizer.start(event);
            }
        },

        /**
         * Update gesture tracking.
         *
         * @param event - Pointer or touch event
         *
         * @example
         * ```ts
         * gesture_store.update(pointermove_event);
         * ```
         */
        update(event: PointerEvent | TouchEvent): void {
            if (!_is_tracking) return;

            // Notify all recognizers
            for (const recognizer of _recognizers) {
                recognizer.update(event);

                // Check if recognizer detected a gesture
                const gesture = recognizer.get_gesture();
                if (gesture) {
                    _active_gesture = gesture;
                }
            }
        },

        /**
         * End gesture tracking.
         *
         * @param event - Pointer or touch event
         *
         * @example
         * ```ts
         * gesture_store.end(pointerup_event);
         * ```
         */
        end(event: PointerEvent | TouchEvent): void {
            if (!_is_tracking) return;

            // Notify all recognizers
            for (const recognizer of _recognizers) {
                recognizer.end(event);

                // Check for final gesture state
                const gesture = recognizer.get_gesture();
                if (gesture) {
                    _active_gesture = gesture;
                }
            }

            _is_tracking = false;
        },

        /**
         * Cancel gesture tracking.
         *
         * @param event - Pointer or touch event
         *
         * @example
         * ```ts
         * gesture_store.cancel(pointercancel_event);
         * ```
         */
        cancel(event: PointerEvent | TouchEvent): void {
            if (!_is_tracking) return;

            // Notify all recognizers
            for (const recognizer of _recognizers) {
                recognizer.cancel(event);
            }

            _active_gesture = null;
            _is_tracking = false;
        },

        /**
         * Clear active gesture.
         *
         * @example
         * ```ts
         * gesture_store.clear();
         * ```
         */
        clear(): void {
            _active_gesture = null;
            _is_tracking = false;
        },

        /**
         * Process a pointer/touch event.
         *
         * Convenience method that routes to appropriate handler based on event type.
         *
         * @param event - Pointer or touch event
         *
         * @example
         * ```ts
         * gesture_store.process_event(event);
         * ```
         */
        process_event(event: PointerEvent | TouchEvent): void {
            const event_type = event.type;

            if (event_type === 'pointerdown' || event_type === 'touchstart') {
                this.start(event);
            } else if (event_type === 'pointermove' || event_type === 'touchmove') {
                this.update(event);
            } else if (event_type === 'pointerup' || event_type === 'touchend') {
                this.end(event);
            } else if (event_type === 'pointercancel' || event_type === 'touchcancel') {
                this.cancel(event);
            }
        }
    };
})();
