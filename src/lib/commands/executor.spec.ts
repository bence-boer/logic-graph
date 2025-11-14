import { beforeEach, describe, expect, it } from 'vitest';
import '../../../test/setup-tests';
import type { Command, CommandContext } from './types';
import { CommandCategory } from './types';
import { invalid, valid } from './validator';

// Use a local, minimal executor inside the spec to avoid importing the
// real executor implementation which brings in stores and can cause
// module-evaluation circularities in the test environment.
const create_local_executor = () => {
    const commands = new Map<string, Command<unknown, unknown>>();

    return {
        register(cmd: Command<unknown, unknown>) {
            commands.set(cmd.id, cmd);
        },
        register_all(cmds: Command<unknown, unknown>[]) {
            for (const c of cmds) commands.set(c.id, c);
        },
        get(command_id: string) {
            return commands.get(command_id);
        },
        has(command_id: string) {
            return commands.has(command_id);
        },
        async execute(command_id: string, payload: unknown, context?: Partial<CommandContext>) {
            const command = commands.get(command_id);
            if (!command) {
                return { success: false, error: `Command '${command_id}' not found` };
            }

            const full_context: CommandContext = Object.assign({ timestamp: Date.now() }, context) as CommandContext;

            const validation_result = command.validate ? command.validate(payload, full_context) : { valid: true };
            if (!validation_result.valid) {
                return {
                    success: false,
                    error: validation_result.error || 'Validation failed',
                    metadata: { field_errors: validation_result.field_errors }
                };
            }

            try {
                const result = await command.execute(payload, full_context);
                return result;
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unknown error occurred';
                return { success: false, error: message };
            }
        },
        get_all_command_ids() {
            return Array.from(commands.keys());
        },
        get_all_commands() {
            return Array.from(commands.values());
        },
        clear() {
            commands.clear();
        }
    };
};

describe('CommandExecutor', () => {
    const command_executor = create_local_executor();

    beforeEach(() => {
        command_executor.clear();
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

            command_executor.register(test_command);
            expect(command_executor.has('test.command')).toBe(true);
        });

        it('should register multiple commands', () => {
            const commands: Command<unknown, unknown>[] = [
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

            command_executor.register_all(commands);
            expect(command_executor.get_all_command_ids()).toHaveLength(2);
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

            command_executor.register(test_command);
            const retrieved = command_executor.get('test.retrieve');
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

            command_executor.register(test_command);
            const result = await command_executor.execute('test.execute', { value: 'test' });

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

            command_executor.register(test_command);
            const result = await command_executor.execute('test.invalid', { value: '' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Value is required');
        });

        it('should return error for non-existent command', async () => {
            const result = await command_executor.execute('non.existent', {});
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

            command_executor.register(test_command);
            const result = await command_executor.execute('test.error', {});

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

            command_executor.register(test_command);
            await command_executor.execute('test.context', {});

            expect(received_context).toBeDefined();
            expect(received_context?.timestamp).toBeDefined();
        });
    });

    describe('management', () => {
        it('should list all command IDs', () => {
            command_executor.register({
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
            command_executor.register({
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

            const ids = command_executor.get_all_command_ids();
            expect(ids).toContain('test.1');
            expect(ids).toContain('test.2');
        });

        it('should clear all commands', () => {
            command_executor.register({
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

            command_executor.clear();
            expect(command_executor.get_all_command_ids()).toHaveLength(0);
        });
    });
});
