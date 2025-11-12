/**
 * Command for pinning/unpinning a node.
 *
 * Pins a node to its current position or unpins it to allow
 * the force simulation to move it.
 */

import type { Command, CommandResult, ValidationResult } from '$lib/commands/types';
import { CommandCategory, CommandEffectType } from '$lib/commands/types';
import { graph_store } from '$lib/stores/graph.svelte';

/**
 * Payload for pinning/unpinning a node.
 */
export interface PinNodePayload {
    /** ID of node to pin/unpin */
    node_id: string;
    /** Whether to pin (true) or unpin (false) */
    pinned: boolean;
}

/**
 * Result data from pinning/unpinning a node.
 */
export interface PinNodeResult {
    /** ID of the node */
    node_id: string;
    /** Previous pinned state */
    was_pinned: boolean;
}

/**
 * Command to pin or unpin a node.
 */
export const pin_node_command: Command<PinNodePayload, PinNodeResult> = {
    id: 'graph.node.pin',

    metadata: {
        name: 'Pin/Unpin Node',
        description: 'Pin a node to its current position or unpin it',
        category: CommandCategory.GRAPH_MUTATION,
        undoable: true,
        mutates_graph: true
    },

    validate(payload: PinNodePayload): ValidationResult {
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

        // Validate pinned is boolean
        if (typeof payload.pinned !== 'boolean') {
            return {
                valid: false,
                error: 'Pinned must be a boolean'
            };
        }

        return { valid: true };
    },

    async execute(payload: PinNodePayload): Promise<CommandResult<PinNodeResult>> {
        try {
            const node = graph_store.nodes.find((n) => n.id === payload.node_id);
            if (!node) {
                return {
                    success: false,
                    error: 'Node not found'
                };
            }

            // Check current pinned state
            const was_pinned = node.fx !== null && node.fx !== undefined;

            if (payload.pinned) {
                // Pin the node at its current position
                graph_store.update_node(payload.node_id, {
                    fx: node.x ?? 0,
                    fy: node.y ?? 0
                });
            } else {
                // Unpin the node
                graph_store.update_node(payload.node_id, {
                    fx: null,
                    fy: null
                });
            }

            const action = payload.pinned ? 'pinned' : 'unpinned';

            return {
                success: true,
                data: {
                    node_id: payload.node_id,
                    was_pinned
                },
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: `Node ${action} successfully`,
                            type: 'success'
                        }
                    },
                    {
                        type: CommandEffectType.ANIMATION,
                        payload: {
                            type: 'pulse',
                            target: payload.node_id,
                            duration: 200
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to pin/unpin node'
            };
        }
    },

    async undo(result: CommandResult<PinNodeResult>): Promise<CommandResult<void>> {
        if (!result.success || !result.data) {
            return {
                success: false,
                error: 'Cannot undo: invalid result data'
            };
        }

        try {
            const node = graph_store.nodes.find((n) => n.id === result.data!.node_id);
            if (!node) {
                return {
                    success: false,
                    error: 'Node not found'
                };
            }

            if (result.data.was_pinned) {
                // Restore pinned state
                graph_store.update_node(result.data.node_id, {
                    fx: node.x ?? 0,
                    fy: node.y ?? 0
                });
            } else {
                // Restore unpinned state
                graph_store.update_node(result.data.node_id, {
                    fx: null,
                    fy: null
                });
            }

            return {
                success: true,
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: 'Pin state restored',
                            type: 'info'
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to undo pin/unpin'
            };
        }
    }
};
