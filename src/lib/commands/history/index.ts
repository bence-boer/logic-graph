/**
 * History commands for undo/redo functionality.
 *
 * These commands integrate with the history store and command executor
 * to enable undo and redo of previous actions.
 */

import type { Command, CommandResult, ValidationResult } from '$lib/commands/types';
import { CommandCategory, CommandEffectType } from '$lib/commands/types';
import { history_store } from '$lib/stores/history.svelte';
import { command_executor } from '$lib/commands/executor';

/**
 * Command to undo the last action.
 */
export const undo_command: Command<void, void> = {
    id: 'history.undo',

    metadata: {
        name: 'Undo',
        description: 'Undo the last action',
        category: CommandCategory.HISTORY,
        undoable: false,
        mutates_graph: false // Depends on what's being undone
    },

    validate(): ValidationResult {
        if (!history_store.can_undo) {
            return {
                valid: false,
                error: 'Nothing to undo'
            };
        }

        return { valid: true };
    },

    async execute(): Promise<CommandResult<void>> {
        try {
            // Get the last command from history
            const entry = history_store.pop_undo();
            if (!entry) {
                return {
                    success: false,
                    error: 'Nothing to undo'
                };
            }

            // Get the command from the executor
            const command = command_executor.get(entry.command);
            if (!command) {
                return {
                    success: false,
                    error: `Command '${entry.command}' not found`
                };
            }

            // Check if command is undoable
            if (!command.metadata.undoable || !command.undo) {
                // Put it back on the stack since we can't undo it
                history_store.push(entry);
                return {
                    success: false,
                    error: 'Command is not undoable'
                };
            }

            // Execute the undo
            const undo_result = await command.undo(entry.result, { timestamp: Date.now() });

            if (!undo_result.success) {
                // Put it back on the stack if undo failed
                history_store.push(entry);
                return {
                    success: false,
                    error: undo_result.error || 'Undo failed'
                };
            }

            return {
                success: true,
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: `Undid: ${command.metadata.name}`,
                            type: 'info'
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Undo failed'
            };
        }
    }
};

/**
 * Command to redo the last undone action.
 */
export const redo_command: Command<void, void> = {
    id: 'history.redo',

    metadata: {
        name: 'Redo',
        description: 'Redo the last undone action',
        category: CommandCategory.HISTORY,
        undoable: false,
        mutates_graph: false // Depends on what's being redone
    },

    validate(): ValidationResult {
        if (!history_store.can_redo) {
            return {
                valid: false,
                error: 'Nothing to redo'
            };
        }

        return { valid: true };
    },

    async execute(): Promise<CommandResult<void>> {
        try {
            // Get the last undone command from history
            const entry = history_store.pop_redo();
            if (!entry) {
                return {
                    success: false,
                    error: 'Nothing to redo'
                };
            }

            // Re-execute the command
            const result = await command_executor.execute(entry.command, entry.payload, {
                timestamp: Date.now()
            });

            if (!result.success) {
                // If re-execution failed, we can't easily restore state
                // Just return the error
                return {
                    success: false,
                    error: result.error || 'Redo failed'
                };
            }

            // Note: command_executor.execute will automatically add to undo stack

            const command = command_executor.get(entry.command);
            const command_name = command?.metadata.name || entry.command;

            return {
                success: true,
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: `Redid: ${command_name}`,
                            type: 'info'
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Redo failed'
            };
        }
    }
};

/**
 * Command to clear history.
 */
export const clear_history_command: Command<void, void> = {
    id: 'history.clear',

    metadata: {
        name: 'Clear History',
        description: 'Clear all undo/redo history',
        category: CommandCategory.HISTORY,
        undoable: false,
        mutates_graph: false
    },

    validate(): ValidationResult {
        return { valid: true };
    },

    async execute(): Promise<CommandResult<void>> {
        try {
            history_store.clear();

            return {
                success: true,
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: 'History cleared',
                            type: 'info'
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to clear history'
            };
        }
    }
};
