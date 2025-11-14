/**
 * Command for deleting a node.
 *
 * Removes a node and all its connections from the graph.
 * Provides undo functionality to restore the node and connections.
 */

import type { Command, CommandResult, ValidationResult } from '$lib/commands/types';
import { CommandCategory, CommandEffectType } from '$lib/commands/types';
import { graph_store } from '$lib/stores/graph.svelte';
import { AnimationType, EasingType } from '$lib/types/animations';
import type { LogicConnection, LogicNode } from '$lib/types/graph';

/**
 * Payload for deleting a node.
 */
export interface DeleteNodePayload {
    /** ID of node to delete */
    node_id: string;
}

/**
 * Result data from deleting a node.
 */
export interface DeleteNodeResult {
    /** The deleted node (for undo) */
    deleted_node: LogicNode;
    /** Deleted connections (for undo) */
    deleted_connections: LogicConnection[];
}

/**
 * Command to delete a node.
 */
export const delete_node_command: Command<DeleteNodePayload, DeleteNodeResult> = {
    id: 'graph.node.delete',

    metadata: {
        name: 'Delete Node',
        description: 'Delete a node and all its connections',
        category: CommandCategory.GRAPH_MUTATION,
        undoable: true,
        mutates_graph: true
    },

    validate(payload: DeleteNodePayload): ValidationResult {
        // Validate node ID
        if (!payload.node_id) {
            return {
                valid: false,
                error: 'Node ID is required'
            };
        }

        // Check node exists
        const node = graph_store.nodes.find((n) => n.id === payload.node_id);
        if (!node) {
            return {
                valid: false,
                error: 'Node not found'
            };
        }

        return { valid: true };
    },

    async execute(payload: DeleteNodePayload): Promise<CommandResult<DeleteNodeResult>> {
        try {
            // Get node before deletion
            const node = graph_store.nodes.find((n) => n.id === payload.node_id);
            if (!node) {
                return {
                    success: false,
                    error: 'Node not found'
                };
            }

            // Find all connections involving this node
            const connections_to_delete = graph_store.connections.filter(
                (conn) =>
                    conn.sources.includes(payload.node_id) || conn.targets.includes(payload.node_id)
            );

            // Delete the node (this also deletes connections via graph_store.remove_node)
            graph_store.remove_node(payload.node_id);

            return {
                success: true,
                data: {
                    deleted_node: node,
                    deleted_connections: connections_to_delete
                },
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: 'Node deleted successfully',
                            type: 'success'
                        }
                    },
                    {
                        type: CommandEffectType.ANIMATION,
                        payload: {
                            target: `#node-${payload.node_id}`,
                            type: AnimationType.SHRINK_OUT,
                            config: {
                                duration: 300,
                                easing: EasingType.EASE_IN
                            }
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete node'
            };
        }
    },

    async undo(result: CommandResult<DeleteNodeResult>): Promise<CommandResult<void>> {
        if (!result.success || !result.data) {
            return {
                success: false,
                error: 'Cannot undo: invalid result data'
            };
        }

        try {
            // Restore the node
            const { deleted_node, deleted_connections } = result.data;

            // Remove the id so add_node generates a new one? No, we want to keep the same ID
            // But add_node expects Omit<LogicNode, 'id'>, so we need to work around this
            const node_data = { ...deleted_node };
            const node_id = node_data.id;

            // Use a direct approach: add to the nodes array
            graph_store.nodes = [...graph_store.nodes, node_data];

            // Restore connections
            for (const connection of deleted_connections) {
                graph_store.connections = [...graph_store.connections, connection];
            }

            return {
                success: true,
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: 'Node deletion undone',
                            type: 'info'
                        }
                    },
                    {
                        type: CommandEffectType.ANIMATION,
                        payload: {
                            type: AnimationType.FADE_IN,
                            target: node_id,
                            config: {
                                duration: 300,
                                easing: EasingType.EASE_OUT
                            }
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to undo node deletion'
            };
        }
    }
};
