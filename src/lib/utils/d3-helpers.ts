/**
 * D3 helper utilities for graph visualization
 *
 * This module provides utility functions for working with D3.js force simulations
 * and SVG rendering in the context of the logic graph visualization.
 */

import type { LogicConnection, LogicNode, D3Link } from '$lib/types/graph';
import { ConnectionType } from '$lib/types/graph';

/**
 * Converts LogicConnections with multiple sources/targets into D3-compatible links
 *
 * LogicConnections support multiple sources and targets, but D3's force simulation
 * requires individual source-target pairs. This function expands each connection
 * into multiple D3Link objects, one for each source-target combination.
 *
 * @param connections - Array of logical connections to convert
 * @returns Array of D3-compatible links for force simulation
 *
 * @example
 * ```ts
 * const connections = [{
 *   id: '1',
 *   sources: ['a', 'b'],
 *   targets: ['c'],
 *   type: ConnectionType.IMPLICATION
 * }];
 * const links = convert_connections_to_d3_links(connections);
 * // Returns: [
 * //   { source: 'a', target: 'c', connection: {...} },
 * //   { source: 'b', target: 'c', connection: {...} }
 * // ]
 * ```
 *
 * @see {@link D3Link} for the return type structure
 */
export function convert_connections_to_d3_links(connections: LogicConnection[]): D3Link[] {
    const links: D3Link[] = [];

    for (const connection of connections) {
        // Create a link for each source-target pair
        for (const source of connection.sources) {
            for (const target of connection.targets) {
                links.push({
                    source,
                    target,
                    connection
                });
            }
        }
    }

    return links;
}

/**
 * Generates a unique arrow marker ID for a connection type
 *
 * Arrow markers are defined in SVG <defs> and referenced by ID.
 * This function generates consistent IDs for each connection type.
 *
 * @param type - The connection type
 * @returns SVG marker ID string
 *
 * @example
 * ```ts
 * get_arrow_marker_id(ConnectionType.IMPLICATION); // Returns: "arrow-implication"
 * get_arrow_marker_id(ConnectionType.CONTRADICTION); // Returns: "arrow-contradiction"
 * ```
 */
export function get_arrow_marker_id(type: ConnectionType): string {
    return `arrow-${type}`;
}

/**
 * Gets the CSS class for a connection type
 *
 * Returns the appropriate CSS class name for styling connections
 * based on their type.
 *
 * @param type - The connection type
 * @returns CSS class name
 *
 * @example
 * ```ts
 * get_connection_class(ConnectionType.IMPLICATION); // Returns: "link-implication"
 * get_connection_class(ConnectionType.CONTRADICTION); // Returns: "link-contradiction"
 * ```
 */
export function get_connection_class(type: ConnectionType): string {
    return type === ConnectionType.IMPLICATION ? 'link-implication' : 'link-contradiction';
}

/**
 * Gets the stroke dash array for a connection type
 *
 * Returns the SVG stroke-dasharray value for rendering connections.
 * Implications are solid lines, contradictions are dashed.
 *
 * @param type - The connection type
 * @returns SVG stroke-dasharray value
 *
 * @example
 * ```ts
 * get_connection_stroke_dasharray(ConnectionType.IMPLICATION); // Returns: "none"
 * get_connection_stroke_dasharray(ConnectionType.CONTRADICTION); // Returns: "5,5"
 * ```
 */
export function get_connection_stroke_dasharray(type: ConnectionType): string {
    return type === ConnectionType.IMPLICATION ? 'none' : '5,5';
}

/**
 * Calculates the angle between two points (for arrow rotation)
 *
 * Computes the angle in degrees from the source point to the target point.
 * Used for positioning and rotating arrow markers along connection lines.
 *
 * @param source - Source node with x, y coordinates
 * @param target - Target node with x, y coordinates
 * @returns Angle in degrees
 *
 * @example
 * ```ts
 * const source = { id: 'a', name: 'A', description: '', x: 0, y: 0 };
 * const target = { id: 'b', name: 'B', description: '', x: 100, y: 0 };
 * calculate_angle(source, target); // Returns: 0 (pointing right)
 * ```
 *
 * @throws Will produce incorrect results if source or target lack x/y coordinates
 */
export function calculate_angle(source: LogicNode, target: LogicNode): number {
    const dx = target.x! - source.x!;
    const dy = target.y! - source.y!;
    return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Calculates the Euclidean distance between two points
 *
 * Computes the straight-line distance between two nodes based on their
 * x, y coordinates using the Pythagorean theorem.
 *
 * @param source - Source node with x, y coordinates
 * @param target - Target node with x, y coordinates
 * @returns Distance in pixels
 *
 * @example
 * ```ts
 * const source = { id: 'a', name: 'A', description: '', x: 0, y: 0 };
 * const target = { id: 'b', name: 'B', description: '', x: 3, y: 4 };
 * calculate_distance(source, target); // Returns: 5
 * ```
 *
 * @throws Will produce incorrect results if source or target lack x/y coordinates
 */
export function calculate_distance(source: LogicNode, target: LogicNode): number {
    const dx = target.x! - source.x!;
    const dy = target.y! - source.y!;
    return Math.sqrt(dx * dx + dy * dy);
}
