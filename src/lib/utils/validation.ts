/**
 * Graph validation utilities
 */

import type { LogicGraph, LogicNode, LogicConnection } from '$lib/types/graph';
import { ConnectionType } from '$lib/types/graph';

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

/**
 * Validate a node
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
