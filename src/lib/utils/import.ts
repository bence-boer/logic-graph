/**
 * Import utilities for loading graphs from various sources
 */

import type { LogicGraph } from '$lib/types/graph';

/**
 * Import a graph from a JSON file
 */
export async function import_graph_from_file(file: File): Promise<LogicGraph> {
    const text = await file.text();
    const graph = JSON.parse(text) as LogicGraph;
    return graph;
}

/**
 * Import a graph from a JSON string
 */
export function import_graph_from_json(json_string: string): LogicGraph {
    const graph = JSON.parse(json_string) as LogicGraph;
    return graph;
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
