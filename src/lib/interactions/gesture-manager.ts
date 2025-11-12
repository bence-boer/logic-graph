/**
 * Gesture manager.
 *
 * Coordinates gesture recognition and integrates with the interaction router.
 * Converts low-level pointer/touch events into high-level gesture events.
 */

import { gesture_store } from '$lib/stores/gesture.svelte';
import type { InteractionDefinition } from './types';
import { InteractionContext, EventMatcherType, GestureType } from './types';
import type { CommandPayload } from '$lib/commands/types';

/**
 * Gesture event data.
 */
export interface GestureEventData {
    /** Gesture type */
    type: GestureType;
    /** Starting position */
    start_x: number;
    start_y: number;
    /** Current position */
    current_x: number;
    current_y: number;
    /** Delta from start */
    delta_x: number;
    delta_y: number;
    /** Scale factor (for pinch) */
    scale?: number;
    /** Rotation angle (for rotate) */
    angle?: number;
    /** Swipe direction */
    direction?: 'up' | 'down' | 'left' | 'right';
    /** Gesture duration in ms */
    duration: number;
    /** Target element */
    target: EventTarget | null;
}

/**
 * Gesture manager class.
 *
 * Handles gesture recognition and converts gestures to interaction events.
 */
export class GestureManager {
    private listeners: Array<{ element: EventTarget; type: string; handler: EventListener }> = [];
    private gesture_handlers: Map<GestureType, (data: GestureEventData) => void> = new Map();

    /**
     * Initialize gesture tracking.
     *
     * Sets up event listeners for pointer and touch events.
     *
     * @param root - Root element to attach listeners to (default: document)
     *
     * @example
     * ```ts
     * gesture_manager.initialize(document.body);
     * ```
     */
    initialize(root: EventTarget = document): void {
        this.cleanup();

        // Use pointer events for unified touch/mouse handling
        const pointer_events = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'];

        for (const event_type of pointer_events) {
            const handler = (event: Event) => this.handle_pointer_event(event as PointerEvent);
            root.addEventListener(event_type, handler);
            this.listeners.push({ element: root, type: event_type, handler });
        }

        // Fallback to touch events for older browsers
        const touch_events = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];

        for (const event_type of touch_events) {
            const handler = (event: Event) => this.handle_touch_event(event as TouchEvent);
            root.addEventListener(event_type, handler, { passive: false });
            this.listeners.push({ element: root, type: event_type, handler });
        }
    }

    /**
     * Clean up all event listeners.
     *
     * @example
     * ```ts
     * gesture_manager.cleanup();
     * ```
     */
    cleanup(): void {
        for (const { element, type, handler } of this.listeners) {
            element.removeEventListener(type, handler);
        }
        this.listeners = [];
    }

    /**
     * Register a gesture handler.
     *
     * @param gesture_type - Type of gesture to handle
     * @param handler - Handler function
     *
     * @example
     * ```ts
     * gesture_manager.register_handler(GestureType.TAP, (data) => {
     *   console.log('Tap at', data.current_x, data.current_y);
     * });
     * ```
     */
    register_handler(gesture_type: GestureType, handler: (data: GestureEventData) => void): void {
        this.gesture_handlers.set(gesture_type, handler);
    }

    /**
     * Unregister a gesture handler.
     *
     * @param gesture_type - Type of gesture to unregister
     *
     * @example
     * ```ts
     * gesture_manager.unregister_handler(GestureType.TAP);
     * ```
     */
    unregister_handler(gesture_type: GestureType): void {
        this.gesture_handlers.delete(gesture_type);
    }

    /**
     * Handle pointer event.
     *
     * @param event - Pointer event
     */
    private handle_pointer_event(event: PointerEvent): void {
        // Process through gesture store
        gesture_store.process_event(event);

        // Check if a gesture was recognized
        const active_gesture = gesture_store.active_gesture;
        if (active_gesture && event.type === 'pointerup') {
            this.emit_gesture(active_gesture.type);
        }
    }

    /**
     * Handle touch event.
     *
     * @param event - Touch event
     */
    private handle_touch_event(event: TouchEvent): void {
        // Process through gesture store
        gesture_store.process_event(event);

        // Check if a gesture was recognized
        const active_gesture = gesture_store.active_gesture;
        if (active_gesture && event.type === 'touchend') {
            this.emit_gesture(active_gesture.type);
        }
    }

    /**
     * Emit a recognized gesture.
     *
     * @param gesture_type - Type of gesture
     */
    private emit_gesture(gesture_type: GestureType): void {
        const active_gesture = gesture_store.active_gesture;
        if (!active_gesture) return;

        const gesture_data: GestureEventData = {
            type: gesture_type,
            start_x: active_gesture.data.start_points?.[0]?.x || 0,
            start_y: active_gesture.data.start_points?.[0]?.y || 0,
            current_x: active_gesture.data.current_points?.[0]?.x || 0,
            current_y: active_gesture.data.current_points?.[0]?.y || 0,
            delta_x: active_gesture.data.delta?.x || 0,
            delta_y: active_gesture.data.delta?.y || 0,
            scale: active_gesture.data.scale,
            angle: active_gesture.data.angle,
            direction: active_gesture.data.direction,
            duration: active_gesture.last_update - active_gesture.start_time,
            target: active_gesture.data.target || null
        };

        // Call registered handler
        const handler = this.gesture_handlers.get(gesture_type);
        if (handler) {
            handler(gesture_data);
        }

        // Clear gesture after emission
        gesture_store.clear();
    }

    /**
     * Create an interaction definition for a gesture.
     *
     * Helper method to create gesture-based interactions.
     *
     * @param id - Interaction ID
     * @param gesture_type - Gesture type
     * @param command - Command to execute
     * @param contexts - Interaction contexts
     * @param payload_mapper - Optional payload mapper
     * @returns Interaction definition
     *
     * @example
     * ```ts
     * const tap_interaction = gesture_manager.create_gesture_interaction(
     *   'canvas.tap.deselect',
     *   GestureType.TAP,
     *   'selection.clear',
     *   [InteractionContext.CANVAS]
     * );
     * ```
     */
    create_gesture_interaction(
        id: string,
        gesture_type: GestureType,
        command: string,
        contexts: InteractionContext[],
        payload_mapper?: (data: GestureEventData) => CommandPayload
    ): InteractionDefinition<Event> {
        return {
            id,
            contexts,
            matcher: {
                type: EventMatcherType.GESTURE,
                gesture: gesture_type
            },
            command,
            payload_mapper: payload_mapper
                ? (event: Event) => payload_mapper(event as unknown as GestureEventData)
                : undefined
        };
    }
}

/**
 * Global gesture manager instance.
 */
export const gesture_manager = new GestureManager();
