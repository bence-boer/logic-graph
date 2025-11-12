/**
 * Command for creating a connection between nodes.
 *
 * Creates a connection of a specified type and provides
 * undo functionality to remove it.
 */

import type { Command, CommandResult, ValidationResult } from '$lib/commands/types';
import { CommandCategory, CommandEffectType } from '$lib/commands/types';
import { graph_store } from '$lib/stores/graph.svelte';
import type { LogicConnection } from '$lib/types/graph';
import { ConnectionType } from '$lib/types/graph';

/**
 * Payload for creating a connection.
 */
export interface CreateConnectionPayload {
    /** Type of connection */
    type: ConnectionType;
    /** Source node IDs */
    sources: string[];
    /** Target node IDs */
    targets: string[];
}

/**
 * Result data from creating a connection.
 */
export interface CreateConnectionResult {
    /** ID of the created connection */
    connection_id: string;
    /** The created connection */
    connection: LogicConnection;
}

/**
 * Command to create a new connection.
 */
export const create_connection_command: Command<CreateConnectionPayload, CreateConnectionResult> = {
    id: 'graph.connection.create',

    metadata: {
        name: 'Create Connection',
        description: 'Create a connection between nodes',
        category: CommandCategory.GRAPH_MUTATION,
        undoable: true,
        mutates_graph: true
    },

    validate(payload: CreateConnectionPayload): ValidationResult {
        // Validate type
        if (!payload.type || !Object.values(ConnectionType).includes(payload.type)) {
            return {
                valid: false,
                error: 'Invalid connection type'
            };
        }

        // Validate sources
        if (!payload.sources || payload.sources.length === 0) {
            return {
                valid: false,
                error: 'At least one source node is required',
                field_errors: { sources: 'Source nodes are required' }
            };
        }

        // Validate targets
        if (!payload.targets || payload.targets.length === 0) {
            return {
                valid: false,
                error: 'At least one target node is required',
                field_errors: { targets: 'Target nodes are required' }
            };
        }

        // Check all source nodes exist
        for (const source_id of payload.sources) {
            const node = graph_store.nodes.find((n) => n.id === source_id);
            if (!node) {
                return {
                    valid: false,
                    error: `Source node '${source_id}' not found`
                };
            }
        }

        // Check all target nodes exist
        for (const target_id of payload.targets) {
            const node = graph_store.nodes.find((n) => n.id === target_id);
            if (!node) {
                return {
                    valid: false,
                    error: `Target node '${target_id}' not found`
                };
            }
        }

        // Check for duplicate connection
        const duplicate = graph_store.connections.find(
            (conn) =>
                conn.type === payload.type &&
                conn.sources.length === payload.sources.length &&
                conn.targets.length === payload.targets.length &&
                conn.sources.every((id) => payload.sources.includes(id)) &&
                conn.targets.every((id) => payload.targets.includes(id))
        );

        if (duplicate) {
            return {
                valid: false,
                error: 'This connection already exists'
            };
        }

        return { valid: true };
    },

    async execute(
        payload: CreateConnectionPayload
    ): Promise<CommandResult<CreateConnectionResult>> {
        try {
            // Create connection
            const connection = graph_store.add_connection({
                type: payload.type,
                sources: payload.sources,
                targets: payload.targets
            });

            return {
                success: true,
                data: {
                    connection_id: connection.id!,
                    connection
                },
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: 'Connection created successfully',
                            type: 'success'
                        }
                    },
                    {
                        type: CommandEffectType.ANIMATION,
                        payload: {
                            type: 'draw_line',
                            target: connection.id,
                            duration: 300
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create connection'
            };
        }
    },

    async undo(result: CommandResult<CreateConnectionResult>): Promise<CommandResult<void>> {
        if (!result.success || !result.data) {
            return {
                success: false,
                error: 'Cannot undo: invalid result data'
            };
        }

        try {
            graph_store.remove_connection(result.data.connection_id);

            return {
                success: true,
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: 'Connection creation undone',
                            type: 'info'
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to undo connection creation'
            };
        }
    }
};
