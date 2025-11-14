/**
 * Command for deleting a connection.
 *
 * Removes a connection from the graph and provides
 * undo functionality to restore it.
 */

import type { Command, CommandResult, ValidationResult } from '$lib/commands/types';
import { CommandCategory, CommandEffectType } from '$lib/commands/types';
import { graph_store } from '$lib/stores/graph.svelte';
import { ToastType } from '$lib/stores/notification.svelte';
import { AnimationType } from '$lib/types/animations';
import type { LogicConnection } from '$lib/types/graph';

/**
 * Payload for deleting a connection.
 */
export interface DeleteConnectionPayload {
    /** ID of connection to delete */
    connection_id: string;
}

/**
 * Result data from deleting a connection.
 */
export interface DeleteConnectionResult {
    /** The deleted connection (for undo) */
    deleted_connection: LogicConnection;
}

/**
 * Command to delete a connection.
 */
export const delete_connection_command: Command<DeleteConnectionPayload, DeleteConnectionResult> = {
    id: 'graph.connection.delete',

    metadata: {
        name: 'Delete Connection',
        description: 'Delete a connection between nodes',
        category: CommandCategory.GRAPH_MUTATION,
        undoable: true,
        mutates_graph: true
    },

    validate(payload: DeleteConnectionPayload): ValidationResult {
        // Validate connection ID
        if (!payload.connection_id) {
            return {
                valid: false,
                error: 'Connection ID is required'
            };
        }

        // Check connection exists
        const connection = graph_store.connections.find((c) => c.id === payload.connection_id);
        if (!connection) {
            return {
                valid: false,
                error: 'Connection not found'
            };
        }

        return { valid: true };
    },

    async execute(
        payload: DeleteConnectionPayload
    ): Promise<CommandResult<DeleteConnectionResult>> {
        try {
            // Get connection before deletion
            const connection = graph_store.connections.find((c) => c.id === payload.connection_id);
            if (!connection) {
                return {
                    success: false,
                    error: 'Connection not found'
                };
            }

            // Delete the connection
            graph_store.remove_connection(payload.connection_id);

            return {
                success: true,
                data: {
                    deleted_connection: connection
                },
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: 'Connection deleted successfully',
                            type: ToastType.SUCCESS
                        }
                    },
                    {
                        type: CommandEffectType.ANIMATION,
                        payload: {
                            type: AnimationType.FADE_OUT,
                            target: payload.connection_id,
                            duration: 200
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete connection'
            };
        }
    },

    async undo(result: CommandResult<DeleteConnectionResult>): Promise<CommandResult<void>> {
        if (!result.success || !result.data) {
            return {
                success: false,
                error: 'Cannot undo: invalid result data'
            };
        }

        try {
            // Restore the connection
            const { deleted_connection } = result.data;
            graph_store.connections = [...graph_store.connections, deleted_connection];

            return {
                success: true,
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: 'Connection deletion undone',
                            type: ToastType.INFO
                        }
                    },
                    {
                        type: CommandEffectType.ANIMATION,
                        payload: {
                            type: 'draw_line',
                            target: deleted_connection.id,
                            duration: 300
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to undo connection deletion'
            };
        }
    }
};
