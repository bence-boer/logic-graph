/**
 * Tests for graph validation utilities
 */

import { describe, it, expect } from 'vitest';
import { validate_node, validate_connection, validate_graph } from './validation';
import { NodeType, ConnectionType, QuestionState, StatementState } from '$lib/types/graph';
import type { LogicNode, LogicConnection, LogicGraph } from '$lib/types/graph';

describe('validate_node', () => {
    it('should accept node without details field (optional)', () => {
        const node: LogicNode = {
            id: 'node-1',
            statement: 'Test statement'
        };

        const result = validate_node(node);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should accept node with empty string details', () => {
        const node: LogicNode = {
            id: 'node-1',
            statement: 'Test statement',
            details: ''
        };

        const result = validate_node(node);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should accept node with details field', () => {
        const node: LogicNode = {
            id: 'node-1',
            statement: 'Test statement',
            details: 'Some additional details'
        };

        const result = validate_node(node);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should reject node without id', () => {
        const node = {
            statement: 'Test statement'
        } as LogicNode;

        const result = validate_node(node);

        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].field).toBe('id');
    });

    it('should reject node with empty id', () => {
        const node: LogicNode = {
            id: '',
            statement: 'Test statement'
        };

        const result = validate_node(node);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'id')).toBe(true);
    });

    it('should reject node without statement', () => {
        const node = {
            id: 'node-1'
        } as LogicNode;

        const result = validate_node(node);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'statement')).toBe(true);
    });

    it('should reject node with empty statement', () => {
        const node: LogicNode = {
            id: 'node-1',
            statement: ''
        };

        const result = validate_node(node);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'statement')).toBe(true);
    });

    it('should validate question node with valid state', () => {
        const node: LogicNode = {
            id: 'node-1',
            statement: 'Is this valid?',
            type: NodeType.QUESTION,
            question_state: QuestionState.ACTIVE
        };

        const result = validate_node(node);

        expect(result.valid).toBe(true);
    });

    it('should reject question node with invalid state', () => {
        const node: LogicNode = {
            id: 'node-1',
            statement: 'Is this valid?',
            type: NodeType.QUESTION,
            question_state: 'invalid' as QuestionState
        };

        const result = validate_node(node);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'question_state')).toBe(true);
    });

    it('should validate statement node with valid state', () => {
        const node: LogicNode = {
            id: 'node-1',
            statement: 'This is an axiom',
            type: NodeType.STATEMENT,
            statement_state: StatementState.SETTLED
        };

        const result = validate_node(node);

        expect(result.valid).toBe(true);
    });
});

describe('validate_connection', () => {
    const nodes: LogicNode[] = [
        { id: 'node-1', statement: 'Statement 1' },
        { id: 'node-2', statement: 'Statement 2' }
    ];

    it('should accept valid connection', () => {
        const connection: LogicConnection = {
            id: 'conn-1',
            type: ConnectionType.IMPLICATION,
            sources: ['node-1'],
            targets: ['node-2']
        };

        const result = validate_connection(connection, nodes);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should accept connection without id (will be generated)', () => {
        const connection: LogicConnection = {
            type: ConnectionType.IMPLICATION,
            sources: ['node-1'],
            targets: ['node-2']
        };

        const result = validate_connection(connection, nodes);

        expect(result.valid).toBe(true);
    });

    it('should reject connection with invalid type', () => {
        const connection: LogicConnection = {
            id: 'conn-1',
            type: 'invalid' as ConnectionType,
            sources: ['node-1'],
            targets: ['node-2']
        };

        const result = validate_connection(connection, nodes);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'type')).toBe(true);
    });

    it('should reject connection with non-existent source', () => {
        const connection: LogicConnection = {
            id: 'conn-1',
            type: ConnectionType.IMPLICATION,
            sources: ['non-existent'],
            targets: ['node-2']
        };

        const result = validate_connection(connection, nodes);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'sources')).toBe(true);
    });

    it('should reject connection with non-existent target', () => {
        const connection: LogicConnection = {
            id: 'conn-1',
            type: ConnectionType.IMPLICATION,
            sources: ['node-1'],
            targets: ['non-existent']
        };

        const result = validate_connection(connection, nodes);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'targets')).toBe(true);
    });

    it('should reject connection without sources', () => {
        const connection: LogicConnection = {
            id: 'conn-1',
            type: ConnectionType.IMPLICATION,
            sources: [],
            targets: ['node-2']
        };

        const result = validate_connection(connection, nodes);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'sources')).toBe(true);
    });

    it('should reject connection without targets', () => {
        const connection: LogicConnection = {
            id: 'conn-1',
            type: ConnectionType.IMPLICATION,
            sources: ['node-1'],
            targets: []
        };

        const result = validate_connection(connection, nodes);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'targets')).toBe(true);
    });
});

describe('validate_graph', () => {
    it('should accept valid graph with nodes without details', () => {
        const graph: LogicGraph = {
            nodes: [
                { id: 'node-1', statement: 'Statement 1' },
                { id: 'node-2', statement: 'Statement 2' }
            ],
            connections: [
                {
                    id: 'conn-1',
                    type: ConnectionType.IMPLICATION,
                    sources: ['node-1'],
                    targets: ['node-2']
                }
            ]
        };

        const result = validate_graph(graph);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should accept empty graph', () => {
        const graph: LogicGraph = {
            nodes: [],
            connections: []
        };

        const result = validate_graph(graph);

        expect(result.valid).toBe(true);
    });

    it('should reject graph with invalid node', () => {
        const graph: LogicGraph = {
            nodes: [
                { id: '', statement: 'Statement 1' } // Invalid: empty id
            ],
            connections: []
        };

        const result = validate_graph(graph);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field.includes('nodes'))).toBe(true);
    });

    it('should reject graph with duplicate node ids', () => {
        const graph: LogicGraph = {
            nodes: [
                { id: 'node-1', statement: 'Statement 1' },
                { id: 'node-1', statement: 'Statement 2' }
            ],
            connections: []
        };

        const result = validate_graph(graph);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.message.includes('Duplicate node IDs'))).toBe(true);
    });

    it('should reject graph with invalid connection', () => {
        const graph: LogicGraph = {
            nodes: [{ id: 'node-1', statement: 'Statement 1' }],
            connections: [
                {
                    id: 'conn-1',
                    type: ConnectionType.IMPLICATION,
                    sources: ['node-1'],
                    targets: ['non-existent']
                }
            ]
        };

        const result = validate_graph(graph);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field.includes('connections'))).toBe(true);
    });

    it('should accept graph with metadata', () => {
        const graph: LogicGraph = {
            nodes: [{ id: 'node-1', statement: 'Statement 1' }],
            connections: [],
            metadata: {
                statement: 'Test graph',
                details: 'A test graph with metadata'
            }
        };

        const result = validate_graph(graph);

        expect(result.valid).toBe(true);
    });
});
