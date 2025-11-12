/**
 * JSON export utilities for logic graphs
 */

import type { LogicGraph } from '$lib/types/graph';
import { trigger_download } from './download';

/**
 * Clean node data for export (only semantic data, no visual properties)
 */
export interface ExportNode {
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
 * Clean connection data for export
 */
export interface ExportConnection {
    /** Unique identifier for the connection */
    id: string;
    /** Type of logical relationship */
    type: string;
    /** Array of source node IDs */
    sources: string[];
    /** Array of target node IDs */
    targets: string[];
}

/**
 * Clean graph metadata for export
 */
export interface ExportMetadata {
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
 * Clean graph structure for export (no visual data)
 */
export interface ExportGraph {
    /** Array of nodes in the graph */
    nodes: ExportNode[];
    /** Array of connections between nodes */
    connections: ExportConnection[];
    /** Optional metadata about the graph */
    metadata?: ExportMetadata;
}

/**
 * Convert internal graph structure to clean export format
 *
 * Strips all visual properties (position, velocity, size) and only keeps
 * semantic data (state, statement, details, connections).
 *
 * @param graph - The internal graph to convert
 * @returns Clean graph data suitable for export
 */
function convert_to_export_format(graph: LogicGraph): ExportGraph {
    return {
        nodes: graph.nodes.map((node) => {
            const export_node: ExportNode = {
                id: node.id,
                statement: node.statement
            };

            // Only include optional fields if they have values
            if (node.details) {
                export_node.details = node.details;
            }
            if (node.type) {
                export_node.type = node.type;
            }
            if (node.question_state) {
                export_node.question_state = node.question_state;
            }
            if (node.statement_state) {
                export_node.statement_state = node.statement_state;
            }
            if (node.answered_by) {
                export_node.answered_by = node.answered_by;
            }
            if (node.manual_state_override) {
                export_node.manual_state_override = node.manual_state_override;
            }

            return export_node;
        }),
        connections: graph.connections.map((connection) => ({
            id: connection.id ?? crypto.randomUUID(),
            type: connection.type,
            sources: connection.sources,
            targets: connection.targets
        })),
        metadata: graph.metadata
    };
}

/**
 * Export graph as JSON string
 *
 * Serializes the graph to a formatted JSON string with 2-space indentation.
 * Only exports semantic data (state, statement, details, connections), excluding
 * all visual properties (position, velocity, size).
 *
 * @param graph - The graph to serialize
 * @returns Formatted JSON string representation of the graph
 *
 * @example
 * ```ts
 * const json = export_graph_to_json(graph);
 * console.log(json); // Pretty-printed JSON with only semantic data
 * ```
 */
export function export_graph_to_json(graph: LogicGraph): string {
    const clean_graph = convert_to_export_format(graph);
    return JSON.stringify(clean_graph, null, 2);
}

/**
 * Trigger a download of the graph as a JSON file
 *
 * Creates a JSON blob and triggers a browser download.
 * Only exports semantic data, excluding all visual properties.
 *
 * @param graph - The graph to export
 * @param filename - Name for the downloaded file (default: 'logic-graph.json')
 *
 * @example
 * ```ts
 * download_graph_as_json(graph, 'my-graph.json');
 * ```
 */
export function download_graph_as_json(graph: LogicGraph, filename = 'logic-graph.json'): void {
    const json_string = export_graph_to_json(graph);
    const blob = new Blob([json_string], { type: 'application/json' });
    trigger_download(blob, filename);
}
