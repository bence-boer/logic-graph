/**
 * Graph validation utilities
 *
 * This module provides comprehensive validation functions for nodes, connections,
 * and entire graph structures. It ensures data integrity before operations and
 * during import/export.
 */

import type { LogicGraph, LogicNode, LogicConnection } from '$lib/types/graph';
import { ConnectionType } from '$lib/types/graph';

/**
 * Represents a single validation error
 */
export interface ValidationError {
    /** The field that failed validation */
    field: string;
    /** Human-readable error message */
    message: string;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
    /** True if validation passed, false otherwise */
    valid: boolean;
    /** Array of validation errors (empty if valid) */
    errors: ValidationError[];
}

/**
 * Validate a node
 *
 * Checks that a node has all required fields and that they meet
 * the necessary constraints.
 *
 * @param node - The node to validate
 * @returns Validation result with any errors found
 *
 * @example
 * ```ts
 * const node = { id: '1', name: 'Test', description: 'A test node' };
 * const result = validate_node(node);
 * if (result.valid) {
 *   console.log('Node is valid');
 * } else {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function validate_node(node: LogicNode): ValidationResult {
    const errors: ValidationError[] = [];

    if (!node.id || node.id.trim() === '') {
        errors.push({ field: 'id', message: 'Node ID is required' });
    }

    if (!node.name || node.name.trim() === '') {
        errors.push({ field: 'name', message: 'Node name is required' });
    }

    if (node.description === undefined || node.description === null) {
        errors.push({ field: 'description', message: 'Node description is required' });
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate a connection
 *
 * Checks that a connection has all required fields, valid connection type,
 * and that all referenced nodes exist in the provided node array.
 *
 * @param connection - The connection to validate
 * @param nodes - Array of all nodes in the graph (for reference checking)
 * @returns Validation result with any errors found
 *
 * @example
 * ```ts
 * const connection = {
 *   id: '1',
 *   type: ConnectionType.IMPLICATION,
 *   sources: ['a'],
 *   targets: ['b']
 * };
 * const nodes = [
 *   { id: 'a', name: 'A', description: '' },
 *   { id: 'b', name: 'B', description: '' }
 * ];
 * const result = validate_connection(connection, nodes);
 * if (result.valid) {
 *   console.log('Connection is valid');
 * }
 * ```
 */
export function validate_connection(
    connection: LogicConnection,
    nodes: LogicNode[]
): ValidationResult {
    const errors: ValidationError[] = [];
    const node_ids = new Set(nodes.map((n) => n.id));

    if (!connection.id || connection.id.trim() === '') {
        errors.push({ field: 'id', message: 'Connection ID is required' });
    }

    if (!Object.values(ConnectionType).includes(connection.type)) {
        errors.push({ field: 'type', message: 'Invalid connection type' });
    }

    if (!connection.sources || connection.sources.length === 0) {
        errors.push({ field: 'sources', message: 'At least one source is required' });
    } else {
        for (const source_id of connection.sources) {
            if (!node_ids.has(source_id)) {
                errors.push({
                    field: 'sources',
                    message: `Source node ${source_id} does not exist`
                });
            }
        }
    }

    if (!connection.targets || connection.targets.length === 0) {
        errors.push({ field: 'targets', message: 'At least one target is required' });
    } else {
        for (const target_id of connection.targets) {
            if (!node_ids.has(target_id)) {
                errors.push({
                    field: 'targets',
                    message: `Target node ${target_id} does not exist`
                });
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate an entire graph
 *
 * Performs comprehensive validation of a complete graph structure, including:
 * - All nodes are valid
 * - No duplicate node IDs
 * - All connections are valid
 * - No duplicate connection IDs
 * - All connection references point to existing nodes
 *
 * @param graph - The complete graph to validate
 * @returns Validation result with any errors found
 *
 * @example
 * ```ts
 * const graph = {
 *   nodes: [
 *     { id: '1', name: 'Node A', description: 'First node' },
 *     { id: '2', name: 'Node B', description: 'Second node' }
 *   ],
 *   connections: [
 *     { id: '1', type: ConnectionType.IMPLICATION, sources: ['1'], targets: ['2'] }
 *   ]
 * };
 * const result = validate_graph(graph);
 * if (!result.valid) {
 *   console.error('Graph validation failed:', result.errors);
 * }
 * ```
 *
 * @see Use this before importing or saving a graph to ensure data integrity
 */
export function validate_graph(graph: LogicGraph): ValidationResult {
    const errors: ValidationError[] = [];

    if (!graph.nodes || !Array.isArray(graph.nodes)) {
        errors.push({ field: 'nodes', message: 'Nodes array is required' });
        return { valid: false, errors };
    }

    if (!graph.connections || !Array.isArray(graph.connections)) {
        errors.push({ field: 'connections', message: 'Connections array is required' });
        return { valid: false, errors };
    }

    // Validate all nodes
    for (let i = 0; i < graph.nodes.length; i++) {
        const node_result = validate_node(graph.nodes[i]);
        if (!node_result.valid) {
            for (const error of node_result.errors) {
                errors.push({
                    field: `nodes[${i}].${error.field}`,
                    message: error.message
                });
            }
        }
    }

    // Check for duplicate node IDs
    const node_ids = graph.nodes.map((n) => n.id);
    const duplicate_ids = node_ids.filter((id, index) => node_ids.indexOf(id) !== index);
    if (duplicate_ids.length > 0) {
        errors.push({
            field: 'nodes',
            message: `Duplicate node IDs found: ${duplicate_ids.join(', ')}`
        });
    }

    // Validate all connections
    for (let i = 0; i < graph.connections.length; i++) {
        const connection_result = validate_connection(graph.connections[i], graph.nodes);
        if (!connection_result.valid) {
            for (const error of connection_result.errors) {
                errors.push({
                    field: `connections[${i}].${error.field}`,
                    message: error.message
                });
            }
        }
    }

    // Check for duplicate connection IDs
    const connection_ids = graph.connections.map((c) => c.id);
    const duplicate_connection_ids = connection_ids.filter(
        (id, index) => connection_ids.indexOf(id) !== index
    );
    if (duplicate_connection_ids.length > 0) {
        errors.push({
            field: 'connections',
            message: `Duplicate connection IDs found: ${duplicate_connection_ids.join(', ')}`
        });
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
