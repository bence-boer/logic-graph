/**
 * Utility module for rendering link elements in D3 force-directed graphs.
 *
 * Provides functions to create and update SVG line elements for connections
 * between nodes with appropriate styling, arrow markers, and interactions.
 */
import * as d3 from 'd3';
import type { LogicNode, D3Link } from '$lib/types/graph';
import { ConnectionType, NodeType } from '$lib/types/graph';
import { selection_store } from '$lib/stores/selection.svelte';
import {
    get_arrow_marker_id,
    get_connection_class,
    get_connection_stroke_dasharray
} from '$lib/utils/d3-helpers';

/**
 * Checks if a connection involves a question node (as source or target).
 *
 * @param link - D3 link object to check
 * @returns True if either source or target is a question node
 */
function is_question_connection(link: D3Link): boolean {
    const source = link.source as LogicNode;
    const target = link.target as LogicNode;
    return source.type === NodeType.QUESTION || target.type === NodeType.QUESTION;
}

/**
 * Calculates the intersection point between a line and a rectangle.
 *
 * Given a line from the center of a source rectangle to the center of a target rectangle,
 * this function returns the point where the line intersects the edge of the target rectangle.
 *
 * @param source_x - X coordinate of the source point (center of source node)
 * @param source_y - Y coordinate of the source point (center of source node)
 * @param target_x - X coordinate of the target point (center of target node)
 * @param target_y - Y coordinate of the target point (center of target node)
 * @param rect_width - Width of the target rectangle
 * @param rect_height - Height of the target rectangle
 * @returns Object with x and y coordinates of the intersection point
 */
function get_rect_intersection(
    source_x: number,
    source_y: number,
    target_x: number,
    target_y: number,
    rect_width: number,
    rect_height: number
): { x: number; y: number } {
    // Calculate the direction from source to target
    const dx = target_x - source_x;
    const dy = target_y - source_y;

    // If source and target are at the same position, return target
    if (dx === 0 && dy === 0) {
        return { x: target_x, y: target_y };
    }

    // Half dimensions of the rectangle
    const half_width = rect_width / 2;
    const half_height = rect_height / 2;

    // Calculate the slope
    const slope = dy / dx;

    // Determine which edge the line intersects
    // by comparing the angle with the diagonal of the rectangle
    const rect_slope = rect_height / rect_width;

    let intersection_x: number;
    let intersection_y: number;

    if (Math.abs(slope) <= rect_slope) {
        // Line exits through left or right edge
        if (dx > 0) {
            // Coming from left, exits right edge
            intersection_x = target_x - half_width;
            intersection_y = target_y - half_width * slope;
        } else {
            // Coming from right, exits left edge
            intersection_x = target_x + half_width;
            intersection_y = target_y + half_width * slope;
        }
    } else {
        // Line exits through top or bottom edge
        if (dy > 0) {
            // Coming from top, exits bottom edge
            intersection_y = target_y - half_height;
            intersection_x = target_x - half_height / slope;
        } else {
            // Coming from bottom, exits top edge
            intersection_y = target_y + half_height;
            intersection_x = target_x + half_height / slope;
        }
    }

    return { x: intersection_x, y: intersection_y };
}

/**
 * Renders link elements in the SVG container.
 *
 * Creates SVG line elements for each link with appropriate styling,
 * arrow markers, and interaction handlers. Updates existing links
 * based on hover and selection state.
 *
 * @param container - D3 selection of the SVG g element to render links in
 * @param links - Array of D3 link objects to render
 * @param hovered_node_id - ID of currently hovered node, or null
 * @param is_link_connected_to_hovered - Function to check if link connects to hovered node
 */
export function render_links(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    links: D3Link[],
    hovered_node_id: string | null,
    is_link_connected_to_hovered: (link: D3Link) => boolean
) {
    const link_selection = container
        .select<SVGGElement>('g.links')
        .selectAll<SVGLineElement, D3Link>('line')
        .data(links, (link) => `${(link.source as LogicNode).id}-${(link.target as LogicNode).id}`);

    link_selection.exit().remove();

    const link_enter = link_selection
        .enter()
        .append('line')
        .attr('class', (link) => `link ${get_connection_class(link.connection.type)}`)
        .attr('stroke', (link) => {
            // Use amber color for connections involving question nodes
            if (is_question_connection(link)) {
                return '#f59e0b'; // amber-500
            }
            return link.connection.type === ConnectionType.IMPLICATION
                ? 'var(--link-implication)'
                : 'var(--link-contradiction)';
        })
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', (link) => get_connection_stroke_dasharray(link.connection.type))
        .attr('marker-end', (link) => {
            // Use amber arrow markers for question connections
            if (is_question_connection(link)) {
                return 'url(#arrow-question)';
            }
            return `url(#${get_arrow_marker_id(link.connection.type)})`;
        })
        .attr('marker-start', (link) => {
            // Use amber arrow markers for question contradictions
            if (
                is_question_connection(link) &&
                link.connection.type === ConnectionType.CONTRADICTION
            ) {
                return 'url(#arrow-question-start)';
            }
            return link.connection.type === ConnectionType.CONTRADICTION
                ? `url(#${get_arrow_marker_id(link.connection.type)}-start)`
                : null;
        })
        .attr('cursor', 'pointer')
        .on('click', (event, link) => {
            event.stopPropagation();
            selection_store.select_connection(link.connection.id!); // ID will always exist at runtime
        })
        .on('mouseover', function () {
            d3.select(this)
                .attr('stroke-width', 4)
                .style('filter', 'drop-shadow(0 0 4px currentColor)');
        })
        .on('mouseout', function (_event, link) {
            const is_selected = selection_store.is_selected(link.connection.id!); // ID will always exist at runtime
            d3.select(this)
                .attr('stroke-width', is_selected ? 3 : 2)
                .style('filter', is_selected ? 'drop-shadow(0 0 6px currentColor)' : 'none');
        });

    // Update merged link selection
    link_selection
        .merge(link_enter)
        .attr('stroke', (link) => {
            // Use amber color for connections involving question nodes
            if (is_question_connection(link)) {
                return '#f59e0b'; // amber-500
            }
            return link.connection.type === ConnectionType.IMPLICATION
                ? 'var(--link-implication)'
                : 'var(--link-contradiction)';
        })
        .attr('stroke-width', (link) => {
            const is_selected = selection_store.is_selected(link.connection.id!); // ID will always exist at runtime
            const is_connected = is_link_connected_to_hovered(link);
            if (is_selected) return 3;
            if (is_connected) return 3;
            return 2;
        })
        .style('filter', (link) => {
            const is_selected = selection_store.is_selected(link.connection.id!); // ID will always exist at runtime
            const is_connected = is_link_connected_to_hovered(link);
            if (is_selected) return 'drop-shadow(0 0 6px currentColor)';
            if (is_connected) return 'drop-shadow(0 0 4px currentColor)';
            return 'none';
        })
        .style('opacity', (link) => {
            if (!hovered_node_id) return 0.8;
            const is_connected = is_link_connected_to_hovered(link);
            return is_connected ? 1 : 0.3;
        });
}

/**
 * Updates link positions during simulation tick.
 *
 * Updates the x1, y1, x2, y2 attributes of all link line elements
 * to match the current positions of their source and target nodes.
 * Calculates intersection points with node rectangles so arrows stop at edges.
 *
 * @param container - D3 selection of the SVG g element containing links
 */
export function update_link_positions(
    container: d3.Selection<SVGGElement, unknown, null, undefined>
) {
    const nodes_container = container.select<SVGGElement>('g.nodes');

    container.selectAll<SVGLineElement, D3Link>('line.link').each(function (link) {
        const source = link.source as LogicNode;
        const target = link.target as LogicNode;

        const source_x = source.x!;
        const source_y = source.y!;
        const target_x = target.x!;
        const target_y = target.y!;

        // Get dimensions from the node data (set during rendering)
        let source_width = source.width || 80; // Default fallback
        let source_height = source.height || 40;
        let target_width = target.width || 80;
        let target_height = target.height || 40;

        // Also try to read from DOM if not in node data
        if (!source.width || !source.height) {
            const source_node_group = nodes_container
                .selectAll<SVGGElement, LogicNode>('g.node')
                .filter((node) => node.id === source.id);

            source_width = parseFloat(source_node_group.attr('data-width') || String(source_width));
            source_height = parseFloat(
                source_node_group.attr('data-height') || String(source_height)
            );
        }

        if (!target.width || !target.height) {
            const target_node_group = nodes_container
                .selectAll<SVGGElement, LogicNode>('g.node')
                .filter((node) => node.id === target.id);

            target_width = parseFloat(target_node_group.attr('data-width') || String(target_width));
            target_height = parseFloat(
                target_node_group.attr('data-height') || String(target_height)
            );
        }

        // Calculate intersection points at the edges of the rectangles
        const source_point = get_rect_intersection(
            target_x,
            target_y,
            source_x,
            source_y,
            source_width,
            source_height
        );

        const target_point = get_rect_intersection(
            source_x,
            source_y,
            target_x,
            target_y,
            target_width,
            target_height
        );

        // Update line positions to stop at rectangle edges
        d3.select(this)
            .attr('x1', source_point.x)
            .attr('y1', source_point.y)
            .attr('x2', target_point.x)
            .attr('y2', target_point.y);
    });
}
