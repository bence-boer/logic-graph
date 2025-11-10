import { graph_store } from '$lib/stores/graph.svelte';
import { selection_store } from '$lib/stores/selection.svelte';
import { ui_store } from '$lib/stores/ui.svelte';
import { toast_store } from '$lib/stores/toast.svelte';
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
        description: 'Clear selection / Close panel',
        action: () => {
            const mode = ui_store.right_panel_mode;
            if (mode.type !== 'closed') {
                ui_store.close_right_panel();
            }
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
                if (node && confirm(`Delete node "${node.statement}"?`)) {
                    graph_store.remove_node(selected_id);
                    toast_store.success(`Statement "${node.statement}" deleted`);
                    selection_store.clear_selection();
                }
            } else if (selected_type === 'connection') {
                const connection = graph_store.connections.find(
                    (connection) => connection.id === selected_id
                );
                if (connection) {
                    const source_names = connection.sources
                        .map(
                            (id) =>
                                graph_store.nodes.find((n) => n.id === id)?.statement || 'Unknown'
                        )
                        .join(', ');
                    const target_names = connection.targets
                        .map(
                            (id) =>
                                graph_store.nodes.find((n) => n.id === id)?.statement || 'Unknown'
                        )
                        .join(', ');

                    if (confirm(`Delete connection?\n[${source_names}] → [${target_names}]`)) {
                        graph_store.remove_connection(selected_id);
                        toast_store.success(
                            `Connection deleted: [${source_names}] → [${target_names}]`
                        );
                        selection_store.clear_selection();
                    }
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
        description: 'Create new node',
        action: () => {
            ui_store.open_create_node_form();
        }
    },
    {
        key: 'c',
        ctrl: true,
        shift: true,
        description: 'Create new connection',
        action: () => {
            if (graph_store.nodes.length < 2) {
                toast_store.error('You need at least 2 nodes to create a connection');
                return;
            }
            ui_store.open_create_connection_form();
        }
    },
    {
        key: 's',
        ctrl: true,
        description: 'Save graph as JSON',
        action: async () => {
            const graph = graph_store.get_graph();
            const node_count = graph.nodes?.length || 0;
            const connection_count = graph.connections?.length || 0;
            download_graph_as_json(graph);
            toast_store.success(
                `Graph saved: ${node_count} statements, ${connection_count} connections`
            );
        }
    },
    {
        key: 'o',
        ctrl: true,
        description: 'Open JSON file',
        action: async () => {
            try {
                const graph = await trigger_import_dialog();
                if (graph) {
                    const node_count = graph.nodes?.length || 0;
                    const connection_count = graph.connections?.length || 0;
                    toast_store.success(
                        `Graph imported: ${node_count} statements, ${connection_count} connections`
                    );
                }
            } catch (error) {
                console.error('Failed to import file:', error);
                toast_store.error('Failed to import graph file');
            }
        }
    },
    {
        key: 'f',
        ctrl: true,
        description: 'Toggle left panel (search)',
        action: () => {
            ui_store.toggle_left_panel();
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
        description: 'Close right panel',
        action: () => {
            ui_store.close_right_panel();
        }
    },
    {
        key: 'a',
        ctrl: true,
        description: 'Create new node',
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
