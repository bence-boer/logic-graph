/**
 * Selection commands for managing selected nodes and connections.
 *
 * These commands provide a unified interface for selection state management.
 */

import type { Command, CommandResult, ValidationResult } from '$lib/commands/types';
import { CommandCategory, CommandEffectType } from '$lib/commands/types';
import { selection_store } from '$lib/stores/selection.svelte';
import { graph_store } from '$lib/stores/graph.svelte';
import { SelectionTypeEnum } from '$lib/types/graph';

/**
 * Payload for selecting a node.
 */
export interface SelectNodePayload {
    /** ID of node to select */
    node_id: string;
}

/**
 * Result data from selecting a node.
 */
export interface SelectNodeResult {
    /** Previously selected type */
    previous_type: string | null;
    /** Previously selected ID */
    previous_id: string | null;
}

/**
 * Command to select a node.
 */
export const select_node_command: Command<SelectNodePayload, SelectNodeResult> = {
    id: 'selection.node.select',

    metadata: {
        name: 'Select Node',
        description: 'Select a node',
        category: CommandCategory.SELECTION,
        undoable: true,
        mutates_graph: false
    },

    validate(payload: SelectNodePayload): ValidationResult {
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

    async execute(payload: SelectNodePayload): Promise<CommandResult<SelectNodeResult>> {
        try {
            // Store previous selection for undo
            const previous_type = selection_store.type;
            const previous_id = selection_store.id;

            // Set new selection
            selection_store.select_node(payload.node_id);

            return {
                success: true,
                data: {
                    previous_type,
                    previous_id
                },
                effects: [
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
                error: error instanceof Error ? error.message : 'Failed to select node'
            };
        }
    },

    async undo(result: CommandResult<SelectNodeResult>): Promise<CommandResult<void>> {
        if (!result.success || !result.data) {
            return {
                success: false,
                error: 'Cannot undo: invalid result data'
            };
        }

        try {
            // Restore previous selection
            if (result.data.previous_type === null || result.data.previous_id === null) {
                selection_store.clear_selection();
            } else if (result.data.previous_type === SelectionTypeEnum.NODE) {
                selection_store.select_node(result.data.previous_id);
            } else if (result.data.previous_type === SelectionTypeEnum.CONNECTION) {
                selection_store.select_connection(result.data.previous_id);
            }

            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to undo selection'
            };
        }
    }
};

/**
 * Payload for selecting a connection.
 */
export interface SelectConnectionPayload {
    /** ID of connection to select */
    connection_id: string;
}

/**
 * Result data from selecting a connection.
 */
export interface SelectConnectionResult {
    /** Previously selected type */
    previous_type: string | null;
    /** Previously selected ID */
    previous_id: string | null;
}

/**
 * Command to select a connection.
 */
export const select_connection_command: Command<SelectConnectionPayload, SelectConnectionResult> = {
    id: 'selection.connection.select',

    metadata: {
        name: 'Select Connection',
        description: 'Select a connection',
        category: CommandCategory.SELECTION,
        undoable: true,
        mutates_graph: false
    },

    validate(payload: SelectConnectionPayload): ValidationResult {
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
        payload: SelectConnectionPayload
    ): Promise<CommandResult<SelectConnectionResult>> {
        try {
            // Store previous selection for undo
            const previous_type = selection_store.type;
            const previous_id = selection_store.id;

            // Set new selection
            selection_store.select_connection(payload.connection_id);

            return {
                success: true,
                data: {
                    previous_type,
                    previous_id
                },
                effects: [
                    {
                        type: CommandEffectType.ANIMATION,
                        payload: {
                            type: 'highlight',
                            target: payload.connection_id,
                            duration: 200
                        }
                    }
                ]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to select connection'
            };
        }
    },

    async undo(result: CommandResult<SelectConnectionResult>): Promise<CommandResult<void>> {
        if (!result.success || !result.data) {
            return {
                success: false,
                error: 'Cannot undo: invalid result data'
            };
        }

        try {
            // Restore previous selection
            if (result.data.previous_type === null || result.data.previous_id === null) {
                selection_store.clear_selection();
            } else if (result.data.previous_type === SelectionTypeEnum.NODE) {
                selection_store.select_node(result.data.previous_id);
            } else if (result.data.previous_type === SelectionTypeEnum.CONNECTION) {
                selection_store.select_connection(result.data.previous_id);
            }

            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to undo selection'
            };
        }
    }
};

/**
 * Command to clear selection.
 */
export const clear_selection_command: Command<void, SelectNodeResult> = {
    id: 'selection.clear',

    metadata: {
        name: 'Clear Selection',
        description: 'Clear current selection',
        category: CommandCategory.SELECTION,
        undoable: true,
        mutates_graph: false
    },

    validate(): ValidationResult {
        return { valid: true };
    },

    async execute(): Promise<CommandResult<SelectNodeResult>> {
        try {
            // Store previous selection for undo
            const previous_type = selection_store.type;
            const previous_id = selection_store.id;

            // Clear selection
            selection_store.clear_selection();

            return {
                success: true,
                data: {
                    previous_type,
                    previous_id
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to clear selection'
            };
        }
    },

    async undo(result: CommandResult<SelectNodeResult>): Promise<CommandResult<void>> {
        if (!result.success || !result.data) {
            return {
                success: false,
                error: 'Cannot undo: invalid result data'
            };
        }

        try {
            // Restore previous selection
            if (result.data.previous_type === null || result.data.previous_id === null) {
                // Was already cleared, nothing to restore
                return { success: true };
            } else if (result.data.previous_type === SelectionTypeEnum.NODE) {
                selection_store.select_node(result.data.previous_id);
            } else if (result.data.previous_type === SelectionTypeEnum.CONNECTION) {
                selection_store.select_connection(result.data.previous_id);
            }

            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to undo clear selection'
            };
        }
    }
};
