/**
 * Graph validation utilities
 *
 * This module provides comprehensive validation functions for nodes, connections,
 * and entire graph structures. It ensures data integrity before operations and
 * during import/export.
 */

import type { LogicConnection, LogicGraph, LogicNode } from '$lib/types/graph';
import { ConnectionType, NodeType, QuestionState, StatementState } from '$lib/types/graph';
import { is_question_node, is_statement_node } from './node-classification';

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
 * const node = { id: '1', statement: 'Test', details: 'A test node' };
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

    if (!node.statement || node.statement.trim() === '') {
        errors.push({ field: 'statement', message: 'Node statement is required' });
    }

    if (node.details === undefined || node.details === null) {
        errors.push({ field: 'details', message: 'Node details is required' });
    }

    // Validate node type if specified
    if (node.type !== undefined && !Object.values(NodeType).includes(node.type)) {
        errors.push({ field: 'type', message: 'Invalid node type' });
    }

    // Type-specific validation
    if (is_question_node(node)) {
        const question_result = validate_question_node(node);
        errors.push(...question_result.errors);
    } else if (is_statement_node(node)) {
        const statement_result = validate_statement_node(node);
        errors.push(...statement_result.errors);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate a question node
 *
 * Checks question-specific fields:
 * - Question state is valid if present
 * - Answer reference points to a valid node if present
 *
 * @param node - The question node to validate
 * @returns Validation result with any errors found
 *
 * @example
 * ```ts
 * const question = {
 *   id: '1',
 *   statement: 'What is truth?',
 *   type: NodeType.QUESTION,
 *   question_state: QuestionState.ACTIVE
 * };
 * const result = validate_question_node(question);
 * ```
 */
export function validate_question_node(node: LogicNode): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate question state if present
    if (
        node.question_state !== undefined &&
        !Object.values(QuestionState).includes(node.question_state)
    ) {
        errors.push({ field: 'question_state', message: 'Invalid question state' });
    }

    // Validate answered_by if present
    if (node.answered_by !== undefined) {
        if (typeof node.answered_by !== 'string' || node.answered_by.trim() === '') {
            errors.push({
                field: 'answered_by',
                message: 'Answer node ID must be a non-empty string'
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate a statement node
 *
 * Checks statement-specific fields:
 * - Statement state is valid if present
 *
 * @param node - The statement node to validate
 * @returns Validation result with any errors found
 *
 * @example
 * ```ts
 * const statement = {
 *   id: '1',
 *   statement: 'Truth exists',
 *   type: NodeType.STATEMENT,
 *   statement_state: StatementState.SETTLED
 * };
 * const result = validate_statement_node(statement);
 * ```
 */
export function validate_statement_node(node: LogicNode): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate statement state if present
    if (
        node.statement_state !== undefined &&
        !Object.values(StatementState).includes(node.statement_state)
    ) {
        errors.push({ field: 'statement_state', message: 'Invalid statement state' });
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
 * For ANSWER connections, validates that sources are questions and targets are statements.
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
 *   { id: 'a', statement: 'A', details: '' },
 *   { id: 'b', statement: 'B', details: '' }
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
    const nodes_by_id = new Map(nodes.map((n) => [n.id, n]));

    // Note: ID is optional during import (will be generated), but should be present after normalization
    if (connection.id !== undefined && connection.id.trim() === '') {
        errors.push({ field: 'id', message: 'Connection ID cannot be empty string' });
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

    // Additional validation for ANSWER connections
    if (connection.type === ConnectionType.ANSWER) {
        // Validate source nodes are questions
        for (const source_id of connection.sources) {
            const source_node = nodes_by_id.get(source_id);
            if (source_node && !is_question_node(source_node)) {
                errors.push({
                    field: 'sources',
                    message: `Source node ${source_id} must be a question for ANSWER connections`
                });
            }
        }

        // Validate target nodes are statements
        for (const target_id of connection.targets) {
            const target_node = nodes_by_id.get(target_id);
            if (target_node && !is_statement_node(target_node)) {
                errors.push({
                    field: 'targets',
                    message: `Target node ${target_id} must be a statement for ANSWER connections`
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
 *     { id: '1', statement: 'Node A', details: 'First node' },
 *     { id: '2', statement: 'Node B', details: 'Second node' }
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
    const node_ids = graph.nodes.map((node) => node.id);
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

    // Check for duplicate connection IDs (only check defined IDs)
    const connection_ids = graph.connections
        .map((connection) => connection.id)
        .filter((id): id is string => id !== undefined);
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
