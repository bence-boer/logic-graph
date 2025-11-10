/**
 * Utility module for rendering node elements in D3 force-directed graphs.
 *
 * Uses HTML foreignObject elements with CSS for flexible text wrapping and dynamic sizing.
 * Provides drag behavior, selection handling, and visual feedback.
 */
import * as d3 from 'd3';
import type { LogicNode } from '$lib/types/graph';
import type { DragTrackingNode } from '$lib/types/d3-extensions';
import { selection_store } from '$lib/stores/selection.svelte';

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
 * @param drag_handlers - Object with drag event handlers (started, dragged, ended)
 * @param hovered_node_id - ID of currently hovered node, or null
 * @param connected_node_ids - Set of node IDs connected to hovered node
 * @param on_hover - Callback function when node hover state changes
 * @returns Promise that resolves when node dimensions have been calculated
 */
export function render_nodes(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    nodes: LogicNode[],
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
    on_hover: (node_id: string | null) => void
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

        // Update background color
        let bg_color = 'var(--node-default)';
        if (is_selected) {
            bg_color = 'var(--node-selected)';
        } else if (is_connected) {
            bg_color = 'var(--node-hover)';
        }

        // Update border
        const border_color = is_pinned ? 'var(--accent-tertiary)' : 'var(--border-default)';
        const border_width = is_pinned ? '3px' : '2px';

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
            .style('background', bg_color)
            .style('border', `${border_width} solid ${border_color}`)
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
            merged_nodes.each(function (node) {
                const node_group = d3.select(this);
                const foreign_object = node_group.select('foreignObject');
                const container_div = foreign_object.select('.node-container').node() as HTMLElement;

                if (container_div) {
                    // Get the actual rendered height
                    const bbox = container_div.getBoundingClientRect();
                    const height = Math.max(bbox.height, NODE_CONFIG.MIN_HEIGHT);
                    const width = Math.min(bbox.width, NODE_CONFIG.MAX_WIDTH);

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
