/**
 * Tests for interaction router.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractionRouter } from './router';
import { InteractionContext, EventMatcherType } from './types';
import type { InteractionDefinition } from './types';
import { command_executor } from '$lib/commands/executor';

describe('InteractionRouter', () => {
    let router: InteractionRouter;

    beforeEach(() => {
        router = new InteractionRouter();
        command_executor.clear();
    });

    describe('registration', () => {
        it('should register an interaction', () => {
            const interaction: InteractionDefinition = {
                id: 'test.click',
                contexts: [InteractionContext.CANVAS],
                matcher: { type: EventMatcherType.CLICK },
                command: 'test.command'
            };

            router.register(interaction);
            expect(router.get_all_interactions()).toHaveLength(1);
        });

        it('should register multiple interactions', () => {
            const interactions: InteractionDefinition[] = [
                {
                    id: 'test.1',
                    contexts: [InteractionContext.CANVAS],
                    matcher: { type: EventMatcherType.CLICK },
                    command: 'test.1'
                },
                {
                    id: 'test.2',
                    contexts: [InteractionContext.GLOBAL],
                    matcher: { type: EventMatcherType.KEY, key: 'a' },
                    command: 'test.2'
                }
            ];

            router.register_all(interactions);
            expect(router.get_all_interactions()).toHaveLength(2);
        });

        it('should sort by priority', () => {
            router.register({
                id: 'low',
                contexts: [InteractionContext.GLOBAL],
                matcher: { type: EventMatcherType.CLICK },
                command: 'low',
                priority: 1
            });
            router.register({
                id: 'high',
                contexts: [InteractionContext.GLOBAL],
                matcher: { type: EventMatcherType.CLICK },
                command: 'high',
                priority: 10
            });

            const interactions = router.get_all_interactions();
            expect(interactions[0].id).toBe('high');
            expect(interactions[1].id).toBe('low');
        });
    });

    describe('context management', () => {
        it('should set and get context', () => {
            router.set_context(InteractionContext.CANVAS, { test: true });
            const context = router.get_context();

            expect(context.context).toBe(InteractionContext.CANVAS);
            expect(context.data?.test).toBe(true);
        });

        it('should start with global context', () => {
            const context = router.get_context();
            expect(context.context).toBe(InteractionContext.GLOBAL);
        });
    });

    describe('cleanup', () => {
        it('should clear all interactions', () => {
            router.register({
                id: 'test',
                contexts: [InteractionContext.GLOBAL],
                matcher: { type: EventMatcherType.CLICK },
                command: 'test'
            });

            router.clear();
            expect(router.get_all_interactions()).toHaveLength(0);
        });

        it('should remove event listeners on cleanup', () => {
            const mock_element = {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            };

            router.register({
                id: 'test',
                contexts: [InteractionContext.GLOBAL],
                matcher: { type: EventMatcherType.CLICK },
                command: 'test'
            });

            router.initialize(mock_element as unknown as EventTarget);
            router.cleanup();

            expect(mock_element.removeEventListener).toHaveBeenCalled();
        });
    });
});
