/**
 * Utilities for calculating bounding boxes and recentering the graph view.
 *
 * @module utils/d3/recenter
 */

import type { LogicNode } from '$lib/types/graph';
import * as d3 from 'd3';

/**
 * Bounding box for a set of nodes.
 */
export interface BoundingBox {
    /** Minimum X coordinate */
    min_x: number;
    /** Maximum X coordinate */
    max_x: number;
    /** Minimum Y coordinate */
    min_y: number;
    /** Maximum Y coordinate */
    max_y: number;
    /** Width of bounding box */
    width: number;
    /** Height of bounding box */
    height: number;
    /** Center X coordinate */
    center_x: number;
    /** Center Y coordinate */
    center_y: number;
}

/**
 * Configuration for recenter calculation.
 */
export interface RecenterConfig {
    /** Padding around nodes as a fraction of viewport (0.1 = 10% padding) */
    padding_fraction?: number;
    /** Minimum zoom scale */
    min_scale?: number;
    /** Maximum zoom scale */
    max_scale?: number;
    /** Default scale for empty or single-node graphs */
    default_scale?: number;
}

/**
 * Default recenter configuration.
 */
export const DEFAULT_RECENTER_CONFIG: Required<RecenterConfig> = {
    padding_fraction: 0.1, // 10% padding on all sides
    min_scale: 0.1,
    max_scale: 4.0,
    default_scale: 1.0
};

/**
 * Calculate the bounding box for a set of nodes.
 *
 * This calculates the min/max x,y coordinates of all nodes,
 * along with derived properties like width, height, and center.
 *
 * @param nodes - Array of nodes to calculate bounding box for
 * @returns Bounding box containing all nodes, or null if no nodes with positions
 *
 * @example
 * ```ts
 * const bbox = calculate_bounding_box(nodes);
 * if (bbox) {
 *   console.log(`Graph spans ${bbox.width} x ${bbox.height}`);
 *   console.log(`Center at (${bbox.center_x}, ${bbox.center_y})`);
 * }
 * ```
 */
export function calculate_bounding_box(nodes: LogicNode[]): BoundingBox | null {
    // Filter to nodes with valid positions
    const positioned_nodes = nodes.filter(
        (node) => node.x !== undefined && node.y !== undefined && !isNaN(node.x) && !isNaN(node.y)
    );

    if (positioned_nodes.length === 0) {
        return null;
    }

    // Find min/max coordinates
    let min_x = Infinity;
    let max_x = -Infinity;
    let min_y = Infinity;
    let max_y = -Infinity;

    for (const node of positioned_nodes) {
        const x = node.x!;
        const y = node.y!;

        min_x = Math.min(min_x, x);
        max_x = Math.max(max_x, x);
        min_y = Math.min(min_y, y);
        max_y = Math.max(max_y, y);
    }

    const width = max_x - min_x;
    const height = max_y - min_y;
    const center_x = (min_x + max_x) / 2;
    const center_y = (min_y + max_y) / 2;

    return {
        min_x,
        max_x,
        min_y,
        max_y,
        width,
        height,
        center_x,
        center_y
    };
}

/**
 * Calculate the transform needed to fit all nodes in the viewport.
 *
 * This determines the appropriate scale and translation to center all nodes
 * in the viewport with padding on all sides.
 *
 * @param nodes - Array of nodes to fit in viewport
 * @param viewport_width - Width of the viewport
 * @param viewport_height - Height of the viewport
 * @param config - Optional configuration for padding and scale limits
 * @returns D3 zoom transform to apply, or null if cannot calculate
 *
 * @example
 * ```ts
 * const transform = calculate_recenter_transform(
 *   nodes,
 *   svg.clientWidth,
 *   svg.clientHeight,
 *   { padding_fraction: 0.15 } // 15% padding
 * );
 *
 * if (transform) {
 *   svg.transition().duration(750).call(zoom_behavior.transform, transform);
 * }
 * ```
 */
export function calculate_recenter_transform(
    nodes: LogicNode[],
    viewport_width: number,
    viewport_height: number,
    config: RecenterConfig = {}
): d3.ZoomTransform | null {
    const cfg = { ...DEFAULT_RECENTER_CONFIG, ...config };

    // Calculate bounding box
    const bbox = calculate_bounding_box(nodes);

    // Handle edge case: no nodes with positions
    if (!bbox) {
        // Return identity transform (no zoom, no pan)
        return d3.zoomIdentity;
    }

    // Handle edge case: single node or all nodes at same position
    if (bbox.width === 0 && bbox.height === 0) {
        // Just center the single point
        return d3.zoomIdentity
            .translate(viewport_width / 2, viewport_height / 2)
            .translate(-bbox.center_x * cfg.default_scale, -bbox.center_y * cfg.default_scale)
            .scale(cfg.default_scale);
    }

    // Calculate padding in pixels
    const padding_x = viewport_width * cfg.padding_fraction;
    const padding_y = viewport_height * cfg.padding_fraction;

    // Calculate available space (viewport minus padding)
    const available_width = viewport_width - 2 * padding_x;
    const available_height = viewport_height - 2 * padding_y;

    // Calculate scale to fit bbox in available space
    // Take the smaller scale to ensure both dimensions fit
    const scale_x = available_width / bbox.width;
    const scale_y = available_height / bbox.height;
    let scale = Math.min(scale_x, scale_y);

    // Clamp scale to configured limits
    scale = Math.max(cfg.min_scale, Math.min(cfg.max_scale, scale));

    // Calculate translation to center the bbox in the viewport
    // First, translate so bbox center is at origin
    // Then scale
    // Then translate to viewport center
    const translate_x = viewport_width / 2 - bbox.center_x * scale;
    const translate_y = viewport_height / 2 - bbox.center_y * scale;

    return d3.zoomIdentity.translate(translate_x, translate_y).scale(scale);
}

/**
 * Calculate the transform needed to focus on a specific node.
 *
 * This centers the given node in the viewport while maintaining the current zoom level.
 *
 * @param node - Node to focus on
 * @param viewport_width - Width of the viewport
 * @param viewport_height - Height of the viewport
 * @param current_scale - Current zoom scale (defaults to 1.0)
 * @returns D3 zoom transform to apply, or null if node has no position
 *
 * @example
 * ```ts
 * const transform = calculate_focus_transform(
 *   selected_node,
 *   svg.clientWidth,
 *   svg.clientHeight,
 *   current_transform.k
 * );
 *
 * if (transform) {
 *   svg.transition().duration(500).call(zoom_behavior.transform, transform);
 * }
 * ```
 */
export function calculate_focus_transform(
    node: LogicNode,
    viewport_width: number,
    viewport_height: number,
    current_scale: number = 1.0
): d3.ZoomTransform | null {
    // Node must have valid position
    if (node.x === undefined || node.y === undefined || isNaN(node.x) || isNaN(node.y)) {
        return null;
    }

    // Calculate transform to center node at current scale
    const translate_x = viewport_width / 2 - node.x * current_scale;
    const translate_y = viewport_height / 2 - node.y * current_scale;

    return d3.zoomIdentity.translate(translate_x, translate_y).scale(current_scale);
}
