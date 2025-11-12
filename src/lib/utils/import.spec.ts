/**
 * Tests for JSON import functionality
 */

import { describe, it, expect } from 'vitest';
import { import_graph_from_json } from './import';
import { NodeType, StatementState } from '$lib/types/graph';

describe('import_graph_from_json', () => {
    it('should import minimal graph with only required fields', () => {
        const json = JSON.stringify({
            nodes: [
                {
                    id: 'node-1',
                    statement: 'Test statement'
                }
            ],
            connections: []
        });

        const graph = import_graph_from_json(json);

        expect(graph.nodes).toHaveLength(1);
        expect(graph.nodes[0].id).toBe('node-1');
        expect(graph.nodes[0].statement).toBe('Test statement');
        expect(graph.nodes[0].details).toBe(''); // Default
        expect(graph.nodes[0].type).toBe(NodeType.STATEMENT); // Default
    });

    it('should import graph with all optional fields', () => {
        const json = JSON.stringify({
            nodes: [
                {
                    id: 'node-1',
                    statement: 'Question',
                    details: 'Details here',
                    type: 'question',
                    answered_by: 'node-2'
                }
            ],
            connections: []
        });

        const graph = import_graph_from_json(json);

        expect(graph.nodes[0]).toMatchObject({
            id: 'node-1',
            statement: 'Question',
            details: 'Details here',
            type: NodeType.QUESTION,
            answered_by: 'node-2'
        });
    });

    it('should import question nodes without answered_by', () => {
        const json = JSON.stringify({
            nodes: [
                {
                    id: 'node-1',
                    statement: 'A question',
                    type: 'question'
                }
            ],
            connections: []
        });

        const graph = import_graph_from_json(json);

        expect(graph.nodes[0].type).toBe(NodeType.QUESTION);
        expect(graph.nodes[0].answered_by).toBeUndefined();
    });

    it('should generate connection IDs if missing', () => {
        const json = JSON.stringify({
            nodes: [],
            connections: [
                {
                    type: 'implication',
                    sources: ['node-1'],
                    targets: ['node-2']
                }
            ]
        });

        const graph = import_graph_from_json(json);

        expect(graph.connections).toHaveLength(1);
        expect(graph.connections[0].id).toBeDefined();
        expect(typeof graph.connections[0].id).toBe('string');
        expect(graph.connections[0].id!.length).toBeGreaterThan(0);
    });

    it('should preserve connection IDs when provided', () => {
        const json = JSON.stringify({
            nodes: [],
            connections: [
                {
                    id: 'my-connection-id',
                    type: 'implication',
                    sources: ['node-1'],
                    targets: ['node-2']
                }
            ]
        });

        const graph = import_graph_from_json(json);

        expect(graph.connections[0].id).toBe('my-connection-id');
    });

    it('should import metadata when present', () => {
        const json = JSON.stringify({
            nodes: [],
            connections: [],
            metadata: {
                statement: 'Test graph',
                details: 'Description',
                created: '2025-01-01T00:00:00.000Z',
                modified: '2025-01-02T00:00:00.000Z'
            }
        });

        const graph = import_graph_from_json(json);

        expect(graph.metadata).toEqual({
            statement: 'Test graph',
            details: 'Description',
            created: '2025-01-01T00:00:00.000Z',
            modified: '2025-01-02T00:00:00.000Z'
        });
    });

    it('should handle statement nodes with statement_state', () => {
        const json = JSON.stringify({
            nodes: [
                {
                    id: 'node-1',
                    statement: 'Axiom',
                    type: 'statement',
                    statement_state: 'settled'
                }
            ],
            connections: []
        });

        const graph = import_graph_from_json(json);

        expect(graph.nodes[0].type).toBe(NodeType.STATEMENT);
        expect(graph.nodes[0].statement_state).toBe(StatementState.SETTLED);
    });

    it('should import complex graph with multiple nodes and connections', () => {
        const json = JSON.stringify({
            nodes: [
                {
                    id: 'node-1',
                    statement: 'Premise 1'
                },
                {
                    id: 'node-2',
                    statement: 'Premise 2'
                },
                {
                    id: 'node-3',
                    statement: 'Conclusion',
                    details: 'Follows from premises'
                }
            ],
            connections: [
                {
                    id: 'conn-1',
                    type: 'implication',
                    sources: ['node-1', 'node-2'],
                    targets: ['node-3']
                }
            ],
            metadata: {
                statement: 'Logical argument'
            }
        });

        const graph = import_graph_from_json(json);

        expect(graph.nodes).toHaveLength(3);
        expect(graph.connections).toHaveLength(1);
        expect(graph.connections[0].sources).toEqual(['node-1', 'node-2']);
        expect(graph.connections[0].targets).toEqual(['node-3']);
        expect(graph.metadata?.statement).toBe('Logical argument');
    });
});
