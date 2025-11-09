import type { LogicNode, LogicConnection } from '$lib/types/graph';
import { ConnectionType } from '$lib/types/graph';

/**
 * Represents a connection relationship between nodes.
 *
 * @property node_id - The ID of the related node
 * @property connection_id - The ID of the connection
 */
export interface NodeConnectionRelation {
    node_id: string;
    connection_id: string;
}

/**
 * Gets all reason nodes (implications pointing to this node).
 *
 * Reasons are connections where other nodes imply the current node.
 * These represent supporting evidence or premises for the node.
 *
 * @param node_id - The ID of the node to find reasons for
 * @param connections - Array of all connections in the graph
 * @returns Array of connections representing reasons
 *
 * @example
 * ```ts
 * const reasons = get_node_reasons('node123', all_connections);
 * // Returns: [{ node_id: 'source1', connection_id: 'conn1' }, ...]
 * ```
 */
export function get_node_reasons(
    node_id: string,
    connections: LogicConnection[]
): NodeConnectionRelation[] {
    return connections
        .filter((c) => c.type === ConnectionType.IMPLICATION && c.targets.includes(node_id))
        .flatMap((c) =>
            c.sources.map((source_id) => ({ node_id: source_id, connection_id: c.id }))
        );
}

/**
 * Gets all consequence nodes (implications from this node).
 *
 * Consequences are connections where the current node implies other nodes.
 * These represent logical conclusions or results of the node.
 *
 * @param node_id - The ID of the node to find consequences for
 * @param connections - Array of all connections in the graph
 * @returns Array of connections representing consequences
 *
 * @example
 * ```ts
 * const consequences = get_node_consequences('node123', all_connections);
 * // Returns: [{ node_id: 'target1', connection_id: 'conn2' }, ...]
 * ```
 */
export function get_node_consequences(
    node_id: string,
    connections: LogicConnection[]
): NodeConnectionRelation[] {
    return connections
        .filter((c) => c.type === ConnectionType.IMPLICATION && c.sources.includes(node_id))
        .flatMap((c) =>
            c.targets.map((target_id) => ({ node_id: target_id, connection_id: c.id }))
        );
}

/**
 * Gets all contradiction nodes (contradictions with this node).
 *
 * Contradictions are bidirectional relationships where nodes are mutually exclusive.
 *
 * @param node_id - The ID of the node to find contradictions for
 * @param connections - Array of all connections in the graph
 * @returns Array of connections representing contradictions
 *
 * @example
 * ```ts
 * const contradictions = get_node_contradictions('node123', all_connections);
 * // Returns: [{ node_id: 'other1', connection_id: 'conn3' }, ...]
 * ```
 */
export function get_node_contradictions(
    node_id: string,
    connections: LogicConnection[]
): NodeConnectionRelation[] {
    return connections
        .filter(
            (c) =>
                c.type === ConnectionType.CONTRADICTION &&
                (c.sources.includes(node_id) || c.targets.includes(node_id))
        )
        .flatMap((c) => {
            // Get the other nodes (not the current node)
            const other_nodes = [...c.sources, ...c.targets].filter((id) => id !== node_id);
            return other_nodes.map((other_id) => ({ node_id: other_id, connection_id: c.id }));
        });
}

/**
 * Gets available nodes for creating connections (excludes the current node).
 *
 * @param current_node_id - The ID of the current node to exclude
 * @param all_nodes - Array of all nodes in the graph
 * @returns Array of objects with value (node ID) and label (node name) for use in Select components
 *
 * @example
 * ```ts
 * const options = get_available_nodes_for_connection('node123', all_nodes);
 * // Returns: [{ value: 'node456', label: 'Some Statement' }, ...]
 * ```
 */
export function get_available_nodes_for_connection(
    current_node_id: string,
    all_nodes: LogicNode[]
): Array<{ value: string; label: string }> {
    return all_nodes
        .filter((n) => n.id !== current_node_id)
        .map((n) => ({ value: n.id, label: n.name }));
}
