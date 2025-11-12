/**
 * Commands for managing question-answer relationships.
 *
 * Handles linking and unlinking answers to questions with
 * proper state management and validation.
 */

import type { Command, CommandResult, ValidationResult } from '$lib/commands/types';
import { CommandCategory, CommandEffectType } from '$lib/commands/types';
import { graph_store } from '$lib/stores/graph.svelte';
import { NodeType, ConnectionType } from '$lib/types/graph';

/**
 * Payload for linking an answer to a question.
 */
export interface LinkAnswerPayload {
    /** ID of the question node */
    question_id: string;
    /** ID of the answer node */
    answer_id: string;
}

/**
 * Result data from linking an answer.
 */
export interface LinkAnswerResult {
    /** Question node ID */
    question_id: string;
    /** Answer node ID */
    answer_id: string;
    /** Previous answer ID (if any) */
    previous_answer_id?: string;
    /** ID of the created connection */
    connection_id: string;
}

/**
 * Command to link an answer to a question.
 */
export const link_answer_command: Command<LinkAnswerPayload, LinkAnswerResult> = {
    id: 'graph.answer.link',

    metadata: {
        name: 'Link Answer',
        description: 'Link an answer node to a question node',
        category: CommandCategory.GRAPH_MUTATION,
        undoable: true,
        mutates_graph: true
    },

    validate(payload: LinkAnswerPayload): ValidationResult {
        // Validate question ID
        if (!payload.question_id) {
            return {
                valid: false,
                error: 'Question ID is required'
            };
        }

        // Validate answer ID
        if (!payload.answer_id) {
            return {
                valid: false,
                error: 'Answer ID is required'
            };
        }

        // Check question exists and is a question
        const question = graph_store.nodes.find((n) => n.id === payload.question_id);
        if (!question) {
            return {
                valid: false,
                error: 'Question node not found'
            };
        }

        if (question.type !== NodeType.QUESTION) {
            return {
                valid: false,
                error: 'Node is not a question'
            };
        }

        // Check answer exists
        const answer = graph_store.nodes.find((n) => n.id === payload.answer_id);
        if (!answer) {
            return {
                valid: false,
                error: 'Answer node not found'
            };
        }

        // Check if answer connection already exists
        const existing_connection = graph_store.connections.find(
            (conn) =>
                conn.type === ConnectionType.ANSWER &&
                conn.sources.includes(payload.answer_id) &&
                conn.targets.includes(payload.question_id)
        );

        if (existing_connection) {
            return {
                valid: false,
                error: 'Answer is already linked to this question'
            };
        }

        return { valid: true };
    },

    async execute(payload: LinkAnswerPayload): Promise<CommandResult<LinkAnswerResult>> {
        try {
            const question = graph_store.nodes.find((n) => n.id === payload.question_id);
            if (!question) {
                return {
                    success: false,
                    error: 'Question node not found'
                };
            }

            // Store previous answer if exists
            const previous_answer_id = question.answered_by;

            // Create answer connection
            const connection = graph_store.add_connection({
                type: ConnectionType.ANSWER,
                sources: [payload.answer_id],
                targets: [payload.question_id]
            });

            // Update question with answer (answer_id represents the accepted answer)
            graph_store.update_node(payload.question_id, {
                answered_by: payload.answer_id
            });

            return {
                success: true,
                data: {
                    question_id: payload.question_id,
                    answer_id: payload.answer_id,
                    previous_answer_id,
                    connection_id: connection.id!
                },
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: 'Answer linked successfully',
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
                    },
                    {
                        type: CommandEffectType.ANIMATION,
                        payload: {
                            type: 'pulse',
                            target: payload.question_id,
                            duration: 400
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to link answer'
            };
        }
    },

    async undo(result: CommandResult<LinkAnswerResult>): Promise<CommandResult<void>> {
        if (!result.success || !result.data) {
            return {
                success: false,
                error: 'Cannot undo: invalid result data'
            };
        }

        try {
            const { question_id, previous_answer_id, connection_id } = result.data;

            // Remove the connection
            graph_store.remove_connection(connection_id);

            // Restore previous answer state
            graph_store.update_node(question_id, {
                answered_by: previous_answer_id
            });

            return {
                success: true,
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: 'Answer link undone',
                            type: 'info'
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to undo answer link'
            };
        }
    }
};

/**
 * Payload for unlinking an answer from a question.
 */
export interface UnlinkAnswerPayload {
    /** ID of the question node */
    question_id: string;
}

/**
 * Result data from unlinking an answer.
 */
export interface UnlinkAnswerResult {
    /** Question node ID */
    question_id: string;
    /** Unlinked answer ID */
    answer_id: string;
    /** ID of the deleted connection */
    connection_id: string;
}

/**
 * Command to unlink an answer from a question.
 */
export const unlink_answer_command: Command<UnlinkAnswerPayload, UnlinkAnswerResult> = {
    id: 'graph.answer.unlink',

    metadata: {
        name: 'Unlink Answer',
        description: 'Unlink an answer from a question',
        category: CommandCategory.GRAPH_MUTATION,
        undoable: true,
        mutates_graph: true
    },

    validate(payload: UnlinkAnswerPayload): ValidationResult {
        // Validate question ID
        if (!payload.question_id) {
            return {
                valid: false,
                error: 'Question ID is required'
            };
        }

        // Check question exists and is a question
        const question = graph_store.nodes.find((n) => n.id === payload.question_id);
        if (!question) {
            return {
                valid: false,
                error: 'Question node not found'
            };
        }

        if (question.type !== NodeType.QUESTION) {
            return {
                valid: false,
                error: 'Node is not a question'
            };
        }

        // Check if question has an answer
        if (!question.answered_by) {
            return {
                valid: false,
                error: 'Question does not have an answer'
            };
        }

        return { valid: true };
    },

    async execute(payload: UnlinkAnswerPayload): Promise<CommandResult<UnlinkAnswerResult>> {
        try {
            const question = graph_store.nodes.find((n) => n.id === payload.question_id);
            if (!question || !question.answered_by) {
                return {
                    success: false,
                    error: 'Question not found or has no answer'
                };
            }

            const answer_id = question.answered_by;

            // Find and remove the answer connection
            const connection = graph_store.connections.find(
                (conn) =>
                    conn.type === ConnectionType.ANSWER &&
                    conn.sources.includes(answer_id) &&
                    conn.targets.includes(payload.question_id)
            );

            if (!connection) {
                return {
                    success: false,
                    error: 'Answer connection not found'
                };
            }

            const connection_id = connection.id!;
            graph_store.remove_connection(connection_id);

            // Update question to remove accepted answer
            graph_store.update_node(payload.question_id, {
                answered_by: undefined
            });

            return {
                success: true,
                data: {
                    question_id: payload.question_id,
                    answer_id,
                    connection_id
                },
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: 'Answer unlinked successfully',
                            type: 'success'
                        }
                    },
                    {
                        type: CommandEffectType.ANIMATION,
                        payload: {
                            type: 'fade_out',
                            target: connection_id,
                            duration: 200
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to unlink answer'
            };
        }
    },

    async undo(result: CommandResult<UnlinkAnswerResult>): Promise<CommandResult<void>> {
        if (!result.success || !result.data) {
            return {
                success: false,
                error: 'Cannot undo: invalid result data'
            };
        }

        try {
            const { question_id, answer_id } = result.data;

            // Recreate the answer connection
            const connection = graph_store.add_connection({
                type: ConnectionType.ANSWER,
                sources: [answer_id],
                targets: [question_id]
            });

            // Restore accepted answer link
            graph_store.update_node(question_id, {
                answered_by: answer_id
            });

            return {
                success: true,
                effects: [
                    {
                        type: CommandEffectType.TOAST,
                        payload: {
                            message: 'Answer unlink undone',
                            type: 'info'
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
                error: error instanceof Error ? error.message : 'Failed to undo answer unlink'
            };
        }
    }
};
