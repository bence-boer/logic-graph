/**
 * Central command registry.
 *
 * All commands are exported from this file and can be registered
 * with the command executor.
 */

// Command system types and infrastructure
export * from './types';
export * from './executor';
export * from './validator';
export { history_store } from '$lib/stores/history.svelte';

import { command_executor } from './executor';

// Graph mutation commands
import { create_node_command } from './graph/create-node';
import { update_node_command } from './graph/update-node';
import { delete_node_command } from './graph/delete-node';
import { pin_node_command } from './graph/pin-node';
import { create_connection_command } from './graph/create-connection';
import { delete_connection_command } from './graph/delete-connection';
import { link_answer_command, unlink_answer_command } from './graph/answer-management';

// Navigation commands
import {
    pan_command,
    zoom_command,
    zoom_in_command,
    zoom_out_command,
    zoom_reset_command,
    recenter_command,
    focus_node_command
} from './navigation/index';

// Selection commands
import {
    select_node_command,
    select_connection_command,
    clear_selection_command
} from './selection/index';

// UI commands
import {
    toggle_left_panel_command,
    open_left_panel_command,
    close_left_panel_command,
    close_right_panel_command,
    open_create_node_form_command,
    open_create_question_form_command,
    open_create_connection_form_command,
    open_edit_node_form_command,
    open_edit_connection_form_command
} from './ui/index';

// History commands
import { undo_command, redo_command, clear_history_command } from './history/index';

// Re-export all commands
export {
    create_node_command,
    update_node_command,
    delete_node_command,
    pin_node_command,
    create_connection_command,
    delete_connection_command,
    link_answer_command,
    unlink_answer_command,
    pan_command,
    zoom_command,
    zoom_in_command,
    zoom_out_command,
    zoom_reset_command,
    recenter_command,
    focus_node_command,
    select_node_command,
    select_connection_command,
    clear_selection_command,
    toggle_left_panel_command,
    open_left_panel_command,
    close_left_panel_command,
    close_right_panel_command,
    open_create_node_form_command,
    open_create_question_form_command,
    open_create_connection_form_command,
    open_edit_node_form_command,
    open_edit_connection_form_command,
    undo_command,
    redo_command,
    clear_history_command
};

// Re-export types
export type { CreateNodePayload, CreateNodeResult } from './graph/create-node';
export type { UpdateNodePayload, UpdateNodeResult } from './graph/update-node';
export type { DeleteNodePayload, DeleteNodeResult } from './graph/delete-node';
export type { PinNodePayload, PinNodeResult } from './graph/pin-node';
export type { CreateConnectionPayload, CreateConnectionResult } from './graph/create-connection';
export type { DeleteConnectionPayload, DeleteConnectionResult } from './graph/delete-connection';
export type {
    LinkAnswerPayload,
    LinkAnswerResult,
    UnlinkAnswerPayload,
    UnlinkAnswerResult
} from './graph/answer-management';
export type { PanPayload, ZoomPayload, FocusNodePayload } from './navigation/index';
export type {
    SelectNodePayload,
    SelectNodeResult,
    SelectConnectionPayload,
    SelectConnectionResult
} from './selection/index';
export type { OpenEditNodeFormPayload, OpenEditConnectionFormPayload } from './ui/index';

/**
 * Register all commands with the global command executor.
 *
 * Use this during application initialization to make all commands available.
 *
 * @example
 * ```ts
 * import { register_all_commands, command_executor } from '$lib/commands';
 *
 * register_all_commands();
 *
 * // Now commands can be executed
 * await command_executor.execute('graph.node.create', { statement: 'Test' });
 * ```
 */
export function register_all_commands(): void {
    // Graph mutation commands
    command_executor.register(create_node_command);
    command_executor.register(update_node_command);
    command_executor.register(delete_node_command);
    command_executor.register(pin_node_command);
    command_executor.register(create_connection_command);
    command_executor.register(delete_connection_command);
    command_executor.register(link_answer_command);
    command_executor.register(unlink_answer_command);

    // Navigation commands
    command_executor.register(pan_command);
    command_executor.register(zoom_command);
    command_executor.register(zoom_in_command);
    command_executor.register(zoom_out_command);
    command_executor.register(zoom_reset_command);
    command_executor.register(recenter_command);
    command_executor.register(focus_node_command);

    // Selection commands
    command_executor.register(select_node_command);
    command_executor.register(select_connection_command);
    command_executor.register(clear_selection_command);

    // UI commands
    command_executor.register(toggle_left_panel_command);
    command_executor.register(open_left_panel_command);
    command_executor.register(close_left_panel_command);
    command_executor.register(close_right_panel_command);
    command_executor.register(open_create_node_form_command);
    command_executor.register(open_create_question_form_command);
    command_executor.register(open_create_connection_form_command);
    command_executor.register(open_edit_node_form_command);
    command_executor.register(open_edit_connection_form_command);

    // History commands
    command_executor.register(undo_command);
    command_executor.register(redo_command);
    command_executor.register(clear_history_command);
}
