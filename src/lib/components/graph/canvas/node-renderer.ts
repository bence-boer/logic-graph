/**
 * Utility module for rendering node elements in D3 force-directed graphs.
 *
 * Uses HTML foreignObject elements with CSS for flexible text wrapping and dynamic sizing.
 * Provides drag behavior, selection handling, and visual feedback.
 */
import { selection_store } from '$lib/stores/selection.svelte';
import type { DragTrackingNode } from '$lib/types/d3-extensions';
import type { LogicConnection, LogicNode } from '$lib/types/graph';
import { is_question_node } from '$lib/utils/node-classification';
import { get_node_style } from '$lib/utils/node-styling';
import * as d3 from 'd3';

// Node dimensions configuration
const NODE_CONFIG = {
    MAX_WIDTH: 200,
    MIN_WIDTH: 80,
    MIN_HEIGHT: 40,
    PADDING: 12,
    BORDER_RADIUS: 4,
    FONT_SIZE: 14
} as const;

/**
 * Renders node elements in the SVG container using HTML foreignObject.
 *
 * Creates SVG group elements containing HTML divs for each node with CSS-based
 * text wrapping and dynamic sizing. Includes drag behavior, selection handling,
 * and interaction handlers.
 *
 * @param container - D3 selection of the SVG g element to render nodes in
 * @param nodes - Array of logic nodes to render
 * @param connections - Array of all connections in the graph (for styling calculations)
 * @param drag_handlers - Object with drag event handlers (started, dragged, ended)
 * @param hovered_node_id - ID of currently hovered node, or null
 * @param connected_node_ids - Set of node IDs connected to hovered node
 * @param on_hover - Callback function when node hover state changes
 * @param svg_element - The root SVG element to get zoom transform from
 * @returns Promise that resolves when node dimensions have been calculated
 */
export function render_nodes(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    nodes: LogicNode[],
    connections: LogicConnection[],
    drag_handlers: {
        started: (
            event: d3.D3DragEvent<SVGGElement, DragTrackingNode, DragTrackingNode>,
            d: DragTrackingNode
        ) => void;
        dragged: (
            event: d3.D3DragEvent<SVGGElement, DragTrackingNode, DragTrackingNode>,
            d: DragTrackingNode
        ) => void;
        ended: (
            event: d3.D3DragEvent<SVGGElement, DragTrackingNode, DragTrackingNode>,
            d: DragTrackingNode
        ) => void;
    },
    hovered_node_id: string | null,
    connected_node_ids: Set<string>,
    on_hover: (node_id: string | null) => void,
    svg_element?: SVGSVGElement | null
): Promise<void> {
    const node_selection = container
        .select<SVGGElement>('g.nodes')
        .selectAll<SVGGElement, LogicNode>('g.node')
        .data(nodes, (node) => node.id);

    node_selection.exit().remove();

    // Create node groups
    const node_enter = node_selection
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('cursor', 'pointer')
        .call(
            d3
                .drag<SVGGElement, DragTrackingNode>()
                .on('start', drag_handlers.started)
                .on('drag', drag_handlers.dragged)
                .on('end', drag_handlers.ended)
        )
        .on('click', (event, node) => {
            event.stopPropagation();
            selection_store.select_node(node.id);
        })
        .on('mouseover', function (event, node) {
            on_hover(node.id);
            d3.select(this)
                .select('.node-container')
                .style('box-shadow', '0 0 8px var(--accent-primary)')
                .style('border-width', '3px');
        })
        .on('mouseout', function (event, node) {
            on_hover(null);
            const is_selected = selection_store.is_selected(node.id);
            const is_pinned = node.fx !== null && node.fx !== undefined;
            const border_width = is_pinned ? '3px' : '2px';
            d3.select(this)
                .select('.node-container')
                .style('box-shadow', is_selected ? '0 0 8px var(--accent-primary)' : 'none')
                .style('border-width', border_width);
        });

    // Add foreignObject for HTML content
    const foreign_object = node_enter
        .append('foreignObject')
        .attr('width', NODE_CONFIG.MAX_WIDTH)
        .attr('height', 1) // Will be auto-sized
        .attr('x', -NODE_CONFIG.MAX_WIDTH / 2)
        .attr('y', 0); // Will be repositioned after measuring

    // Add HTML div container
    foreign_object
        .append('xhtml:div')
        .attr('class', 'node-container')
        .style('box-sizing', 'border-box')
        .style('width', '100%')
        .style('min-height', `${NODE_CONFIG.MIN_HEIGHT}px`)
        .style('padding', `${NODE_CONFIG.PADDING}px`)
        .style('background', 'var(--node-default)')
        .style('border', '2px solid var(--border-default)')
        .style('border-radius', `${NODE_CONFIG.BORDER_RADIUS}px`)
        .style('color', 'var(--text-primary)')
        .style('font-size', `${NODE_CONFIG.FONT_SIZE}px`)
        .style('font-family', 'inherit')
        .style('word-wrap', 'break-word')
        .style('overflow-wrap', 'break-word')
        .style('hyphens', 'auto')
        .style('line-height', '1.4')
        .style('text-align', 'center')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('justify-content', 'center')
        .style('transition', 'all 0.2s ease')
        .style('pointer-events', 'none')
        .text((d) => d.statement);

    // Add overlay container for indicators
    node_enter.append('g').attr('class', 'overlays');

    // Add title (tooltip) for nodes
    node_enter.append('title').text((d) => {
        if (d.details) {
            return `${d.statement}\n${d.details}`;
        }
        return d.statement;
    });

    // Merge and update all nodes
    const merged_nodes = node_selection.merge(node_enter);

    // Update container styling based on state
    merged_nodes.each(function (node) {
        const node_group = d3.select(this);
        const is_selected = selection_store.is_selected(node.id);
        const is_pinned = node.fx !== null && node.fx !== undefined;
        const is_connected = hovered_node_id && connected_node_ids.has(node.id);
        const is_hovered = node.id === hovered_node_id;

        // Get style from centralized styling utility
        const style = get_node_style(
            node,
            connections,
            is_selected,
            is_pinned,
            is_connected ? true : false,
            is_hovered
        );

        // Update box shadow
        const box_shadow = is_selected ? '0 0 8px var(--accent-primary)' : 'none';

        // Update opacity
        let opacity = 1;
        if (hovered_node_id && !is_hovered && !is_connected) {
            opacity = 0.3;
        }

        // Apply styles to the HTML container
        node_group
            .select('.node-container')
            .style('background', style.background)
            .style('border', `${style.border_width}px solid ${style.border_color}`)
            .style('color', style.text_color)
            .style('box-shadow', box_shadow);

        node_group.style('opacity', opacity);

        // Update text content
        node_group.select('.node-container').text(node.statement);
    });

    // Measure and reposition foreignObjects after rendering
    // This needs to happen after the DOM has updated
    // Returns a promise that resolves when dimensions are calculated
    return new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            // Get current zoom transform to correct for zoom scale
            let zoom_scale = 1;
            if (svg_element) {
                const transform = d3.zoomTransform(svg_element);
                zoom_scale = transform.k;
            }

            merged_nodes.each(function (node) {
                const node_group = d3.select<SVGGElement, LogicNode>(this);
                const foreign_object = node_group.select('foreignObject');
                const container_div = foreign_object
                    .select('.node-container')
                    .node() as HTMLElement;

                if (container_div) {
                    // Get the actual rendered dimensions in screen pixels
                    const bbox = container_div.getBoundingClientRect();

                    // Convert to SVG coordinate space by dividing by zoom scale
                    // This ensures dimensions remain constant regardless of zoom level
                    const height = Math.max(bbox.height / zoom_scale, NODE_CONFIG.MIN_HEIGHT);
                    const width = Math.min(bbox.width / zoom_scale, NODE_CONFIG.MAX_WIDTH);

                    // Update foreignObject dimensions and center it
                    foreign_object
                        .attr('width', width)
                        .attr('height', height)
                        .attr('x', -width / 2)
                        .attr('y', -height / 2);

                    // Store dimensions on the group element for link calculations
                    node_group.attr('data-width', width).attr('data-height', height);

                    // Store dimensions on the node object for collision detection
                    node.width = width;
                    node.height = height;

                    // Update overlays with correct dimensions
                    update_overlays(node_group, node, width, height);
                }
            });
            resolve();
        });
    });

    // Update tooltips for all nodes (both new and existing)
    merged_nodes.select('title').text((node) => {
        if (node.details) {
            return `${node.statement}\n${node.details}`;
        }
        return node.statement;
    });
}

/**
 * Updates overlay indicators (pin, checkmark) based on node state.
 *
 * @param node_group - D3 selection of the node group element
 * @param node - The logic node data
 * @param width - Node width in pixels
 * @param height - Node height in pixels
 */
function update_overlays(
    node_group: d3.Selection<SVGGElement, LogicNode, d3.BaseType, unknown>,
    node: LogicNode,
    width: number,
    height: number
) {
    const overlays_group = node_group.select<SVGGElement>('g.overlays');
    const is_selected = selection_store.is_selected(node.id);

    // Selection highlight (behind node)
    const SELECTION_PADDING = 4;
    const selection_x = -width / 2 - SELECTION_PADDING;
    const selection_y = -height / 2 - SELECTION_PADDING;
    const selection_width = width + SELECTION_PADDING * 2;
    const selection_height = height + SELECTION_PADDING * 2;

    if (is_selected) {
        let selection_highlight = overlays_group.select<SVGRectElement>('rect.selection-highlight');

        if (selection_highlight.empty()) {
            selection_highlight = overlays_group
                .insert('rect', ':first-child') // Insert as first child (behind everything)
                .attr('class', 'selection-highlight')
                .attr('rx', 6)
                .attr('fill', 'none')
                .attr('stroke', 'var(--accent-primary)')
                .attr('stroke-width', 2)
                .style('pointer-events', 'none')
                .style('animation', 'pulse-selection 2s ease-in-out infinite')
                .style('opacity', '0.8');
        }

        selection_highlight
            .attr('x', selection_x)
            .attr('y', selection_y)
            .attr('width', selection_width)
            .attr('height', selection_height);
    } else {
        overlays_group.select('rect.selection-highlight').remove();
    }

    // Pin indicator (top-right corner)
    const is_pinned = node.fx !== null && node.fx !== undefined;
    // Position with 4px padding from edges (circle radius is 10)
    const pin_x = width / 2 - 4;
    const pin_y = -height / 2 + 4;

    if (is_pinned) {
        let pin_indicator = overlays_group.select<SVGGElement>('g.pin-indicator');

        if (pin_indicator.empty()) {
            pin_indicator = overlays_group
                .append('g')
                .attr('class', 'pin-indicator')
                .style('pointer-events', 'none')
                .style('opacity', '0')
                .style('animation', 'fade-in 0.3s ease forwards');

            // Background circle - centered at origin
            pin_indicator
                .append('circle')
                .attr('cx', pin_x)
                .attr('cy', pin_y)
                .attr('r', 10)
                .attr('fill', 'var(--node-default)')
                .attr('fill-opacity', 0.9);

            // Pin icon - centered around origin
            const pin_svg = pin_indicator
                .append('svg')
                .attr('x', pin_x - 6)
                .attr('y', pin_y - 6)
                .attr('width', 12)
                .attr('height', 12)
                .attr('viewBox', '0 0 24 24')
                .attr('fill', 'none')
                .attr('stroke', '#8b5cf6')
                .attr('stroke-width', '2.5')
                .attr('stroke-linecap', 'round')
                .attr('stroke-linejoin', 'round');

            pin_svg.append('path').attr('d', 'M12 17v5');
            pin_svg
                .append('path')
                .attr(
                    'd',
                    'M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z'
                );
        }

    } else {
        overlays_group.select('g.pin-indicator').remove();
    }

    // Answer checkmark (top-right corner)
    const has_answer = is_question_node(node) && node.answered_by !== undefined;
    // Position with 4px padding from edges (circle radius is 10)
    const checkmark_x = width / 2 - 4;
    const checkmark_y = -height / 2 + 4;

    if (has_answer) {
        let answer_checkmark = overlays_group.select<SVGGElement>('g.answer-checkmark');

        if (answer_checkmark.empty()) {
            answer_checkmark = overlays_group
                .append('g')
                .attr('class', 'answer-checkmark')
                .style('pointer-events', 'none')
                .style(
                    'animation',
                    'scale-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards'
                );

            // Background circle - centered at origin
            answer_checkmark
                .append('circle')
                .attr('cx', checkmark_x)
                .attr('cy', checkmark_y)
                .attr('r', 10)
                .attr('fill', '#10b981')
                .attr('fill-opacity', 0.95);

            // Checkmark icon - centered around origin
            const check_svg = answer_checkmark
                .append('svg')
                .attr('x', checkmark_x - 6)
                .attr('y', checkmark_y - 6)
                .attr('width', 12)
                .attr('height', 12)
                .attr('viewBox', '0 0 24 24')
                .attr('fill', 'none')
                .attr('stroke', 'white')
                .attr('stroke-width', '3')
                .attr('stroke-linecap', 'round')
                .attr('stroke-linejoin', 'round');

            check_svg.append('polyline').attr('points', '20 6 9 17 4 12');
        }

        answer_checkmark.attr('transform', `translate(${checkmark_x}, ${checkmark_y})`);
    } else {
        overlays_group.select('g.answer-checkmark').remove();
    }
}

/**
 * Updates node positions during simulation tick.
 *
 * Updates the transform attribute of all node group elements
 * to match the current positions from the force simulation.
 *
 * @param container - D3 selection of the SVG g element containing nodes
 */
export function update_node_positions(
    container: d3.Selection<SVGGElement, unknown, null, undefined>
) {
    container
        .selectAll<SVGGElement, LogicNode>('g.node')
        .attr('transform', (d) => `translate(${d.x!}, ${d.y!})`);
}
