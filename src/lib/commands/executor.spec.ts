/**
 * Tests for command executor.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CommandExecutor } from './executor';
import type { Command, CommandContext } from './types';
import { CommandCategory } from './types';
import { valid, invalid } from './validator';

describe('CommandExecutor', () => {
    let executor: CommandExecutor;

    beforeEach(() => {
        executor = new CommandExecutor();
    });

    describe('registration', () => {
        it('should register a command', () => {
            const test_command: Command<void, void> = {
                id: 'test.command',
                metadata: {
                    name: 'Test Command',
                    description: 'A test command',
                    category: CommandCategory.GRAPH_MUTATION,
                    undoable: false,
                    mutates_graph: false
                },
                validate: () => valid(),
                execute: async () => ({ success: true })
            };

            executor.register(test_command);
            expect(executor.has('test.command')).toBe(true);
        });

        it('should register multiple commands', () => {
            const commands = [
                {
                    id: 'test.command1',
                    metadata: {
                        name: 'Test 1',
                        description: 'Test 1',
                        category: CommandCategory.GRAPH_MUTATION,
                        undoable: false,
                        mutates_graph: false
                    },
                    validate: () => valid(),
                    execute: async () => ({ success: true })
                },
                {
                    id: 'test.command2',
                    metadata: {
                        name: 'Test 2',
                        description: 'Test 2',
                        category: CommandCategory.NAVIGATION,
                        undoable: false,
                        mutates_graph: false
                    },
                    validate: () => valid(),
                    execute: async () => ({ success: true })
                }
            ];

            executor.register_all(commands);
            expect(executor.get_all_command_ids()).toHaveLength(2);
        });

        it('should retrieve a registered command', () => {
            const test_command: Command<void, void> = {
                id: 'test.retrieve',
                metadata: {
                    name: 'Test',
                    description: 'Test',
                    category: CommandCategory.SELECTION,
                    undoable: false,
                    mutates_graph: false
                },
                validate: () => valid(),
                execute: async () => ({ success: true })
            };

            executor.register(test_command);
            const retrieved = executor.get('test.retrieve');
            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe('test.retrieve');
        });
    });

    describe('execution', () => {
        it('should execute a valid command', async () => {
            const test_command: Command<{ value: string }, { result: string }> = {
                id: 'test.execute',
                metadata: {
                    name: 'Test',
                    description: 'Test',
                    category: CommandCategory.GRAPH_MUTATION,
                    undoable: false,
                    mutates_graph: false
                },
                validate: () => valid(),
                execute: async (payload) => ({
                    success: true,
                    data: { result: `Executed with ${payload.value}` }
                })
            };

            executor.register(test_command);
            const result = await executor.execute('test.execute', { value: 'test' });

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ result: 'Executed with test' });
        });

        it('should return error for invalid command', async () => {
            const test_command: Command<{ value: string }, void> = {
                id: 'test.invalid',
                metadata: {
                    name: 'Test',
                    description: 'Test',
                    category: CommandCategory.GRAPH_MUTATION,
                    undoable: false,
                    mutates_graph: false
                },
                validate: (payload) => {
                    if (!payload.value) {
                        return invalid('Value is required');
                    }
                    return valid();
                },
                execute: async () => ({ success: true })
            };

            executor.register(test_command);
            const result = await executor.execute('test.invalid', { value: '' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Value is required');
        });

        it('should return error for non-existent command', async () => {
            const result = await executor.execute('non.existent', {});
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        it('should handle command execution errors', async () => {
            const test_command: Command<void, void> = {
                id: 'test.error',
                metadata: {
                    name: 'Test',
                    description: 'Test',
                    category: CommandCategory.GRAPH_MUTATION,
                    undoable: false,
                    mutates_graph: false
                },
                validate: () => valid(),
                execute: async () => {
                    throw new Error('Execution failed');
                }
            };

            executor.register(test_command);
            const result = await executor.execute('test.error', {});

            expect(result.success).toBe(false);
            expect(result.error).toBe('Execution failed');
        });

        it('should provide execution context', async () => {
            let received_context: CommandContext | undefined;

            const test_command: Command<void, void> = {
                id: 'test.context',
                metadata: {
                    name: 'Test',
                    description: 'Test',
                    category: CommandCategory.GRAPH_MUTATION,
                    undoable: false,
                    mutates_graph: false
                },
                validate: () => valid(),
                execute: async (_payload, context) => {
                    received_context = context;
                    return { success: true };
                }
            };

            executor.register(test_command);
            await executor.execute('test.context', {});

            expect(received_context).toBeDefined();
            expect(received_context?.timestamp).toBeDefined();
        });
    });

    describe('management', () => {
        it('should list all command IDs', () => {
            executor.register({
                id: 'test.1',
                metadata: {
                    name: 'Test',
                    description: 'Test',
                    category: CommandCategory.GRAPH_MUTATION,
                    undoable: false,
                    mutates_graph: false
                },
                validate: () => valid(),
                execute: async () => ({ success: true })
            });
            executor.register({
                id: 'test.2',
                metadata: {
                    name: 'Test',
                    description: 'Test',
                    category: CommandCategory.NAVIGATION,
                    undoable: false,
                    mutates_graph: false
                },
                validate: () => valid(),
                execute: async () => ({ success: true })
            });

            const ids = executor.get_all_command_ids();
            expect(ids).toContain('test.1');
            expect(ids).toContain('test.2');
        });

        it('should clear all commands', () => {
            executor.register({
                id: 'test.clear',
                metadata: {
                    name: 'Test',
                    description: 'Test',
                    category: CommandCategory.GRAPH_MUTATION,
                    undoable: false,
                    mutates_graph: false
                },
                validate: () => valid(),
                execute: async () => ({ success: true })
            });

            executor.clear();
            expect(executor.get_all_command_ids()).toHaveLength(0);
        });
    });
});
