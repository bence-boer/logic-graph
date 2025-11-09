import { graph_store } from '$lib/stores/graph.svelte';
import { selection_store } from '$lib/stores/selection.svelte';
import { ui_store } from '$lib/stores/ui.svelte';
import { trigger_import_dialog } from './import';
import { download_graph_as_json } from './export';

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    description: string;
    action: () => void | Promise<void>;
}

export const keyboard_shortcuts: KeyboardShortcut[] = [
    {
        key: '?',
        description: 'Show keyboard shortcuts',
        action: () => {
            // This will be handled by the main page to open the help modal
            window.dispatchEvent(new CustomEvent('show-help'));
        }
    },
    {
        key: 'Escape',
        description: 'Clear selection',
        action: () => {
            selection_store.clear_selection();
        }
    },
    {
        key: 'Delete',
        description: 'Delete selected node or connection',
        action: () => {
            const selected_id = selection_store.id;
            const selected_type = selection_store.type;

            if (!selected_id || !selected_type) return;

            if (selected_type === 'node') {
                const node = graph_store.nodes.find((n) => n.id === selected_id);
                if (node && confirm(`Delete node "${node.name}"?`)) {
                    graph_store.remove_node(selected_id);
                    selection_store.clear_selection();
                }
            } else if (selected_type === 'connection') {
                if (confirm('Delete this connection?')) {
                    graph_store.remove_connection(selected_id);
                    selection_store.clear_selection();
                }
            }
        }
    },
    {
        key: 'Backspace',
        description: 'Delete selected node or connection',
        action: () => {
            // Same as Delete
            const shortcut = keyboard_shortcuts.find((s) => s.key === 'Delete');
            if (shortcut) shortcut.action();
        }
    },
    {
        key: 'n',
        ctrl: true,
        description: 'Add new node',
        action: () => {
            ui_store.open_create_node_form();
        }
    },
    {
        key: 's',
        ctrl: true,
        description: 'Save graph as JSON',
        action: async () => {
            const graph = graph_store.get_graph();
            download_graph_as_json(graph);
        }
    },
    {
        key: 'o',
        ctrl: true,
        description: 'Open JSON file',
        action: async () => {
            try {
                await trigger_import_dialog();
            } catch (error) {
                console.error('Failed to import file:', error);
            }
        }
    },
    {
        key: 'f',
        ctrl: true,
        description: 'Toggle search panel',
        action: () => {
            ui_store.toggle_search_panel();
        }
    },
    {
        key: 'l',
        ctrl: true,
        description: 'Toggle left panel',
        action: () => {
            ui_store.toggle_left_panel();
        }
    },
    {
        key: 'r',
        ctrl: true,
        description: 'Toggle right panel',
        action: () => {
            ui_store.toggle_right_panel();
        }
    },
    {
        key: 'a',
        ctrl: true,
        description: 'Add new node',
        action: () => {
            const shortcut = keyboard_shortcuts.find((s) => s.key === 'n' && s.ctrl);
            if (shortcut) shortcut.action();
        }
    }
];

export function handle_keyboard_event(event: KeyboardEvent): boolean {
    // Don't handle shortcuts when typing in inputs
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // Allow Escape to clear focus
        if (event.key === 'Escape') {
            (event.target as HTMLElement).blur();
            return true;
        }
        return false;
    }

    const matching_shortcut = keyboard_shortcuts.find((shortcut) => {
        const key_matches = shortcut.key.toLowerCase() === event.key.toLowerCase();
        const ctrl_matches = shortcut.ctrl
            ? event.ctrlKey || event.metaKey
            : !event.ctrlKey && !event.metaKey;
        const alt_matches = shortcut.alt ? event.altKey : !event.altKey;
        const shift_matches = shortcut.shift ? event.shiftKey : !event.shiftKey;

        return key_matches && ctrl_matches && alt_matches && shift_matches;
    });

    if (matching_shortcut) {
        event.preventDefault();
        matching_shortcut.action();
        return true;
    }

    return false;
}

export function get_shortcut_display(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    parts.push(shortcut.key);

    return parts.join('+');
}
