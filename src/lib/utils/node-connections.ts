import type { LogicNode, LogicConnection } from '$lib/types/graph';
import { ConnectionType } from '$lib/types/graph';

/**
 * Represents a connection relationship between nodes.
 *
 * @property node_id - The ID of the related node
 * @property connection_id - The ID of the connection
 * @property key - Unique key for this relation (combination of connection_id and node_id)
 */
export interface NodeConnectionRelation {
    node_id: string;
    connection_id: string;
    key: string;
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
        .filter(
            (connection) =>
                connection.type === ConnectionType.IMPLICATION &&
                connection.targets.includes(node_id)
        )
        .flatMap((connection) =>
            connection.sources.map((source_id) => ({
                node_id: source_id,
                connection_id: connection.id!, // ID will always exist at runtime (normalized during import)
                key: `${connection.id}-${source_id}`
            }))
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
        .filter(
            (connection) =>
                connection.type === ConnectionType.IMPLICATION &&
                connection.sources.includes(node_id)
        )
        .flatMap((connection) =>
            connection.targets.map((target_id) => ({
                node_id: target_id,
                connection_id: connection.id!, // ID will always exist at runtime (normalized during import)
                key: `${connection.id}-${target_id}`
            }))
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
            (connection) =>
                connection.type === ConnectionType.CONTRADICTION &&
                (connection.sources.includes(node_id) || connection.targets.includes(node_id))
        )
        .flatMap((connection) => {
            // Get the other nodes (not the current node)
            const other_nodes = [...connection.sources, ...connection.targets].filter(
                (id) => id !== node_id
            );
            return other_nodes.map((other_id) => ({
                node_id: other_id,
                connection_id: connection.id!, // ID will always exist at runtime (normalized during import)
                key: `${connection.id}-${other_id}`
            }));
        });
}

/**
 * Gets all answer nodes for a question node.
 *
 * Answers are connections where statement nodes answer a question node.
 * A question should have at most one answer.
 *
 * @param node_id - The ID of the question node to find answers for
 * @param connections - Array of all connections in the graph
 * @returns Array of connections representing answers
 *
 * @example
 * ```ts
 * const answers = get_node_answers('question123', all_connections);
 * // Returns: [{ node_id: 'statement1', connection_id: 'conn4' }]
 * ```
 */
export function get_node_answers(
    node_id: string,
    connections: LogicConnection[]
): NodeConnectionRelation[] {
    return connections
        .filter(
            (connection) =>
                connection.type === ConnectionType.ANSWER && connection.sources.includes(node_id)
        )
        .flatMap((connection) =>
            connection.targets.map((target_id) => ({
                node_id: target_id,
                connection_id: connection.id!, // ID will always exist at runtime (normalized during import)
                key: `${connection.id}-${target_id}`
            }))
        );
}

/**
 * Gets all question nodes that a statement node answers.
 *
 * Questions are connections where the current statement node is the answer.
 *
 * @param node_id - The ID of the statement node
 * @param connections - Array of all connections in the graph
 * @returns Array of connections representing questions
 *
 * @example
 * ```ts
 * const questions = get_node_questions('statement123', all_connections);
 * // Returns: [{ node_id: 'question1', connection_id: 'conn5' }, ...]
 * ```
 */
export function get_node_questions(
    node_id: string,
    connections: LogicConnection[]
): NodeConnectionRelation[] {
    return connections
        .filter(
            (connection) =>
                connection.type === ConnectionType.ANSWER && connection.targets.includes(node_id)
        )
        .flatMap((connection) =>
            connection.sources.map((source_id) => ({
                node_id: source_id,
                connection_id: connection.id!, // ID will always exist at runtime (normalized during import)
                key: `${connection.id}-${source_id}`
            }))
        );
}

/**
 * Gets available nodes for creating connections (excludes the current node).
 *
 * @param current_node_id - The ID of the current node to exclude
 * @param all_nodes - Array of all nodes in the graph
 * @returns Array of objects with value (node ID) and label (node statement) for use in Select components
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
        .filter((node) => node.id !== current_node_id)
        .map((node) => ({ value: node.id, label: node.statement }));
}

/**
 * Gets available nodes for creating connections filtered by connection type.
 *
 * Different connection types have different requirements:
 * - IMPLICATION (reasons/consequences): Only statement nodes
 * - CONTRADICTION: Only statement nodes
 * - ANSWER: Only statement nodes (as answers to questions)
 *
 * @param current_node_id - The ID of the current node to exclude
 * @param all_nodes - Array of all nodes in the graph
 * @param connection_type - The type of connection being created
 * @returns Array of objects with value (node ID) and label (node statement) for use in Select components
 *
 * @example
 * ```ts
 * const options = get_available_nodes_by_type('node123', all_nodes, ConnectionType.IMPLICATION);
 * // Returns: [{ value: 'node456', label: 'Some Statement' }, ...]
 * ```
 */
export function get_available_nodes_by_type(
    current_node_id: string,
    all_nodes: LogicNode[],
    connection_type: ConnectionType
): Array<{ value: string; label: string }> {
    return all_nodes
        .filter((node) => {
            // Exclude current node
            if (node.id === current_node_id) return false;

            // For implications and contradictions, only include statement nodes
            if (
                connection_type === ConnectionType.IMPLICATION ||
                connection_type === ConnectionType.CONTRADICTION
            ) {
                return node.type !== 'question';
            }

            // For answers, only include statement nodes
            if (connection_type === ConnectionType.ANSWER) {
                return node.type !== 'question';
            }

            // Default: include all nodes
            return true;
        })
        .map((node) => ({ value: node.id, label: node.statement }));
}
