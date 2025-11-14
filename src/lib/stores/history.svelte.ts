/**
 * Command history store for undo/redo functionality.
 *
 * Maintains a stack of executed commands and provides undo/redo operations.
 */

import type { CommandHistoryEntry } from '$lib/commands/types';

/**
 * Maximum number of commands to keep in history.
 */
const MAX_HISTORY_SIZE = 100;

/**
 * History store state.
 */
class HistoryStore {
    /** Stack of executed commands that can be undone */
    private undo_stack = $state<CommandHistoryEntry<unknown, unknown>[]>([]);

    /** Stack of undone commands that can be redone */
    private redo_stack = $state<CommandHistoryEntry<unknown, unknown>[]>([]);

    /**
     * Get the undo stack (read-only).
     */
    get undo_history(): readonly CommandHistoryEntry<unknown, unknown>[] {
        return this.undo_stack;
    }

    /**
     * Get the redo stack (read-only).
     */
    get redo_history(): readonly CommandHistoryEntry<unknown, unknown>[] {
        return this.redo_stack;
    }

    /**
     * Check if undo is available.
     */
    get can_undo(): boolean {
        return this.undo_stack.length > 0;
    }

    /**
     * Check if redo is available.
     */
    get can_redo(): boolean {
        return this.redo_stack.length > 0;
    }

    /**
     * Add a command to history.
     *
     * Clears the redo stack and adds the command to the undo stack.
     *
     * @param entry - Command history entry
     *
     * @example
     * ```ts
     * history_store.push({
     *   command: 'graph.node.create',
     *   payload: { statement: 'New node' },
     *   result: { success: true, data: { id: '123' } },
     *   timestamp: Date.now()
     * });
     * ```
     */
    push(entry: CommandHistoryEntry<unknown, unknown>): void {
        // Clear redo stack when new command is executed
        this.redo_stack = [];

        // Add to undo stack
        this.undo_stack.push(entry);

        // Enforce size limit
        if (this.undo_stack.length > MAX_HISTORY_SIZE) {
            this.undo_stack.shift();
        }
    }

    /**
     * Get the most recent command that can be undone.
     *
     * @returns Command entry or undefined if stack is empty
     *
     * @example
     * ```ts
     * const last_command = history_store.peek_undo();
     * if (last_command) {
     *   console.log('Last command:', last_command.command);
     * }
     * ```
     */
    peek_undo(): CommandHistoryEntry<unknown, unknown> | undefined {
        return this.undo_stack[this.undo_stack.length - 1];
    }

    /**
     * Get the most recent command that can be redone.
     *
     * @returns Command entry or undefined if stack is empty
     *
     * @example
     * ```ts
     * const next_command = history_store.peek_redo();
     * if (next_command) {
     *   console.log('Next redo:', next_command.command);
     * }
     * ```
     */
    peek_redo(): CommandHistoryEntry<unknown, unknown> | undefined {
        return this.redo_stack[this.redo_stack.length - 1];
    }

    /**
     * Pop a command from the undo stack.
     *
     * Moves the command to the redo stack.
     *
     * @returns Command entry or undefined if stack is empty
     *
     * @example
     * ```ts
     * const command = history_store.pop_undo();
     * if (command) {
     *   // Undo the command
     * }
     * ```
     */
    pop_undo(): CommandHistoryEntry<unknown, unknown> | undefined {
        const entry = this.undo_stack.pop();
        if (entry) {
            this.redo_stack.push(entry);
        }
        return entry;
    }

    /**
     * Pop a command from the redo stack.
     *
     * Moves the command to the undo stack.
     *
     * @returns Command entry or undefined if stack is empty
     *
     * @example
     * ```ts
     * const command = history_store.pop_redo();
     * if (command) {
     *   // Redo the command
     * }
     * ```
     */
    pop_redo(): CommandHistoryEntry<unknown, unknown> | undefined {
        const entry = this.redo_stack.pop();
        if (entry) {
            this.undo_stack.push(entry);
        }
        return entry;
    }

    /**
     * Clear all history.
     *
     * Useful when loading a new graph or resetting state.
     *
     * @example
     * ```ts
     * history_store.clear();
     * ```
     */
    clear(): void {
        this.undo_stack = [];
        this.redo_stack = [];
    }

    /**
     * Get total number of commands in history.
     *
     * @returns Total count of undo + redo commands
     *
     * @example
     * ```ts
     * const count = history_store.size();
     * console.log(`History contains ${count} commands`);
     * ```
     */
    size(): number {
        return this.undo_stack.length + this.redo_stack.length;
    }

    /**
     * Get all commands in chronological order.
     *
     * @returns Array of all command entries
     *
     * @example
     * ```ts
     * const all_commands = history_store.get_all();
     * for (const entry of all_commands) {
     *   console.log(entry.command, new Date(entry.timestamp));
     * }
     * ```
     */
    get_all(): CommandHistoryEntry<unknown, unknown>[] {
        return [...this.undo_stack, ...this.redo_stack.reverse()];
    }
}

/**
 * Global history store instance.
 */
export const history_store = new HistoryStore();
