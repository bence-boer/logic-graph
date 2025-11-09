/**
 * Graph algorithm utilities for efficient graph traversal and analysis
 *
 * This module provides advanced graph algorithms with caching and optimized
 * data structures for better performance on large graphs.
 */

import type { LogicConnection, LogicNode } from '$lib/types/graph';

/**
 * Efficient graph topology analysis with caching
 *
 * This class builds an adjacency map for fast neighbor lookups and
 * provides various graph analysis methods. The adjacency map is built
 * once during construction, allowing O(1) lookups afterward.
 *
 * Use this class when you need to perform multiple queries on the same
 * graph structure. For one-off queries, direct array operations may be simpler.
 *
 * Time Complexity:
 * - Construction: O(E) where E is the number of connections
 * - get_neighbors: O(1)
 * - get_degree: O(1)
 *
 * Space Complexity: O(V + E) where V is nodes, E is connections
 *
 * @example
 * ```ts
 * const connections = [
 *   { id: '1', sources: ['a', 'b'], targets: ['c'], type: ConnectionType.IMPLICATION }
 * ];
 * const topology = new GraphTopology(connections);
 * const neighbors = topology.get_neighbors('a'); // Returns: Set(['b', 'c'])
 * const degree = topology.get_degree('a'); // Returns: 2
 * ```
 */
export class GraphTopology {
    private adjacency_map: Map<string, Set<string>>;

    /**
     * Construct a new GraphTopology analyzer
     *
     * @param connections - Array of connections to analyze
     */
    constructor(connections: LogicConnection[]) {
        this.adjacency_map = this.build_adjacency_map(connections);
    }

    /**
     * Build the adjacency map from connections
     *
     * Creates a bidirectional adjacency map where each node maps to all
     * nodes it's connected to (regardless of direction). This allows
     * efficient neighbor queries for graph visualization and highlighting.
     *
     * @param connections - Array of connections to process
     * @returns Map from node ID to set of connected node IDs
     */
    private build_adjacency_map(connections: LogicConnection[]): Map<string, Set<string>> {
        const map = new Map<string, Set<string>>();

        for (const conn of connections) {
            // Add bidirectional edges for each source-target pair
            for (const source of conn.sources) {
                if (!map.has(source)) map.set(source, new Set());
                for (const target of conn.targets) {
                    map.get(source)!.add(target);
                }
                // Add other sources as neighbors (for multi-source connections)
                for (const other_source of conn.sources) {
                    if (other_source !== source) {
                        map.get(source)!.add(other_source);
                    }
                }
            }

            for (const target of conn.targets) {
                if (!map.has(target)) map.set(target, new Set());
                for (const source of conn.sources) {
                    map.get(target)!.add(source);
                }
                // Add other targets as neighbors (for multi-target connections)
                for (const other_target of conn.targets) {
                    if (other_target !== target) {
                        map.get(target)!.add(other_target);
                    }
                }
            }
        }

        return map;
    }

    /**
     * Get all neighboring nodes
     *
     * Returns all nodes that are directly connected to the specified node,
     * regardless of connection direction or type.
     *
     * Time Complexity: O(1)
     *
     * @param node_id - The ID of the node to query
     * @returns Set of connected node IDs (empty set if node has no connections)
     *
     * @example
     * ```ts
     * const topology = new GraphTopology([
     *   { id: '1', sources: ['a'], targets: ['b', 'c'], type: ConnectionType.IMPLICATION }
     * ]);
     * topology.get_neighbors('a'); // Returns: Set(['b', 'c'])
     * topology.get_neighbors('b'); // Returns: Set(['a', 'c'])
     * topology.get_neighbors('z'); // Returns: Set() (empty)
     * ```
     */
    get_neighbors(node_id: string): Set<string> {
        return this.adjacency_map.get(node_id) ?? new Set();
    }

    /**
     * Get node degree (number of connections)
     *
     * Returns the number of unique nodes connected to the specified node.
     * This is equivalent to the size of the neighbor set.
     *
     * Time Complexity: O(1)
     *
     * @param node_id - The ID of the node to query
     * @returns Number of connected nodes (0 if node has no connections)
     *
     * @example
     * ```ts
     * const topology = new GraphTopology([
     *   { id: '1', sources: ['a'], targets: ['b', 'c'], type: ConnectionType.IMPLICATION }
     * ]);
     * topology.get_degree('a'); // Returns: 2
     * topology.get_degree('b'); // Returns: 2
     * topology.get_degree('z'); // Returns: 0
     * ```
     */
    get_degree(node_id: string): number {
        return this.get_neighbors(node_id).size;
    }

    /**
     * Check if two nodes are directly connected
     *
     * @param node_a - First node ID
     * @param node_b - Second node ID
     * @returns True if the nodes are directly connected
     *
     * @example
     * ```ts
     * const topology = new GraphTopology([
     *   { id: '1', sources: ['a'], targets: ['b'], type: ConnectionType.IMPLICATION }
     * ]);
     * topology.are_connected('a', 'b'); // Returns: true
     * topology.are_connected('a', 'z'); // Returns: false
     * ```
     */
    are_connected(node_a: string, node_b: string): boolean {
        const neighbors = this.get_neighbors(node_a);
        return neighbors.has(node_b);
    }

    /**
     * Get all nodes that have at least one connection
     *
     * @returns Set of all node IDs that appear in at least one connection
     *
     * @example
     * ```ts
     * const topology = new GraphTopology([
     *   { id: '1', sources: ['a'], targets: ['b'], type: ConnectionType.IMPLICATION },
     *   { id: '2', sources: ['c'], targets: ['d'], type: ConnectionType.CONTRADICTION }
     * ]);
     * topology.get_connected_nodes(); // Returns: Set(['a', 'b', 'c', 'd'])
     * ```
     */
    get_connected_nodes(): Set<string> {
        return new Set(this.adjacency_map.keys());
    }

    /**
     * Find isolated nodes (nodes with no connections)
     *
     * @param all_nodes - Array of all nodes in the graph
     * @returns Array of nodes that have no connections
     *
     * @example
     * ```ts
     * const nodes = [
     *   { id: 'a', name: 'A', description: '' },
     *   { id: 'b', name: 'B', description: '' },
     *   { id: 'c', name: 'C', description: '' }
     * ];
     * const topology = new GraphTopology([
     *   { id: '1', sources: ['a'], targets: ['b'], type: ConnectionType.IMPLICATION }
     * ]);
     * topology.find_isolated_nodes(nodes); // Returns: [{ id: 'c', ... }]
     * ```
     */
    find_isolated_nodes(all_nodes: LogicNode[]): LogicNode[] {
        const connected = this.get_connected_nodes();
        return all_nodes.filter((node) => !connected.has(node.id));
    }

    /**
     * Get the most connected nodes
     *
     * Returns nodes sorted by their degree (number of connections) in descending order.
     * Useful for identifying hub nodes in the graph.
     *
     * @param all_nodes - Array of all nodes in the graph
     * @param limit - Maximum number of nodes to return (default: all nodes)
     * @returns Array of nodes sorted by degree (most connected first)
     *
     * @example
     * ```ts
     * const nodes = [
     *   { id: 'a', name: 'A', description: '' },
     *   { id: 'b', name: 'B', description: '' },
     *   { id: 'c', name: 'C', description: '' }
     * ];
     * const topology = new GraphTopology([
     *   { id: '1', sources: ['a'], targets: ['b'], type: ConnectionType.IMPLICATION },
     *   { id: '2', sources: ['a'], targets: ['c'], type: ConnectionType.IMPLICATION }
     * ]);
     * const hubs = topology.get_most_connected_nodes(nodes, 1);
     * // Returns: [{ id: 'a', ... }] (node 'a' has 2 connections)
     * ```
     */
    get_most_connected_nodes(all_nodes: LogicNode[], limit?: number): LogicNode[] {
        const nodes_with_degree = all_nodes.map((node) => ({
            node,
            degree: this.get_degree(node.id)
        }));

        nodes_with_degree.sort((a, b) => b.degree - a.degree);

        const result = nodes_with_degree.map((item) => item.node);
        return limit ? result.slice(0, limit) : result;
    }
}

/**
 * Get connections involving a specific node
 *
 * Finds all connections where the node appears as either a source or target.
 *
 * @param node_id - The ID of the node to query
 * @param connections - Array of all connections in the graph
 * @returns Array of connections involving the node
 *
 * @example
 * ```ts
 * const connections = [
 *   { id: '1', sources: ['a'], targets: ['b'], type: ConnectionType.IMPLICATION },
 *   { id: '2', sources: ['b'], targets: ['c'], type: ConnectionType.IMPLICATION },
 *   { id: '3', sources: ['d'], targets: ['e'], type: ConnectionType.CONTRADICTION }
 * ];
 * get_connections_for_node('b', connections);
 * // Returns: [{ id: '1', ... }, { id: '2', ... }]
 * ```
 */
export function get_connections_for_node(
    node_id: string,
    connections: LogicConnection[]
): LogicConnection[] {
    return connections.filter(
        (conn) => conn.sources.includes(node_id) || conn.targets.includes(node_id)
    );
}

/**
 * Get connections between two specific nodes
 *
 * Finds all connections that link two nodes together, regardless of direction.
 *
 * @param node_a - First node ID
 * @param node_b - Second node ID
 * @param connections - Array of all connections in the graph
 * @returns Array of connections between the two nodes
 *
 * @example
 * ```ts
 * const connections = [
 *   { id: '1', sources: ['a'], targets: ['b'], type: ConnectionType.IMPLICATION },
 *   { id: '2', sources: ['b'], targets: ['a'], type: ConnectionType.CONTRADICTION },
 *   { id: '3', sources: ['c'], targets: ['d'], type: ConnectionType.IMPLICATION }
 * ];
 * get_connections_between_nodes('a', 'b', connections);
 * // Returns: [{ id: '1', ... }, { id: '2', ... }]
 * ```
 */
export function get_connections_between_nodes(
    node_a: string,
    node_b: string,
    connections: LogicConnection[]
): LogicConnection[] {
    return connections.filter(
        (conn) =>
            (conn.sources.includes(node_a) && conn.targets.includes(node_b)) ||
            (conn.sources.includes(node_b) && conn.targets.includes(node_a))
    );
}
