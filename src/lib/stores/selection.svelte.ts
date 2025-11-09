/**
 * Selection store using Svelte 5 runes
 * Manages the currently selected node or connection
 */

import type { SelectionType } from '$lib/types/graph';

function create_selection_store() {
    let _selected_type = $state<SelectionType>(null);
    let _selected_id = $state<string | null>(null);

    return {
        get type() {
            return _selected_type;
        },
        get id() {
            return _selected_id;
        },

        select_node(node_id: string): void {
            _selected_type = 'node';
            _selected_id = node_id;
        },

        select_connection(connection_id: string): void {
            _selected_type = 'connection';
            _selected_id = connection_id;
        },

        clear_selection(): void {
            _selected_type = null;
            _selected_id = null;
        },

        is_selected(id: string): boolean {
            return _selected_id === id;
        }
    };
}

export const selection_store = create_selection_store();
