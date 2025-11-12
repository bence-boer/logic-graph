/**
 * Command for updating an existing node.
 *
 * Updates node properties and provides undo functionality
 * to restore previous values.
 */

import type { Command, CommandResult, ValidationResult } from '$lib/commands/types';
import { CommandCategory, CommandEffectType } from '$lib/commands/types';
import { graph_store } from '$lib/stores/graph.svelte';
import type { LogicNode } from '$lib/types/graph';
import { NodeType, StatementState } from '$lib/types/graph';
import { AnimationType, EasingType } from '$lib/types/animations';

/**
 * Payload for updating a node.
 */
export interface UpdateNodePayload {
    /** ID of node to update */
    node_id: string;
    /** Updated statement */
    statement?: string;
    /** Updated details */
    details?: string;
    /** Updated type */
    type?: NodeType;
    /** Updated statement state */
    statement_state?: StatementState;
}

/**
 * Result data from updating a node.
 */
export interface UpdateNodeResult {
    /** ID of the updated node */
    node_id: string;
    /** Previous node state (for undo) */
    previous_state: Partial<LogicNode>;
}

/**
 * Command to update an existing node.
 */
export const update_node_command: Command<UpdateNodePayload, UpdateNodeResult> = {
    id: 'graph.node.update',

    metadata: {
        name: 'Update Node',
        description: 'Update properties of an existing node',
        category: CommandCategory.GRAPH_MUTATION,
        undoable: true,
        mutates_graph: true
    },

    validate(payload: UpdateNodePayload): ValidationResult {
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

        // Validate statement if provided
        if (payload.statement !== undefined) {
            if (payload.statement.trim().length === 0) {
                return {
                    valid: false,
                    error: 'Statement cannot be empty',
                    field_errors: { statement: 'Statement is required' }
                };
            }

            if (payload.statement.length > 500) {
                return {
                    valid: false,
                    error: 'Statement is too long',
                    field_errors: { statement: 'Statement must be 500 characters or less' }
                };
            }
        }

        // Validate details if provided
        if (payload.details !== undefined && payload.details.length > 2000) {
            return {
                valid: false,
                error: 'Details are too long',
                field_errors: { details: 'Details must be 2000 characters or less' }
            };
        }

        // Validate type if provided
        if (payload.type && !Object.values(NodeType).includes(payload.type)) {
            return {
                valid: false,
                error: 'Invalid node type'
            };
        }

        // Validate statement state if provided
        if (
            payload.statement_state &&
            !Object.values(StatementState).includes(payload.statement_state)
        ) {
            return {
                valid: false,
                error: 'Invalid statement state'
            };
        }

        return { valid: true };
    },

    async execute(payload: UpdateNodePayload): Promise<CommandResult<UpdateNodeResult>> {
        try {
            // Get current node state
            const node = graph_store.nodes.find((n) => n.id === payload.node_id);
            if (!node) {
                return {
                    success: false,
                    error: 'Node not found'
                };
            }

            // Store previous state for undo
            const previous_state: Partial<LogicNode> = {};
            if (payload.statement !== undefined) previous_state.statement = node.statement;
            if (payload.details !== undefined) previous_state.details = node.details;
            if (payload.type !== undefined) previous_state.type = node.type;
            if (payload.statement_state !== undefined)
                previous_state.statement_state = node.statement_state;

            // Build updates
            const updates: Partial<LogicNode> = {};
            if (payload.statement !== undefined) updates.statement = payload.statement.trim();
            if (payload.details !== undefined) updates.details = payload.details.trim();
            if (payload.type !== undefined) updates.type = payload.type;
            if (payload.statement_state !== undefined)
                updates.statement_state = payload.statement_state;

            // Update node
            graph_store.update_node(payload.node_id, updates);

            return {
                success: true,
                data: {
                    node_id: payload.node_id,
                    previous_state
                },
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: 'Node updated successfully',
                            type: 'success'
                        }
                    },
                    {
                        type: CommandEffectType.ANIMATION,
                        payload: {
                            target: `#node-${payload.node_id}`,
                            animation_type: AnimationType.PULSE,
                            config: {
                                duration: 600,
                                easing: EasingType.EASE_IN_OUT
                            }
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update node'
            };
        }
    },

    async undo(result: CommandResult<UpdateNodeResult>): Promise<CommandResult<void>> {
        if (!result.success || !result.data) {
            return {
                success: false,
                error: 'Cannot undo: invalid result data'
            };
        }

        try {
            // Restore previous state
            graph_store.update_node(result.data.node_id, result.data.previous_state);

            return {
                success: true,
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: 'Node update undone',
                            type: 'info'
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to undo node update'
            };
        }
    }
};
