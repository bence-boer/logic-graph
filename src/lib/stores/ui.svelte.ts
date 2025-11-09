/**
 * UI store using Svelte 5 runes
 * Manages UI state like panel visibility and settings
 */

import type { RightPanelMode } from '$lib/types/graph';
import { RightPanelModeType } from '$lib/types/graph';

/**
 * Check if the current viewport is mobile size
 */
function is_mobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
}

function create_ui_store() {
    // Close left panel by default on mobile
    let _left_panel_open = $state(!is_mobile());
    let _right_panel_mode = $state<RightPanelMode>({ type: RightPanelModeType.CLOSED });
    let _search_panel_open = $state(false);

    return {
        get left_panel_open() {
            return _left_panel_open;
        },
        set left_panel_open(value: boolean) {
            _left_panel_open = value;
        },

        get right_panel_mode() {
            return _right_panel_mode;
        },

        get right_panel_open() {
            return _right_panel_mode.type !== RightPanelModeType.CLOSED;
        },

        get search_panel_open() {
            return _search_panel_open;
        },
        set search_panel_open(value: boolean) {
            _search_panel_open = value;
        },

        toggle_left_panel(): void {
            _left_panel_open = !_left_panel_open;
        },

        toggle_right_panel(): void {
            if (_right_panel_mode.type === RightPanelModeType.CLOSED) {
                // Don't toggle open without context
                return;
            }
            _right_panel_mode = { type: RightPanelModeType.CLOSED };
        },

        open_create_node_form(): void {
            _right_panel_mode = { type: RightPanelModeType.CREATE_NODE };
        },

        open_create_connection_form(): void {
            _right_panel_mode = { type: RightPanelModeType.CREATE_CONNECTION };
        },

        open_edit_node_form(node_id: string): void {
            _right_panel_mode = { type: RightPanelModeType.EDIT_NODE, node_id };
        },

        open_edit_connection_form(connection_id: string): void {
            _right_panel_mode = { type: RightPanelModeType.EDIT_CONNECTION, connection_id };
        },

        close_right_panel(): void {
            _right_panel_mode = { type: RightPanelModeType.CLOSED };
        },

        toggle_search_panel(): void {
            _search_panel_open = !_search_panel_open;
        }
    };
}

export const ui_store = create_ui_store();
