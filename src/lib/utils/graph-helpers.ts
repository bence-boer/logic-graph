/**
 * Graph helper utilities for node lookups and formatting
 *
 * This module provides utility functions for common graph operations
 * such as node lookups, connection formatting, and efficient data structures
 * for graph traversal and queries.
 */

import type { LogicNode, LogicConnection } from '$lib/types/graph';
import { ConnectionType } from '$lib/types/graph';

/**
 * Get a node's name by ID, with fallback
 *
 * Searches for a node by ID and returns its name. If the node is not found,
 * returns 'Unknown' as a fallback value to prevent rendering errors.
 *
 * @param node_id - The ID of the node to look up
 * @param nodes - Array of all nodes in the graph
 * @returns The name of the node, or 'Unknown' if not found
 *
 * @example
 * ```ts
 * const nodes = [{ id: '1', name: 'Node A', description: '' }];
 * const name = get_node_name('1', nodes); // Returns: 'Node A'
 * const missing = get_node_name('999', nodes); // Returns: 'Unknown'
 * ```
 */
export function get_node_name(node_id: string, nodes: LogicNode[]): string {
    return nodes.find((n) => n.id === node_id)?.name ?? 'Unknown';
}

/**
 * Format a connection for display
 *
 * Creates a human-readable string representation of a connection,
 * showing the source and target node names with an arrow indicating
 * the direction of the connection.
 *
 * @param connection - The connection to format
 * @param nodes - Array of all nodes in the graph
 * @returns Formatted string like "[Source1, Source2] → [Target1, Target2]"
 *
 * @example
 * ```ts
 * const connection = {
 *   id: '1',
 *   type: ConnectionType.IMPLICATION,
 *   sources: ['a', 'b'],
 *   targets: ['c']
 * };
 * const nodes = [
 *   { id: 'a', name: 'Alpha', description: '' },
 *   { id: 'b', name: 'Beta', description: '' },
 *   { id: 'c', name: 'Gamma', description: '' }
 * ];
 * const display = format_connection_display(connection, nodes);
 * // Returns: "[Alpha, Beta] → [Gamma]"
 * ```
 */
export function format_connection_display(connection: LogicConnection, nodes: LogicNode[]): string {
    const sources = connection.sources.map((id) => get_node_name(id, nodes)).join(', ');
    const targets = connection.targets.map((id) => get_node_name(id, nodes)).join(', ');
    return `[${sources}] → [${targets}]`;
}

/**
 * Format connection type for display
 *
 * Converts a ConnectionType enum value to a human-readable string.
 *
 * @param type - The connection type to format
 * @returns Human-readable connection type name
 *
 * @example
 * ```ts
 * format_connection_type(ConnectionType.IMPLICATION); // Returns: "Implication"
 * format_connection_type(ConnectionType.CONTRADICTION); // Returns: "Contradiction"
 * ```
 */
export function format_connection_type(type: ConnectionType): string {
    return type === ConnectionType.IMPLICATION ? 'Implication' : 'Contradiction';
}

/**
 * Create a lookup map for O(1) node access
 *
 * Creates a Map that allows fast lookup of nodes by ID. This is more
 * efficient than using array.find() repeatedly, especially for large graphs.
 *
 * Time Complexity: O(n) to build, O(1) for each lookup
 * Space Complexity: O(n)
 *
 * @param nodes - Array of nodes to index
 * @returns Map from node ID to node object
 *
 * @example
 * ```ts
 * const nodes = [
 *   { id: '1', name: 'Node A', description: '' },
 *   { id: '2', name: 'Node B', description: '' }
 * ];
 * const node_map = create_node_lookup_map(nodes);
 * const node = node_map.get('1'); // O(1) lookup
 * ```
 *
 * @see Use this when performing multiple lookups on the same node array
 */
export function create_node_lookup_map(nodes: LogicNode[]): Map<string, LogicNode> {
    return new Map(nodes.map((n) => [n.id, n]));
}

/**
 * Create a lookup map for O(1) connection access
 *
 * Creates a Map that allows fast lookup of connections by ID.
 *
 * Time Complexity: O(n) to build, O(1) for each lookup
 * Space Complexity: O(n)
 *
 * @param connections - Array of connections to index
 * @returns Map from connection ID to connection object
 *
 * @example
 * ```ts
 * const connections = [
 *   { id: '1', type: ConnectionType.IMPLICATION, sources: ['a'], targets: ['b'] }
 * ];
 * const conn_map = create_connection_lookup_map(connections);
 * const conn = conn_map.get('1'); // O(1) lookup
 * ```
 */
export function create_connection_lookup_map(
    connections: LogicConnection[]
): Map<string, LogicConnection> {
    return new Map(connections.map((c) => [c.id, c]));
}

/**
 * Check if a node exists in the graph
 *
 * @param node_id - The ID of the node to check
 * @param nodes - Array of all nodes in the graph
 * @returns True if the node exists, false otherwise
 *
 * @example
 * ```ts
 * const nodes = [{ id: '1', name: 'Node A', description: '' }];
 * node_exists('1', nodes); // Returns: true
 * node_exists('999', nodes); // Returns: false
 * ```
 */
export function node_exists(node_id: string, nodes: LogicNode[]): boolean {
    return nodes.some((n) => n.id === node_id);
}

/**
 * Get all nodes by their IDs
 *
 * Filters the node array to only include nodes with IDs in the provided list.
 * Preserves the order of the original nodes array.
 *
 * @param node_ids - Array of node IDs to retrieve
 * @param nodes - Array of all nodes in the graph
 * @returns Array of nodes matching the provided IDs
 *
 * @example
 * ```ts
 * const nodes = [
 *   { id: '1', name: 'Node A', description: '' },
 *   { id: '2', name: 'Node B', description: '' },
 *   { id: '3', name: 'Node C', description: '' }
 * ];
 * const selected = get_nodes_by_ids(['1', '3'], nodes);
 * // Returns: [{ id: '1', ... }, { id: '3', ... }]
 * ```
 */
export function get_nodes_by_ids(node_ids: string[], nodes: LogicNode[]): LogicNode[] {
    const id_set = new Set(node_ids);
    return nodes.filter((n) => id_set.has(n.id));
}

/**
 * Count connections of a specific type
 *
 * @param connections - Array of all connections in the graph
 * @param type - The connection type to count
 * @returns Number of connections matching the specified type
 *
 * @example
 * ```ts
 * const connections = [
 *   { id: '1', type: ConnectionType.IMPLICATION, sources: ['a'], targets: ['b'] },
 *   { id: '2', type: ConnectionType.CONTRADICTION, sources: ['c'], targets: ['d'] },
 *   { id: '3', type: ConnectionType.IMPLICATION, sources: ['e'], targets: ['f'] }
 * ];
 * count_connections_by_type(connections, ConnectionType.IMPLICATION); // Returns: 2
 * ```
 */
export function count_connections_by_type(
    connections: LogicConnection[],
    type: ConnectionType
): number {
    return connections.filter((c) => c.type === type).length;
}
