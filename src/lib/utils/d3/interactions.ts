/**
 * D3 interaction handlers for drag operations
 *
 * This module provides drag interaction handlers for nodes in the force simulation.
 * It handles drag start, drag, and drag end events, including node pinning logic.
 */

import type { Simulation } from 'd3';
import type { DragTrackingNode } from '$lib/types/d3-extensions';
import type { LogicNode, D3Link } from '$lib/types/graph';

/**
 * Callback function when a node is pinned
 */
export type OnPinCallback = (node: LogicNode) => void;

/**
 * Callback function when a node is unpinned
 */
export type OnUnpinCallback = (node: LogicNode) => void;

/**
 * Configuration for drag handlers
 */
export interface DragHandlersConfig {
    /** The D3 force simulation instance */
    simulation: Simulation<LogicNode, D3Link> | null;
    /** Callback when a node is pinned */
    on_pin: OnPinCallback;
    /** Callback when a node is unpinned */
    on_unpin: OnUnpinCallback;
}

/**
 * Create drag started handler
 *
 * Handles the start of a drag operation. Restarts the simulation with
 * increased alpha to make nodes responsive, fixes the node position,
 * and stores the starting position for later comparison.
 *
 * @param config - Configuration for drag handlers
 * @returns Drag started handler function
 *
 * @example
 * ```ts
 * const handler = create_drag_started_handler({
 *   simulation: my_simulation,
 *   on_pin: (node) => console.log('Pinned:', node.id),
 *   on_unpin: (node) => console.log('Unpinned:', node.id)
 * });
 * ```
 */
export function create_drag_started_handler(config: DragHandlersConfig) {
    return function drag_started(
        event: d3.D3DragEvent<SVGGElement, DragTrackingNode, DragTrackingNode>,
        d: DragTrackingNode
    ) {
        if (!event.active && config.simulation) {
            config.simulation.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
        // Store the starting position to detect if node was actually dragged
        d._drag_start_x = d.x;
        d._drag_start_y = d.y;
    };
}

/**
 * Create dragged handler
 *
 * Handles the drag motion. Updates the node's fixed position to follow
 * the mouse cursor.
 *
 * @returns Dragged handler function
 *
 * @example
 * ```ts
 * const handler = create_dragged_handler();
 * ```
 */
export function create_dragged_handler() {
    return function dragged(
        event: d3.D3DragEvent<SVGGElement, DragTrackingNode, DragTrackingNode>,
        d: DragTrackingNode
    ) {
        d.fx = event.x;
        d.fy = event.y;
    };
}

/**
 * Create drag ended handler
 *
 * Handles the end of a drag operation. Determines if the node was actually
 * dragged (moved more than 5 pixels) or just clicked. If dragged, keeps the
 * node pinned; if clicked, unpins it. Cleans up temporary drag tracking properties.
 *
 * @param config - Configuration for drag handlers
 * @returns Drag ended handler function
 *
 * @example
 * ```ts
 * const handler = create_drag_ended_handler({
 *   simulation: my_simulation,
 *   on_pin: (node) => graph_store.update_node(node.id, { fx: node.x, fy: node.y }),
 *   on_unpin: (node) => graph_store.update_node(node.id, { fx: null, fy: null })
 * });
 * ```
 */
export function create_drag_ended_handler(config: DragHandlersConfig) {
    return function drag_ended(
        event: d3.D3DragEvent<SVGGElement, DragTrackingNode, DragTrackingNode>,
        d: DragTrackingNode
    ) {
        if (!event.active && config.simulation) {
            config.simulation.alphaTarget(0);
        }

        // Check if the node was actually dragged (moved more than 5 pixels)
        const start_x = d._drag_start_x ?? d.x ?? 0;
        const start_y = d._drag_start_y ?? d.y ?? 0;
        const distance_moved = Math.sqrt(
            Math.pow((d.x ?? 0) - start_x, 2) + Math.pow((d.y ?? 0) - start_y, 2)
        );

        if (distance_moved > 5) {
            // Node was dragged - keep it pinned
            config.on_pin(d);
        } else {
            // Node was just clicked - unpin it
            d.fx = null;
            d.fy = null;
            config.on_unpin(d);
        }

        // Clean up temporary drag tracking properties
        delete d._drag_start_x;
        delete d._drag_start_y;
    };
}

/**
 * Create all drag handlers at once
 *
 * Convenience function that creates all three drag handlers (start, drag, end)
 * with the same configuration.
 *
 * @param config - Configuration for drag handlers
 * @returns Object containing all three drag handlers
 *
 * @example
 * ```ts
 * const handlers = create_drag_handlers({
 *   simulation: my_simulation,
 *   on_pin: (node) => graph_store.update_node(node.id, { fx: node.x, fy: node.y }),
 *   on_unpin: (node) => graph_store.update_node(node.id, { fx: null, fy: null })
 * });
 *
 * d3.drag()
 *   .on('start', handlers.started)
 *   .on('drag', handlers.dragged)
 *   .on('end', handlers.ended);
 * ```
 */
export function create_drag_handlers(config: DragHandlersConfig) {
    return {
        started: create_drag_started_handler(config),
        dragged: create_dragged_handler(),
        ended: create_drag_ended_handler(config)
    };
}
