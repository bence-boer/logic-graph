/**
 * Import utilities for loading graphs from various sources
 */

import type { LogicGraph, LogicConnection } from '$lib/types/graph';
import { NodeType, QuestionState, StatementState } from '$lib/types/graph';

/**
 * Ensures all connections have IDs, generating them if missing.
 * Also ensures all nodes have details fields (defaulting to empty string).
 * Normalizes node types to ensure backward compatibility.
 *
 * @param graph - The graph to normalize
 * @returns The normalized graph with all required fields
 */
function normalize_imported_graph(graph: LogicGraph): LogicGraph {
    return {
        ...graph,
        nodes: graph.nodes.map((node) => ({
            ...node,
            details: node.details ?? '',
            // Default to STATEMENT for backward compatibility
            type: node.type ?? NodeType.STATEMENT,
            // Set default states if not present
            question_state:
                node.type === NodeType.QUESTION
                    ? (node.question_state ?? QuestionState.ACTIVE)
                    : node.question_state,
            statement_state:
                node.type === NodeType.STATEMENT || node.type === undefined
                    ? (node.statement_state ?? StatementState.DEBATED)
                    : node.statement_state
        })),
        connections: graph.connections.map((connection) => ({
            ...connection,
            id: connection.id ?? crypto.randomUUID()
        })) as LogicConnection[]
    };
}

/**
 * Import a graph from a JSON file
 *
 * @param file - The JSON file to import
 * @returns A promise that resolves to the imported graph with normalized fields
 */
export async function import_graph_from_file(file: File): Promise<LogicGraph> {
    const text = await file.text();
    const graph = JSON.parse(text) as LogicGraph;
    return normalize_imported_graph(graph);
}

/**
 * Import a graph from a JSON string
 *
 * @param json_string - The JSON string to parse
 * @returns The imported graph with normalized fields
 */
export function import_graph_from_json(json_string: string): LogicGraph {
    const graph = JSON.parse(json_string) as LogicGraph;
    return normalize_imported_graph(graph);
}

/**
 * Trigger a file picker dialog and import the selected graph
 */
export function trigger_import_dialog(): Promise<LogicGraph | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';

        input.onchange = async (e) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                try {
                    const graph = await import_graph_from_file(file);
                    resolve(graph);
                } catch (error) {
                    console.error('Failed to import graph:', error);
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        };

        input.oncancel = () => {
            resolve(null);
        };

        input.click();
    });
}
