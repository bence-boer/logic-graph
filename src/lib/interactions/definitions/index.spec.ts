/**
 * Interaction definitions tests.
 *
 * Tests for interaction definitions.
 */

import { describe, it, expect } from 'vitest';
import {
    canvas_interactions,
    keyboard_interactions,
    gesture_interactions,
    form_interactions,
    all_interactions
} from '../index';

describe('Interaction Definitions', () => {
    describe('canvas_interactions', () => {
        it('should be an array', () => {
            expect(Array.isArray(canvas_interactions)).toBe(true);
        });

        it('should have interactions with required properties', () => {
            for (const interaction of canvas_interactions) {
                expect(interaction).toHaveProperty('id');
                expect(interaction).toHaveProperty('contexts');
                expect(interaction).toHaveProperty('matcher');
                expect(interaction).toHaveProperty('command');
                expect(typeof interaction.id).toBe('string');
                expect(Array.isArray(interaction.contexts)).toBe(true);
                expect(typeof interaction.command).toBe('string');
            }
        });

        it('should include click to deselect interaction', () => {
            const deselect = canvas_interactions.find((i) => i.id === 'canvas.click.deselect');
            expect(deselect).toBeDefined();
            expect(deselect?.command).toBe('selection.clear');
        });

        it('should include node click to select interaction', () => {
            const select = canvas_interactions.find((i) => i.id === 'canvas.node.click.select');
            expect(select).toBeDefined();
            expect(select?.command).toBe('selection.set');
        });

        it('should include node double click to toggle pin interaction', () => {
            const toggle_pin = canvas_interactions.find(
                (i) => i.id === 'canvas.node.double_click.toggle_pin'
            );
            expect(toggle_pin).toBeDefined();
            expect(toggle_pin?.command).toBe('graph.node.pin');
        });
    });

    describe('keyboard_interactions', () => {
        it('should be an array', () => {
            expect(Array.isArray(keyboard_interactions)).toBe(true);
        });

        it('should have interactions with required properties', () => {
            for (const interaction of keyboard_interactions) {
                expect(interaction).toHaveProperty('id');
                expect(interaction).toHaveProperty('contexts');
                expect(interaction).toHaveProperty('matcher');
                expect(interaction).toHaveProperty('command');
            }
        });

        it('should include A key to create statement', () => {
            const create = keyboard_interactions.find(
                (i) => i.id === 'keyboard.a.create_statement'
            );
            expect(create).toBeDefined();
            expect(create?.matcher.key).toBe('a');
        });

        it('should include Q key to create question', () => {
            const create = keyboard_interactions.find((i) => i.id === 'keyboard.q.create_question');
            expect(create).toBeDefined();
            expect(create?.matcher.key).toBe('q');
        });

        it('should include Delete key to delete node', () => {
            const delete_node = keyboard_interactions.find(
                (i) => i.id === 'keyboard.delete.delete_node'
            );
            expect(delete_node).toBeDefined();
            expect(delete_node?.command).toBe('graph.node.delete');
        });

        it('should include Ctrl+Z to undo', () => {
            const undo = keyboard_interactions.find((i) => i.id === 'keyboard.ctrl_z.undo');
            expect(undo).toBeDefined();
            expect(undo?.command).toBe('history.undo');
            expect(undo?.matcher.modifiers).toContain('ctrl');
        });

        it('should include Escape to close/deselect', () => {
            const escape = keyboard_interactions.find(
                (i) => i.id === 'keyboard.escape.close_or_deselect'
            );
            expect(escape).toBeDefined();
            expect(escape?.matcher.key).toBe('Escape');
        });
    });

    describe('gesture_interactions', () => {
        it('should be an array', () => {
            expect(Array.isArray(gesture_interactions)).toBe(true);
        });

        it('should have interactions with required properties', () => {
            for (const interaction of gesture_interactions) {
                expect(interaction).toHaveProperty('id');
                expect(interaction).toHaveProperty('contexts');
                expect(interaction).toHaveProperty('matcher');
                expect(interaction).toHaveProperty('command');
            }
        });

        it('should include long press to toggle pin', () => {
            const long_press = gesture_interactions.find(
                (i) => i.id === 'gesture.node.long_press.toggle_pin'
            );
            expect(long_press).toBeDefined();
            expect(long_press?.command).toBe('graph.node.pin');
        });

        it('should include tap to select', () => {
            const tap = gesture_interactions.find((i) => i.id === 'gesture.node.tap.select');
            expect(tap).toBeDefined();
            expect(tap?.command).toBe('selection.set');
        });

        it('should include pinch to zoom', () => {
            const pinch = gesture_interactions.find((i) => i.id === 'gesture.canvas.pinch.zoom');
            expect(pinch).toBeDefined();
            expect(pinch?.command).toBe('nav.zoom');
        });
    });

    describe('form_interactions', () => {
        it('should be an array', () => {
            expect(Array.isArray(form_interactions)).toBe(true);
        });

        it('should have interactions with required properties', () => {
            for (const interaction of form_interactions) {
                expect(interaction).toHaveProperty('id');
                expect(interaction).toHaveProperty('contexts');
                expect(interaction).toHaveProperty('matcher');
                expect(interaction).toHaveProperty('command');
            }
        });

        it('should include Enter to submit form', () => {
            const enter = form_interactions.find((i) => i.id === 'form.input.enter.submit');
            expect(enter).toBeDefined();
            expect(enter?.command).toBe('form.submit');
        });

        it('should include Escape to blur/close form', () => {
            const escape = form_interactions.find((i) => i.id === 'form.input.escape.blur');
            expect(escape).toBeDefined();
            expect(escape?.command).toBe('form.blur');
        });
    });

    describe('all_interactions', () => {
        it('should combine all interaction groups', () => {
            expect(Array.isArray(all_interactions)).toBe(true);
            expect(all_interactions.length).toBeGreaterThan(0);
            expect(all_interactions.length).toBe(
                canvas_interactions.length +
                    keyboard_interactions.length +
                    gesture_interactions.length +
                    form_interactions.length
            );
        });

        it('should have unique interaction IDs', () => {
            const ids = all_interactions.map((i) => i.id);
            const unique_ids = new Set(ids);
            expect(unique_ids.size).toBe(ids.length);
        });
    });
});
