/**
 * Tap recognizer tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TapRecognizer } from './tap';
import { GestureType } from '$lib/interactions/types';

describe('TapRecognizer', () => {
    let recognizer: TapRecognizer;

    beforeEach(() => {
        recognizer = new TapRecognizer();
    });

    it('should have correct id and type', () => {
        expect(recognizer.id).toBe('tap');
        expect(recognizer.type).toBe(GestureType.TAP);
    });

    it('should recognize a tap gesture', () => {
        const start_event = new PointerEvent('pointerdown', {
            clientX: 100,
            clientY: 200
        });

        recognizer.start(start_event);
        recognizer.end();

        const gesture = recognizer.get_gesture();
        expect(gesture).not.toBeNull();
        expect(gesture?.type).toBe(GestureType.TAP);
        expect(gesture?.data.start_points?.[0]).toEqual({ x: 100, y: 200 });
    });

    it('should not recognize tap if movement too large', () => {
        const start_event = new PointerEvent('pointerdown', {
            clientX: 100,
            clientY: 200
        });

        const move_event = new PointerEvent('pointermove', {
            clientX: 200, // Moved 100 pixels (> threshold)
            clientY: 200
        });

        recognizer.start(start_event);
        recognizer.update(move_event);
        recognizer.end();

        const gesture = recognizer.get_gesture();
        expect(gesture).toBeNull();
    });

    it('should not recognize tap if duration too long', async () => {
        const start_event = new PointerEvent('pointerdown', {
            clientX: 100,
            clientY: 200
        });

        recognizer.start(start_event);

        // Wait longer than tap threshold (300ms)
        await new Promise((resolve) => setTimeout(resolve, 350));

        recognizer.end();

        const gesture = recognizer.get_gesture();
        expect(gesture).toBeNull();
    });

    it('should cancel tap on cancel event', () => {
        const start_event = new PointerEvent('pointerdown', {
            clientX: 100,
            clientY: 200
        });

        recognizer.start(start_event);
        recognizer.cancel();

        const gesture = recognizer.get_gesture();
        expect(gesture).toBeNull();
    });

    it('should handle touch events', () => {
        const touch = {
            clientX: 100,
            clientY: 200
        };
        const start_event = new TouchEvent('touchstart', {
            touches: [touch] as never
        });

        recognizer.start(start_event);
        recognizer.end();

        const gesture = recognizer.get_gesture();
        expect(gesture).not.toBeNull();
        expect(gesture?.type).toBe(GestureType.TAP);
    });

    it('should not recognize multi-touch as tap', () => {
        const touch1 = { clientX: 100, clientY: 200 };
        const touch2 = { clientX: 150, clientY: 250 };
        const start_event = new TouchEvent('touchstart', {
            touches: [touch1, touch2] as never
        });

        recognizer.start(start_event);
        recognizer.end();

        const gesture = recognizer.get_gesture();
        // Should still be null because we started with multi-touch
        expect(gesture).toBeNull();
    });
});
