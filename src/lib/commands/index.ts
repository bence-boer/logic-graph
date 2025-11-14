/**
 * Central command registry.
 *
 * All commands are exported from this file and can be registered
 * with the command executor.
 */

// Graph mutation commands
import { link_answer_command, unlink_answer_command } from './graph/answer-management';
import { create_connection_command } from './graph/create-connection';
import { create_node_command } from './graph/create-node';
import { delete_connection_command } from './graph/delete-connection';
import { delete_node_command } from './graph/delete-node';
import { pin_node_command } from './graph/pin-node';
import { update_node_command } from './graph/update-node';
// History commands
import { clear_history_command, redo_command, undo_command } from './history/index';
// Navigation commands
import {
    focus_node_command,
    pan_command,
    recenter_command,
    zoom_command,
    zoom_in_command,
    zoom_out_command,
    zoom_reset_command
} from './navigation/index';
// Selection commands
import {
    clear_selection_command,
    select_connection_command,
    select_node_command
} from './selection/index';
// UI commands
import {
    close_left_panel_command,
    close_right_panel_command,
    open_create_connection_form_command,
    open_create_node_form_command,
    open_create_question_form_command,
    open_edit_connection_form_command,
    open_edit_node_form_command,
    open_left_panel_command,
    toggle_left_panel_command
} from './ui/index';

// Command system types and infrastructure
export * from './executor';
export * from './types';
export * from './validator';
export { history_store } from '$lib/stores/history.svelte';

// Re-export all commands
export {
    clear_history_command,
    clear_selection_command,
    close_left_panel_command,
    close_right_panel_command,
    create_connection_command,
    create_node_command,
    delete_connection_command,
    delete_node_command,
    focus_node_command,
    link_answer_command,
    open_create_connection_form_command,
    open_create_node_form_command,
    open_create_question_form_command,
    open_edit_connection_form_command,
    open_edit_node_form_command,
    open_left_panel_command,
    pan_command,
    pin_node_command,
    recenter_command,
    redo_command,
    select_connection_command,
    select_node_command,
    toggle_left_panel_command,
    undo_command,
    unlink_answer_command,
    update_node_command,
    zoom_command,
    zoom_in_command,
    zoom_out_command,
    zoom_reset_command
};

// Re-export types
export type {
    LinkAnswerPayload,
    LinkAnswerResult,
    UnlinkAnswerPayload,
    UnlinkAnswerResult
} from './graph/answer-management';
export type { CreateConnectionPayload, CreateConnectionResult } from './graph/create-connection';
export type { CreateNodePayload, CreateNodeResult } from './graph/create-node';
export type { DeleteConnectionPayload, DeleteConnectionResult } from './graph/delete-connection';
export type { DeleteNodePayload, DeleteNodeResult } from './graph/delete-node';
export type { PinNodePayload, PinNodeResult } from './graph/pin-node';
export type { UpdateNodePayload, UpdateNodeResult } from './graph/update-node';
export type { FocusNodePayload, PanPayload, ZoomPayload } from './navigation/index';
export type {
    SelectConnectionPayload,
    SelectConnectionResult,
    SelectNodePayload,
    SelectNodeResult
} from './selection/index';
export type { OpenEditConnectionFormPayload, OpenEditNodeFormPayload } from './ui/index';

function typed_from_entries<Entries extends readonly (readonly [string, unknown])[]>(
    entries: Entries
): {
    [EntryKey in Entries[number] as EntryKey[0] & string]: Extract<
        Entries[number],
        readonly [EntryKey[0], unknown]
    >[1];
} {
    /**
     * Create an object from entries while preserving literal key types from a readonly tuple array.
     *
     * This avoids widening keys to `string` which happens with the untyped `Object.fromEntries`.
     */
    return Object.fromEntries(entries as readonly (readonly [string, unknown])[]) as unknown as {
        [K in Entries[number] as K[0] & string]: Extract<
            Entries[number],
            readonly [K[0], unknown]
        >[1];
    };
}

export const commands = typed_from_entries(
    [
        // Graph mutation commands
        create_node_command,
        update_node_command,
        delete_node_command,
        pin_node_command,
        create_connection_command,
        delete_connection_command,
        link_answer_command,
        unlink_answer_command,

        // Navigation commands
        pan_command,
        zoom_command,
        zoom_in_command,
        zoom_out_command,
        zoom_reset_command,
        recenter_command,
        focus_node_command,

        // Selection commands
        select_node_command,
        select_connection_command,
        clear_selection_command,

        // UI commands
        toggle_left_panel_command,
        open_left_panel_command,
        close_left_panel_command,
        close_right_panel_command,
        open_create_node_form_command,
        open_create_question_form_command,
        open_create_connection_form_command,
        open_edit_node_form_command,
        open_edit_connection_form_command,

        // History commands
        undo_command,
        redo_command,
        clear_history_command
    ].map((command) => [command.id, command] as const)
);

export type CommandID = keyof typeof commands;
