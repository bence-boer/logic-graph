/**
 * Tests for JSON export functionality
 */

import { describe, it, expect } from 'vitest';
import { export_graph_to_json } from './json';
import type { LogicGraph } from '$lib/types/graph';
import { NodeType, ConnectionType, QuestionState, StatementState } from '$lib/types/graph';

describe('export_graph_to_json', () => {
    it('should export only semantic data without visual properties', () => {
        const graph: LogicGraph = {
            nodes: [
                {
                    id: 'node-1',
                    statement: 'Test statement',
                    details: 'Test details',
                    type: NodeType.STATEMENT,
                    statement_state: StatementState.DEBATED,
                    // Visual properties that should NOT be exported
                    x: 100,
                    y: 200,
                    vx: 1,
                    vy: 2,
                    fx: 50,
                    fy: 75,
                    width: 150,
                    height: 80,
                    index: 0
                }
            ],
            connections: [
                {
                    id: 'conn-1',
                    type: ConnectionType.IMPLICATION,
                    sources: ['node-1'],
                    targets: ['node-2']
                }
            ],
            metadata: {
                statement: 'Test graph',
                details: 'A test graph'
            }
        };

        const json = export_graph_to_json(graph);
        const parsed = JSON.parse(json);

        // Check that visual properties are NOT present
        expect(parsed.nodes[0]).not.toHaveProperty('x');
        expect(parsed.nodes[0]).not.toHaveProperty('y');
        expect(parsed.nodes[0]).not.toHaveProperty('vx');
        expect(parsed.nodes[0]).not.toHaveProperty('vy');
        expect(parsed.nodes[0]).not.toHaveProperty('fx');
        expect(parsed.nodes[0]).not.toHaveProperty('fy');
        expect(parsed.nodes[0]).not.toHaveProperty('width');
        expect(parsed.nodes[0]).not.toHaveProperty('height');
        expect(parsed.nodes[0]).not.toHaveProperty('index');

        // Check that semantic data IS present
        expect(parsed.nodes[0]).toHaveProperty('id', 'node-1');
        expect(parsed.nodes[0]).toHaveProperty('statement', 'Test statement');
        expect(parsed.nodes[0]).toHaveProperty('details', 'Test details');
        expect(parsed.nodes[0]).toHaveProperty('type', 'statement');
        expect(parsed.nodes[0]).toHaveProperty('statement_state', 'debated');
    });

    it('should omit optional fields when they are undefined or empty', () => {
        const graph: LogicGraph = {
            nodes: [
                {
                    id: 'node-1',
                    statement: 'Minimal node'
                    // No optional fields
                }
            ],
            connections: []
        };

        const json = export_graph_to_json(graph);
        const parsed = JSON.parse(json);

        // Required fields
        expect(parsed.nodes[0]).toHaveProperty('id');
        expect(parsed.nodes[0]).toHaveProperty('statement');

        // Optional fields should not be present when empty/undefined
        expect(parsed.nodes[0]).not.toHaveProperty('details');
        expect(parsed.nodes[0]).not.toHaveProperty('type');
        expect(parsed.nodes[0]).not.toHaveProperty('question_state');
        expect(parsed.nodes[0]).not.toHaveProperty('statement_state');
    });

    it('should include optional fields when they have values', () => {
        const graph: LogicGraph = {
            nodes: [
                {
                    id: 'node-1',
                    statement: 'Question node',
                    details: 'A question',
                    type: NodeType.QUESTION,
                    question_state: QuestionState.RESOLVED,
                    answered_by: 'node-2',
                    manual_state_override: true
                }
            ],
            connections: []
        };

        const json = export_graph_to_json(graph);
        const parsed = JSON.parse(json);

        expect(parsed.nodes[0]).toHaveProperty('details', 'A question');
        expect(parsed.nodes[0]).toHaveProperty('type', 'question');
        expect(parsed.nodes[0]).toHaveProperty('question_state', 'resolved');
        expect(parsed.nodes[0]).toHaveProperty('answered_by', 'node-2');
        expect(parsed.nodes[0]).toHaveProperty('manual_state_override', true);
    });

    it('should generate connection IDs if missing', () => {
        const graph: LogicGraph = {
            nodes: [],
            connections: [
                {
                    // No ID provided
                    type: ConnectionType.IMPLICATION,
                    sources: ['node-1'],
                    targets: ['node-2']
                }
            ]
        };

        const json = export_graph_to_json(graph);
        const parsed = JSON.parse(json);

        // Should have generated an ID
        expect(parsed.connections[0]).toHaveProperty('id');
        expect(typeof parsed.connections[0].id).toBe('string');
        expect(parsed.connections[0].id.length).toBeGreaterThan(0);
    });

    it('should include metadata when present', () => {
        const graph: LogicGraph = {
            nodes: [],
            connections: [],
            metadata: {
                statement: 'Test graph',
                details: 'Description',
                created: '2025-01-01T00:00:00.000Z',
                modified: '2025-01-02T00:00:00.000Z'
            }
        };

        const json = export_graph_to_json(graph);
        const parsed = JSON.parse(json);

        expect(parsed.metadata).toEqual({
            statement: 'Test graph',
            details: 'Description',
            created: '2025-01-01T00:00:00.000Z',
            modified: '2025-01-02T00:00:00.000Z'
        });
    });
});
