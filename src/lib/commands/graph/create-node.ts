/**
 * Command for creating a new node (statement or question).
 *
 * Creates a node, adds it to the graph store, and provides
 * undo functionality to remove it.
 */

import type { Command, CommandResult, ValidationResult } from '$lib/commands/types';
import { CommandCategory, CommandEffectType } from '$lib/commands/types';
import { graph_store } from '$lib/stores/graph.svelte';
import type { LogicNode } from '$lib/types/graph';
import { NodeType, QuestionState, StatementState } from '$lib/types/graph';
import { AnimationType, EasingType } from '$lib/types/animations';

/**
 * Payload for creating a node.
 */
export interface CreateNodePayload {
    /** The statement text */
    statement: string;
    /** Optional details */
    details?: string;
    /** Type of node (default: STATEMENT) */
    type?: NodeType;
    /** Question state (for question nodes) */
    question_state?: QuestionState;
    /** Statement state (for statement nodes) */
    statement_state?: StatementState;
    /** Initial X position */
    x?: number;
    /** Initial Y position */
    y?: number;
}

/**
 * Result data from creating a node.
 */
export interface CreateNodeResult {
    /** ID of the created node */
    node_id: string;
    /** The created node */
    node: LogicNode;
}

/**
 * Command to create a new node.
 */
export const create_node_command: Command<CreateNodePayload, CreateNodeResult> = {
    id: 'graph.node.create',

    metadata: {
        name: 'Create Node',
        description: 'Create a new statement or question node',
        category: CommandCategory.GRAPH_MUTATION,
        undoable: true,
        mutates_graph: true
    },

    validate(payload: CreateNodePayload): ValidationResult {
        // Validate statement
        if (!payload.statement || payload.statement.trim().length === 0) {
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

        // Validate details if provided
        if (payload.details && payload.details.length > 2000) {
            return {
                valid: false,
                error: 'Details are too long',
                field_errors: { details: 'Details must be 2000 characters or less' }
            };
        }

        // Validate type
        if (payload.type && !Object.values(NodeType).includes(payload.type)) {
            return {
                valid: false,
                error: 'Invalid node type'
            };
        }

        // Validate question state if provided
        if (
            payload.question_state &&
            !Object.values(QuestionState).includes(payload.question_state)
        ) {
            return {
                valid: false,
                error: 'Invalid question state'
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

    async execute(payload: CreateNodePayload): Promise<CommandResult<CreateNodeResult>> {
        try {
            // Create node data
            const node_data: Omit<LogicNode, 'id'> = {
                statement: payload.statement.trim(),
                details: payload.details?.trim(),
                type: payload.type ?? NodeType.STATEMENT,
                x: payload.x,
                y: payload.y
            };

            // Add type-specific properties
            if (node_data.type === NodeType.QUESTION) {
                node_data.question_state = payload.question_state ?? QuestionState.ACTIVE;
            } else if (node_data.type === NodeType.STATEMENT) {
                // Only set statement_state if provided (not all statements need it)
                if (payload.statement_state) {
                    node_data.statement_state = payload.statement_state;
                }
            }

            // Add node to store
            const created_node = graph_store.add_node(node_data);

            // Determine success message based on type
            const node_type_name =
                created_node.type === NodeType.QUESTION ? 'Question' : 'Statement';

            return {
                success: true,
                data: {
                    node_id: created_node.id,
                    node: created_node
                },
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: `${node_type_name} created successfully`,
                            type: 'success'
                        }
                    },
                    {
                        type: CommandEffectType.ANIMATION,
                        payload: {
                            target: `#node-${created_node.id}`,
                            animation_type: AnimationType.GROW_IN,
                            config: {
                                duration: 400,
                                easing: EasingType.EASE_OUT
                            }
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create node'
            };
        }
    },

    async undo(result: CommandResult<CreateNodeResult>): Promise<CommandResult<void>> {
        if (!result.success || !result.data) {
            return {
                success: false,
                error: 'Cannot undo: invalid result data'
            };
        }

        try {
            graph_store.remove_node(result.data.node_id);

            return {
                success: true,
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: 'Node creation undone',
                            type: 'info'
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to undo node creation'
            };
        }
    }
};
