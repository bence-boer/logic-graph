import { graph_store } from '$lib/stores/graph.svelte';
import { toast_store } from '$lib/stores/toast.svelte';
import { ui_store } from '$lib/stores/ui.svelte';
import { selection_store } from '$lib/stores/selection.svelte';
import { ConnectionType } from '$lib/types/graph';
import type { LogicNode } from '$lib/types/graph';

/**
 * Validates and saves node statement and details updates.
 *
 * @param node - The node being edited
 * @param statement - The new statement value
 * @param details - The new details value
 *
 * @example
 * ```ts
 * save_node_changes(node, 'New Statement', 'New details');
 * ```
 */
export function save_node_changes(node: LogicNode, statement: string, details: string): void {
    if (!statement.trim()) {
        toast_store.error('Statement is required');
        return;
    }

    if (statement.length > 100) {
        toast_store.error('Statement must be 100 characters or less');
        return;
    }

    if (details.length > 500) {
        toast_store.error('Statement details must be 500 characters or less');
        return;
    }

    graph_store.update_node(node.id, {
        statement: statement.trim(),
        details: details.trim()
    });

    toast_store.success(`Statement "${statement.trim()}" updated successfully`);
}

/**
 * Toggles the pin state of a node.
 *
 * Pinned nodes have their position fixed at their current coordinates.
 * Unpinned nodes can be moved by the force simulation.
 *
 * @param node_id - The ID of the node to pin or unpin
 *
 * @example
 * ```ts
 * toggle_node_pin('node-123');
 * ```
 */
export function toggle_node_pin(node_id: string): void {
    const node = graph_store.nodes.find((n) => n.id === node_id);
    if (!node) {
        toast_store.error('Statement not found');
        return;
    }

    if (node.fx !== null && node.fx !== undefined) {
        // Unpin: remove fixed position
        graph_store.update_node(node.id, { fx: null, fy: null });
        toast_store.info(`Statement "${node.statement}" unpinned`);
    } else {
        // Pin: set fixed position to current position
        // Note: x and y should be set by the simulation sync process
        if (
            node.x === undefined ||
            node.x === null ||
            node.y === undefined ||
            node.y === null ||
            Number.isNaN(node.x) ||
            Number.isNaN(node.y)
        ) {
            // This should rarely happen now that we sync positions periodically
            toast_store.warning(
                'Node position not yet available. Please wait a moment and try again.'
            );
            return;
        }
        graph_store.update_node(node.id, { fx: node.x, fy: node.y });
        toast_store.info(`Statement "${node.statement}" pinned`);
    }
}

/**
 * Deletes a node after user confirmation.
 *
 * @param node - The node to delete
 * @param on_deleted - Callback function to execute after successful deletion
 *
 * @example
 * ```ts
 * delete_node_with_confirmation(node, () => close_panel());
 * ```
 */
export function delete_node_with_confirmation(node: LogicNode, on_deleted: () => void): void {
    if (confirm(`Delete statement "${node.statement}"?`)) {
        graph_store.remove_node(node.id);
        toast_store.success(`Statement "${node.statement}" deleted`);
        on_deleted();
    }
}

/**
 * Creates a new connection between nodes.
 *
 * Handles both existing and new node connections. When creating a new node,
 * it will be added to the graph first, then connected.
 *
 * @param current_node - The current node being edited
 * @param connection_type - Type of connection (IMPLICATION or CONTRADICTION)
 * @param sources - Array of node IDs for sources ('current' or 'target' are special values)
 * @param targets - Array of node IDs for targets ('current' or 'target' are special values)
 * @param mode - Whether connecting to 'existing' node or 'new' node
 * @param selected_node_id - ID of selected existing node (when mode is 'existing')
 * @param new_node_statement - Statement for new node (when mode is 'new')
 * @param all_nodes - Array of all nodes in the graph
 * @returns Object with success status and optional error message
 *
 * @example
 * ```ts
 * const result = create_node_connection(
 *   node,
 *   ConnectionType.IMPLICATION,
 *   ['current'],
 *   ['target'],
 *   'existing',
 *   'node123',
 *   '',
 *   graph_store.nodes
 * );
 * ```
 */
export function create_node_connection(
    current_node: LogicNode,
    connection_type: ConnectionType,
    sources: string[],
    targets: string[],
    mode: 'existing' | 'new',
    selected_node_id: string,
    new_node_statement: string,
    all_nodes: LogicNode[]
): { success: boolean; error?: string; target_statement?: string } {
    let target_node_id: string;
    let target_statement: string;

    if (mode === 'new') {
        if (!new_node_statement.trim()) {
            return { success: false, error: 'Statement is required' };
        }
        const new_node = graph_store.add_node({
            statement: new_node_statement.trim(),
            details: ''
        });
        target_node_id = new_node.id;
        target_statement = new_node_statement.trim();
    } else {
        if (!selected_node_id) {
            return { success: false, error: 'No node selected' };
        }
        target_node_id = selected_node_id;
        const selected_node = all_nodes.find((n) => n.id === selected_node_id);
        target_statement = selected_node?.statement || 'Unknown';
    }

    const actual_sources = sources.map((id) =>
        id === 'current' ? current_node.id : id === 'target' ? target_node_id : id
    );
    const actual_targets = targets.map((id) =>
        id === 'current' ? current_node.id : id === 'target' ? target_node_id : id
    );

    graph_store.add_connection({
        type: connection_type,
        sources: actual_sources,
        targets: actual_targets
    });

    const type_name =
        connection_type === ConnectionType.IMPLICATION
            ? sources[0] === 'target'
                ? 'Reason'
                : 'Consequence'
            : 'Contradiction';

    toast_store.success(`${type_name} "${target_statement}" added to "${current_node.statement}"`);

    return { success: true, target_statement };
}

/**
 * Navigates to a connected node's edit form.
 *
 * @param node_id - ID of the node to navigate to
 *
 * @example
 * ```ts
 * navigate_to_node('node123');
 * ```
 */
export function navigate_to_node(node_id: string): void {
    selection_store.select_node(node_id);
    ui_store.open_edit_node_form(node_id);
}

/**
 * Deletes a connection after user confirmation.
 *
 * @param connection_id - ID of the connection to delete
 * @param current_node_name - Name of the current node
 * @param connected_node_name - Name of the connected node
 *
 * @example
 * ```ts
 * delete_connection_with_confirmation('conn123', 'Node A', 'Node B');
 * ```
 */
export function delete_connection_with_confirmation(
    connection_id: string,
    current_node_name: string,
    connected_node_name: string
): void {
    if (confirm(`Delete connection between "${current_node_name}" and "${connected_node_name}"?`)) {
        graph_store.remove_connection(connection_id);
        toast_store.success(`Connection to "${connected_node_name}" deleted`);
    }
}

/**
 * Closes the right panel and clears selection.
 *
 * @example
 * ```ts
 * close_edit_form();
 * ```
 */
export function close_edit_form(): void {
    ui_store.close_right_panel();
    selection_store.clear_selection();
}
