/**
 * UI control commands for managing panels and modals.
 *
 * These commands provide a unified interface for UI state management.
 */

import type { Command, CommandResult, ValidationResult } from '$lib/commands/types';
import { CommandCategory } from '$lib/commands/types';
import { ui_store } from '$lib/stores/ui.svelte';
import { graph_store } from '$lib/stores/graph.svelte';

/**
 * Command to toggle left panel.
 */
export const toggle_left_panel_command: Command<void, void> = {
    id: 'ui.panel.left.toggle',

    metadata: {
        name: 'Toggle Left Panel',
        description: 'Toggle the left panel open/closed',
        category: CommandCategory.UI_CONTROL,
        undoable: false,
        mutates_graph: false
    },

    validate(): ValidationResult {
        return { valid: true };
    },

    async execute(): Promise<CommandResult<void>> {
        try {
            ui_store.toggle_left_panel();
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to toggle left panel'
            };
        }
    }
};

/**
 * Command to open left panel.
 */
export const open_left_panel_command: Command<void, void> = {
    id: 'ui.panel.left.open',

    metadata: {
        name: 'Open Left Panel',
        description: 'Open the left panel',
        category: CommandCategory.UI_CONTROL,
        undoable: false,
        mutates_graph: false
    },

    validate(): ValidationResult {
        return { valid: true };
    },

    async execute(): Promise<CommandResult<void>> {
        try {
            ui_store.left_panel_open = true;
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to open left panel'
            };
        }
    }
};

/**
 * Command to close left panel.
 */
export const close_left_panel_command: Command<void, void> = {
    id: 'ui.panel.left.close',

    metadata: {
        name: 'Close Left Panel',
        description: 'Close the left panel',
        category: CommandCategory.UI_CONTROL,
        undoable: false,
        mutates_graph: false
    },

    validate(): ValidationResult {
        return { valid: true };
    },

    async execute(): Promise<CommandResult<void>> {
        try {
            ui_store.left_panel_open = false;
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to close left panel'
            };
        }
    }
};

/**
 * Command to close right panel.
 */
export const close_right_panel_command: Command<void, void> = {
    id: 'ui.panel.right.close',

    metadata: {
        name: 'Close Right Panel',
        description: 'Close the right panel',
        category: CommandCategory.UI_CONTROL,
        undoable: false,
        mutates_graph: false
    },

    validate(): ValidationResult {
        return { valid: true };
    },

    async execute(): Promise<CommandResult<void>> {
        try {
            ui_store.close_right_panel();
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to close right panel'
            };
        }
    }
};

/**
 * Command to open create node form.
 */
export const open_create_node_form_command: Command<void, void> = {
    id: 'ui.form.create_node.open',

    metadata: {
        name: 'Open Create Node Form',
        description: 'Open the form to create a new statement node',
        category: CommandCategory.UI_CONTROL,
        undoable: false,
        mutates_graph: false
    },

    validate(): ValidationResult {
        return { valid: true };
    },

    async execute(): Promise<CommandResult<void>> {
        try {
            ui_store.open_create_node_form();
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to open create node form'
            };
        }
    }
};

/**
 * Command to open create question form.
 */
export const open_create_question_form_command: Command<void, void> = {
    id: 'ui.form.create_question.open',

    metadata: {
        name: 'Open Create Question Form',
        description: 'Open the form to create a new question node',
        category: CommandCategory.UI_CONTROL,
        undoable: false,
        mutates_graph: false
    },

    validate(): ValidationResult {
        return { valid: true };
    },

    async execute(): Promise<CommandResult<void>> {
        try {
            ui_store.open_create_question_form();
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error ? error.message : 'Failed to open create question form'
            };
        }
    }
};

/**
 * Command to open create connection form.
 */
export const open_create_connection_form_command: Command<void, void> = {
    id: 'ui.form.create_connection.open',

    metadata: {
        name: 'Open Create Connection Form',
        description: 'Open the form to create a new connection',
        category: CommandCategory.UI_CONTROL,
        undoable: false,
        mutates_graph: false
    },

    validate(): ValidationResult {
        return { valid: true };
    },

    async execute(): Promise<CommandResult<void>> {
        try {
            ui_store.open_create_connection_form();
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error ? error.message : 'Failed to open create connection form'
            };
        }
    }
};

/**
 * Payload for opening edit node form.
 */
export interface OpenEditNodeFormPayload {
    /** ID of node to edit */
    node_id: string;
}

/**
 * Command to open edit node form.
 */
export const open_edit_node_form_command: Command<OpenEditNodeFormPayload, void> = {
    id: 'ui.form.edit_node.open',

    metadata: {
        name: 'Open Edit Node Form',
        description: 'Open the form to edit a node',
        category: CommandCategory.UI_CONTROL,
        undoable: false,
        mutates_graph: false
    },

    validate(payload: OpenEditNodeFormPayload): ValidationResult {
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

    async execute(payload: OpenEditNodeFormPayload): Promise<CommandResult<void>> {
        try {
            const node = graph_store.nodes.find((n) => n.id === payload.node_id);
            if (!node) {
                return {
                    success: false,
                    error: 'Node not found'
                };
            }

            // Check if it's a question node
            if (node.type === 'question') {
                ui_store.open_edit_question_form(payload.node_id);
            } else {
                ui_store.open_edit_node_form(payload.node_id);
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to open edit node form'
            };
        }
    }
};

/**
 * Payload for opening edit connection form.
 */
export interface OpenEditConnectionFormPayload {
    /** ID of connection to edit */
    connection_id: string;
}

/**
 * Command to open edit connection form.
 */
export const open_edit_connection_form_command: Command<OpenEditConnectionFormPayload, void> = {
    id: 'ui.form.edit_connection.open',

    metadata: {
        name: 'Open Edit Connection Form',
        description: 'Open the form to edit a connection',
        category: CommandCategory.UI_CONTROL,
        undoable: false,
        mutates_graph: false
    },

    validate(payload: OpenEditConnectionFormPayload): ValidationResult {
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

    async execute(payload: OpenEditConnectionFormPayload): Promise<CommandResult<void>> {
        try {
            ui_store.open_edit_connection_form(payload.connection_id);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error ? error.message : 'Failed to open edit connection form'
            };
        }
    }
};
