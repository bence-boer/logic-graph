/**
 * Command for toggling question state between active and resolved.
 *
 * Allows manual override of automatic question state management.
 * When manually set, the state will not be auto-changed by link/unlink operations.
 */

import type { Command, CommandResult, ValidationResult } from '$lib/commands/types';
import { CommandCategory, CommandEffectType } from '$lib/commands/types';
import { graph_store } from '$lib/stores/graph.svelte';
import { NodeType, QuestionState } from '$lib/types/graph';
import { AnimationType, EasingType } from '$lib/types/animations';

/**
 * Payload for toggling question state.
 */
export interface ToggleQuestionStatePayload {
    /** ID of the question node */
    question_id: string;
    /** Optional: specific state to set. If omitted, toggles between active/resolved */
    target_state?: QuestionState;
}

/**
 * Result data from toggling question state.
 */
export interface ToggleQuestionStateResult {
    /** Question node ID */
    question_id: string;
    /** Previous state */
    previous_state: QuestionState;
    /** New state */
    new_state: QuestionState;
}

/**
 * Command to toggle question state manually.
 */
export const toggle_question_state_command: Command<
    ToggleQuestionStatePayload,
    ToggleQuestionStateResult
> = {
    id: 'graph.question.toggle_state',

    metadata: {
        name: 'Toggle Question State',
        description: 'Manually toggle question state between active and resolved',
        category: CommandCategory.GRAPH_MUTATION,
        undoable: true,
        mutates_graph: true
    },

    validate(payload: ToggleQuestionStatePayload): ValidationResult {
        // Validate question ID
        if (!payload.question_id) {
            return {
                valid: false,
                error: 'Question ID is required'
            };
        }

        // Check node exists and is a question
        const node = graph_store.nodes.find((n) => n.id === payload.question_id);
        if (!node) {
            return {
                valid: false,
                error: 'Question node not found'
            };
        }

        if (node.type !== NodeType.QUESTION) {
            return {
                valid: false,
                error: 'Node is not a question'
            };
        }

        // Validate target state if provided
        if (
            payload.target_state &&
            !Object.values(QuestionState).includes(payload.target_state)
        ) {
            return {
                valid: false,
                error: 'Invalid question state'
            };
        }

        return { valid: true };
    },

    async execute(
        payload: ToggleQuestionStatePayload
    ): Promise<CommandResult<ToggleQuestionStateResult>> {
        try {
            const node = graph_store.nodes.find((n) => n.id === payload.question_id);
            if (!node) {
                return {
                    success: false,
                    error: 'Question node not found'
                };
            }

            const previous_state = node.question_state || QuestionState.ACTIVE;

            // Determine new state
            let new_state: QuestionState;
            if (payload.target_state) {
                // Use explicit target state if provided
                new_state = payload.target_state;
            } else {
                // Toggle between active and resolved
                new_state =
                    previous_state === QuestionState.ACTIVE
                        ? QuestionState.RESOLVED
                        : QuestionState.ACTIVE;
            }

            // Update node with manual override flag
            graph_store.update_node(payload.question_id, {
                question_state: new_state,
                manual_state_override: true
            });

            const state_label = new_state === QuestionState.ACTIVE ? 'active' : 'resolved';

            return {
                success: true,
                data: {
                    question_id: payload.question_id,
                    previous_state,
                    new_state
                },
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: `Question marked as ${state_label}`,
                            type: 'success'
                        }
                    },
                    {
                        type: CommandEffectType.ANIMATION,
                        payload: {
                            target: `#node-${payload.question_id}`,
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
                error: error instanceof Error ? error.message : 'Failed to toggle question state'
            };
        }
    },

    async undo(result: CommandResult<ToggleQuestionStateResult>): Promise<CommandResult<void>> {
        if (!result.success || !result.data) {
            return {
                success: false,
                error: 'Cannot undo: invalid result data'
            };
        }

        try {
            // Restore previous state and keep manual override flag
            graph_store.update_node(result.data.question_id, {
                question_state: result.data.previous_state,
                manual_state_override: true
            });

            const state_label =
                result.data.previous_state === QuestionState.ACTIVE ? 'active' : 'resolved';

            return {
                success: true,
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: `Question state restored to ${state_label}`,
                            type: 'info'
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error ? error.message : 'Failed to undo question state toggle'
            };
        }
    }
};
