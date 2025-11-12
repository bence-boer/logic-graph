/**
 * Import utilities for loading graphs from various sources
 */

import type { LogicGraph, LogicConnection, LogicNode } from '$lib/types/graph';
import { NodeType, StatementState, ConnectionType } from '$lib/types/graph';

/**
 * Minimal import node structure (only id and statement are required)
 */
export interface ImportNode {
    /** Unique identifier for the node */
    id: string;
    /** The logical statement represented by this node */
    statement: string;
    /** Additional details about the statement */
    details?: string;
    /** Type of node */
    type?: string;
    /** State for question nodes */
    question_state?: string;
    /** State for statement nodes */
    statement_state?: string;
    /** ID of the answer node (for question nodes) */
    answered_by?: string;
    /** Whether question state was manually set */
    manual_state_override?: boolean;
}

/**
 * Minimal import connection structure
 */
export interface ImportConnection {
    /** Unique identifier for the connection (generated if missing) */
    id?: string;
    /** Type of logical relationship */
    type: string;
    /** Array of source node IDs */
    sources: string[];
    /** Array of target node IDs */
    targets: string[];
}

/**
 * Import graph metadata
 */
export interface ImportMetadata {
    /** Statement of the graph */
    statement?: string;
    /** Details of the graph */
    details?: string;
    /** Creation timestamp */
    created?: string;
    /** Last modified timestamp */
    modified?: string;
}

/**
 * Minimal import graph structure
 */
export interface ImportGraph {
    /** Array of nodes in the graph */
    nodes: ImportNode[];
    /** Array of connections between nodes */
    connections: ImportConnection[];
    /** Optional metadata about the graph */
    metadata?: ImportMetadata;
}

/**
 * Convert imported graph to internal format with all required fields.
 * Ensures all connections have IDs and all nodes have proper defaults.
 *
 * @param imported_graph - The imported graph data
 * @returns The normalized graph with all required fields for internal use
 */
function convert_from_import_format(imported_graph: ImportGraph): LogicGraph {
    return {
        nodes: imported_graph.nodes.map((node): LogicNode => {
            const logic_node: LogicNode = {
                id: node.id,
                statement: node.statement,
                details: node.details ?? '',
                type: (node.type as NodeType | undefined) ?? NodeType.STATEMENT
            };

            // Set state fields if present (for statement nodes only)
            if (node.statement_state) {
                logic_node.statement_state = node.statement_state as StatementState;
            }

            // Set answered_by if present (question state is derived from this)
            if (node.answered_by) {
                logic_node.answered_by = node.answered_by;
            }

            return logic_node;
        }),
        connections: imported_graph.connections.map(
            (connection): LogicConnection => ({
                id: connection.id ?? crypto.randomUUID(),
                type: connection.type as ConnectionType,
                sources: connection.sources,
                targets: connection.targets
            })
        ),
        metadata: imported_graph.metadata
    };
}

/**
 * Import a graph from a JSON file
 *
 * @param file - The JSON file to import
 * @returns A promise that resolves to the imported graph with normalized fields
 *
 * @example
 * ```ts
 * const graph = await import_graph_from_file(file);
 * ```
 */
export async function import_graph_from_file(file: File): Promise<LogicGraph> {
    const text = await file.text();
    const imported_graph = JSON.parse(text) as ImportGraph;
    return convert_from_import_format(imported_graph);
}

/**
 * Import a graph from a JSON string
 *
 * @param json_string - The JSON string to parse
 * @returns The imported graph with normalized fields
 *
 * @example
 * ```ts
 * const graph = import_graph_from_json(json_data);
 * ```
 */
export function import_graph_from_json(json_string: string): LogicGraph {
    const imported_graph = JSON.parse(json_string) as ImportGraph;
    return convert_from_import_format(imported_graph);
}

/**
 * Trigger a file picker dialog and import the selected graph
 *
 * Opens a browser file picker for selecting a JSON file to import.
 *
 * @returns Promise that resolves to the imported graph or null if cancelled
 *
 * @example
 * ```ts
 * const graph = await trigger_import_dialog();
 * if (graph) {
 *     // Use imported graph
 * }
 * ```
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
