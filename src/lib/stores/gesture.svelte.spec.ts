/**
 * Gesture store tests.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gesture_store, type GestureRecognizer, type ActiveGesture } from './gesture.svelte';
import { GestureType } from '$lib/interactions/types';

describe('gesture_store', () => {
    beforeEach(() => {
        gesture_store.clear();
    });

    describe('initialization', () => {
        it('should have recognizers pre-registered', () => {
            expect(gesture_store.recognizers.length).toBeGreaterThan(0);
        });

        it('should not be tracking initially', () => {
            expect(gesture_store.is_tracking).toBe(false);
        });

        it('should not have an active gesture initially', () => {
            expect(gesture_store.active_gesture).toBeNull();
        });
    });

    describe('recognizer registration', () => {
        it('should register a recognizer', () => {
            const mock_recognizer: GestureRecognizer = {
                id: 'test',
                type: GestureType.TAP,
                start: vi.fn(),
                update: vi.fn(),
                end: vi.fn(),
                cancel: vi.fn(),
                get_gesture: vi.fn().mockReturnValue(null)
            };

            const initial_count = gesture_store.recognizers.length;
            gesture_store.register_recognizer(mock_recognizer);

            expect(gesture_store.recognizers.length).toBe(initial_count + 1);
            // Check that a recognizer with the same id exists
            const found = gesture_store.recognizers.find((r) => r.id === 'test');
            expect(found).toBeDefined();
            expect(found?.type).toBe(GestureType.TAP);
        });

        it('should unregister a recognizer', () => {
            const mock_recognizer: GestureRecognizer = {
                id: 'test_unregister',
                type: GestureType.TAP,
                start: vi.fn(),
                update: vi.fn(),
                end: vi.fn(),
                cancel: vi.fn(),
                get_gesture: vi.fn().mockReturnValue(null)
            };

            gesture_store.register_recognizer(mock_recognizer);
            const count_with = gesture_store.recognizers.length;

            gesture_store.unregister_recognizer('test_unregister');
            expect(gesture_store.recognizers.length).toBe(count_with - 1);
            expect(gesture_store.recognizers).not.toContain(mock_recognizer);
        });
    });

    describe('gesture tracking', () => {
        let mock_recognizer: GestureRecognizer;
        let mock_event: PointerEvent;

        beforeEach(() => {
            mock_recognizer = {
                id: 'mock',
                type: GestureType.TAP,
                start: vi.fn(),
                update: vi.fn(),
                end: vi.fn(),
                cancel: vi.fn(),
                get_gesture: vi.fn().mockReturnValue(null)
            };

            gesture_store.register_recognizer(mock_recognizer);

            mock_event = new PointerEvent('pointerdown', {
                clientX: 100,
                clientY: 200
            });
        });

        it('should start tracking on start event', () => {
            gesture_store.start(mock_event);

            expect(gesture_store.is_tracking).toBe(true);
            expect(mock_recognizer.start).toHaveBeenCalledWith(mock_event);
        });

        it('should update tracking on update event', () => {
            gesture_store.start(mock_event);

            const move_event = new PointerEvent('pointermove', {
                clientX: 150,
                clientY: 250
            });

            gesture_store.update(move_event);

            expect(mock_recognizer.update).toHaveBeenCalledWith(move_event);
        });

        it('should end tracking on end event', () => {
            gesture_store.start(mock_event);

            const end_event = new PointerEvent('pointerup', {
                clientX: 100,
                clientY: 200
            });

            gesture_store.end(end_event);

            expect(gesture_store.is_tracking).toBe(false);
            expect(mock_recognizer.end).toHaveBeenCalledWith(end_event);
        });

        it('should cancel tracking on cancel event', () => {
            gesture_store.start(mock_event);

            const cancel_event = new PointerEvent('pointercancel');

            gesture_store.cancel(cancel_event);

            expect(gesture_store.is_tracking).toBe(false);
            expect(gesture_store.active_gesture).toBeNull();
            expect(mock_recognizer.cancel).toHaveBeenCalledWith(cancel_event);
        });

        it('should detect gesture from recognizer', () => {
            const mock_gesture: ActiveGesture = {
                type: GestureType.TAP,
                start_time: Date.now(),
                last_update: Date.now(),
                data: {
                    start_points: [{ x: 100, y: 200 }],
                    current_points: [{ x: 100, y: 200 }],
                    delta: { x: 0, y: 0 }
                }
            };

            vi.mocked(mock_recognizer.get_gesture).mockReturnValue(mock_gesture);

            gesture_store.start(mock_event);
            gesture_store.update(mock_event);

            expect(gesture_store.active_gesture).toEqual(mock_gesture);
        });
    });

    describe('process_event', () => {
        it('should route pointerdown to start', () => {
            const start_spy = vi.spyOn(gesture_store, 'start');
            const event = new PointerEvent('pointerdown');

            gesture_store.process_event(event);

            expect(start_spy).toHaveBeenCalledWith(event);
        });

        it('should route pointermove to update', () => {
            const update_spy = vi.spyOn(gesture_store, 'update');
            const event = new PointerEvent('pointermove');

            gesture_store.process_event(event);

            expect(update_spy).toHaveBeenCalledWith(event);
        });

        it('should route pointerup to end', () => {
            const end_spy = vi.spyOn(gesture_store, 'end');
            const event = new PointerEvent('pointerup');

            gesture_store.process_event(event);

            expect(end_spy).toHaveBeenCalledWith(event);
        });

        it('should route pointercancel to cancel', () => {
            const cancel_spy = vi.spyOn(gesture_store, 'cancel');
            const event = new PointerEvent('pointercancel');

            gesture_store.process_event(event);

            expect(cancel_spy).toHaveBeenCalledWith(event);
        });
    });

    describe('clear', () => {
        it('should clear active gesture and stop tracking', () => {
            const event = new PointerEvent('pointerdown');
            gesture_store.start(event);

            gesture_store.clear();

            expect(gesture_store.active_gesture).toBeNull();
            expect(gesture_store.is_tracking).toBe(false);
        });
    });
});
