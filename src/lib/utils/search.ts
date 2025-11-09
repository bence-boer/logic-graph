import type { LogicNode, LogicConnection, ConnectionType } from '$lib/types/graph';
import { SearchFilterType, CONNECTION_TYPE_FILTER_VALUE } from '$lib/stores/search.svelte';

/**
 * Options for searching the graph
 */
export interface SearchOptions {
    query: string;
    filter_type: SearchFilterType;
    connection_type_filter?: ConnectionType | typeof CONNECTION_TYPE_FILTER_VALUE.ALL;
}

/**
 * Search results containing matching nodes and connections
 */
export interface SearchResults {
    nodes: LogicNode[];
    connections: LogicConnection[];
}

/**
 * Searches the graph for nodes and connections matching the query.
 * Supports filtering by type (nodes, connections, or all) and connection type.
 *
 * @param graph - The graph containing nodes and connections to search
 * @param options - Search options including query string and filters
 * @returns Search results with matching nodes and connections
 *
 * @example
 * ```ts
 * const results = search_graph(
 *   { nodes: my_nodes, connections: my_connections },
 *   { query: 'test', filter_type: SearchFilterType.ALL }
 * );
 * console.log(results.nodes); // Matching nodes
 * console.log(results.connections); // Matching connections
 * ```
 */
export function search_graph(
    graph: { nodes: LogicNode[]; connections: LogicConnection[] },
    options: SearchOptions
): SearchResults {
    const query = options.query.toLowerCase().trim();

    if (!query) {
        return { nodes: [], connections: [] };
    }

    // Search nodes
    const nodes =
        options.filter_type === SearchFilterType.CONNECTIONS
            ? []
            : graph.nodes.filter((node) => {
                  const matches_query =
                      node.name.toLowerCase().includes(query) ||
                      node.description.toLowerCase().includes(query) ||
                      node.id.toLowerCase().includes(query);
                  return matches_query;
              });

    // Search connections
    const connections =
        options.filter_type === SearchFilterType.NODES
            ? []
            : graph.connections.filter((conn) => {
                  // Filter by connection type if specified
                  if (
                      options.connection_type_filter !== CONNECTION_TYPE_FILTER_VALUE.ALL &&
                      conn.type !== options.connection_type_filter
                  ) {
                      return false;
                  }

                  // Match by connection ID
                  const matches_query = conn.id.toLowerCase().includes(query);
                  return matches_query;
              });

    return { nodes, connections };
}

/**
 * Highlights matching text within a string by wrapping it in a <mark> tag.
 * Case-insensitive matching.
 *
 * @param text - The text to search within
 * @param query - The query to highlight
 * @returns HTML string with highlighted matches
 *
 * @example
 * ```ts
 * const result = highlight_text('Hello World', 'world');
 * console.log(result); // 'Hello <mark>World</mark>'
 * ```
 */
export function highlight_text(text: string, query: string): string {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${escape_regex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Escapes special regex characters in a string
 */
function escape_regex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
