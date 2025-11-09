/**
 * JSON export utilities for logic graphs
 */

import type { LogicGraph } from '$lib/types/graph';
import { trigger_download } from './download';

/**
 * Export graph as JSON string
 *
 * Serializes the graph to a formatted JSON string with 2-space indentation.
 *
 * @param graph - The graph to serialize
 * @returns Formatted JSON string representation of the graph
 *
 * @example
 * ```ts
 * const json = export_graph_to_json(graph);
 * console.log(json); // Pretty-printed JSON
 * ```
 */
export function export_graph_to_json(graph: LogicGraph): string {
    return JSON.stringify(graph, null, 2);
}

/**
 * Trigger a download of the graph as a JSON file
 *
 * Creates a JSON blob and triggers a browser download.
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
