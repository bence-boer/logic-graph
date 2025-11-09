/**
 * D3 helper utilities for graph visualization
 */

import type { LogicConnection, LogicNode, D3Link } from '$lib/types/graph';
import { ConnectionType } from '$lib/types/graph';

/**
 * Converts LogicConnections with multiple sources/targets into D3-compatible links
 * Each source-target pair becomes a separate D3Link
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
 */
export function get_arrow_marker_id(type: ConnectionType): string {
    return `arrow-${type}`;
}

/**
 * Gets the CSS class for a connection type
 */
export function get_connection_class(type: ConnectionType): string {
    return type === ConnectionType.IMPLICATION ? 'link-implication' : 'link-contradiction';
}

/**
 * Gets the stroke dash array for a connection type
 */
export function get_connection_stroke_dasharray(type: ConnectionType): string {
    return type === ConnectionType.IMPLICATION ? 'none' : '5,5';
}

/**
 * Calculates the angle between two points (for arrow rotation)
 */
export function calculate_angle(source: LogicNode, target: LogicNode): number {
    const dx = target.x! - source.x!;
    const dy = target.y! - source.y!;
    return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Calculates the distance between two points
 */
export function calculate_distance(source: LogicNode, target: LogicNode): number {
    const dx = target.x! - source.x!;
    const dy = target.y! - source.y!;
    return Math.sqrt(dx * dx + dy * dy);
}
