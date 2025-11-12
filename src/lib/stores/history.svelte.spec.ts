/**
 * Tests for history store.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { history_store } from './history.svelte';
import type { CommandHistoryEntry } from '$lib/commands/types';

describe('HistoryStore', () => {
    beforeEach(() => {
        history_store.clear();
    });

    describe('push', () => {
        it('should add command to undo stack', () => {
            const entry: CommandHistoryEntry = {
                command: 'test.command',
                payload: { value: 'test' },
                result: { success: true },
                timestamp: Date.now()
            };

            history_store.push(entry);
            expect(history_store.can_undo).toBe(true);
            expect(history_store.undo_history).toHaveLength(1);
        });

        it('should clear redo stack when new command is pushed', () => {
            const entry1: CommandHistoryEntry = {
                command: 'test.1',
                payload: {},
                result: { success: true },
                timestamp: Date.now()
            };
            const entry2: CommandHistoryEntry = {
                command: 'test.2',
                payload: {},
                result: { success: true },
                timestamp: Date.now()
            };

            history_store.push(entry1);
            history_store.pop_undo(); // Move to redo stack
            expect(history_store.can_redo).toBe(true);

            history_store.push(entry2); // Should clear redo
            expect(history_store.can_redo).toBe(false);
        });

        it('should enforce maximum history size', () => {
            // Push more than MAX_HISTORY_SIZE (100)
            for (let i = 0; i < 150; i++) {
                history_store.push({
                    command: `test.${i}`,
                    payload: {},
                    result: { success: true },
                    timestamp: Date.now()
                });
            }

            expect(history_store.undo_history.length).toBeLessThanOrEqual(100);
        });
    });

    describe('undo operations', () => {
        it('should peek undo without modifying stack', () => {
            const entry: CommandHistoryEntry = {
                command: 'test.peek',
                payload: {},
                result: { success: true },
                timestamp: Date.now()
            };

            history_store.push(entry);
            const peeked = history_store.peek_undo();

            expect(peeked?.command).toBe('test.peek');
            expect(history_store.undo_history).toHaveLength(1);
        });

        it('should pop undo and move to redo stack', () => {
            const entry: CommandHistoryEntry = {
                command: 'test.pop',
                payload: {},
                result: { success: true },
                timestamp: Date.now()
            };

            history_store.push(entry);
            const popped = history_store.pop_undo();

            expect(popped?.command).toBe('test.pop');
            expect(history_store.can_undo).toBe(false);
            expect(history_store.can_redo).toBe(true);
        });

        it('should return undefined when undo stack is empty', () => {
            const result = history_store.pop_undo();
            expect(result).toBeUndefined();
        });
    });

    describe('redo operations', () => {
        it('should peek redo without modifying stack', () => {
            const entry: CommandHistoryEntry = {
                command: 'test.redo',
                payload: {},
                result: { success: true },
                timestamp: Date.now()
            };

            history_store.push(entry);
            history_store.pop_undo(); // Move to redo

            const peeked = history_store.peek_redo();
            expect(peeked?.command).toBe('test.redo');
            expect(history_store.redo_history).toHaveLength(1);
        });

        it('should pop redo and move to undo stack', () => {
            const entry: CommandHistoryEntry = {
                command: 'test.redo',
                payload: {},
                result: { success: true },
                timestamp: Date.now()
            };

            history_store.push(entry);
            history_store.pop_undo(); // Move to redo

            const popped = history_store.pop_redo();
            expect(popped?.command).toBe('test.redo');
            expect(history_store.can_redo).toBe(false);
            expect(history_store.can_undo).toBe(true);
        });

        it('should return undefined when redo stack is empty', () => {
            const result = history_store.peek_redo();
            expect(result).toBeUndefined();
        });
    });

    describe('clear', () => {
        it('should clear all history', () => {
            history_store.push({
                command: 'test.1',
                payload: {},
                result: { success: true },
                timestamp: Date.now()
            });
            history_store.push({
                command: 'test.2',
                payload: {},
                result: { success: true },
                timestamp: Date.now()
            });

            history_store.clear();
            expect(history_store.can_undo).toBe(false);
            expect(history_store.can_redo).toBe(false);
            expect(history_store.size()).toBe(0);
        });
    });

    describe('utilities', () => {
        it('should return correct size', () => {
            history_store.push({
                command: 'test.1',
                payload: {},
                result: { success: true },
                timestamp: Date.now()
            });
            history_store.push({
                command: 'test.2',
                payload: {},
                result: { success: true },
                timestamp: Date.now()
            });
            history_store.pop_undo(); // Move one to redo

            expect(history_store.size()).toBe(2);
        });

        it('should get all commands in order', () => {
            const entry1: CommandHistoryEntry = {
                command: 'test.1',
                payload: {},
                result: { success: true },
                timestamp: 1000
            };
            const entry2: CommandHistoryEntry = {
                command: 'test.2',
                payload: {},
                result: { success: true },
                timestamp: 2000
            };

            history_store.push(entry1);
            history_store.push(entry2);

            const all = history_store.get_all();
            expect(all).toHaveLength(2);
            expect(all[0].command).toBe('test.1');
            expect(all[1].command).toBe('test.2');
        });
    });
});
