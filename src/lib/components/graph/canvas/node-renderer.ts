/**
 * Utility module for rendering node elements in D3 force-directed graphs.
 *
 * Uses HTML foreignObject elements with CSS for flexible text wrapping and dynamic sizing.
 * Provides drag behavior, selection handling, and visual feedback.
 */
import { selection_store } from '$lib/stores/selection.svelte';
import { DEFAULT_THEME, StyleEngine, build_style_context, render_overlays } from '$lib/styles';
import type { DragTrackingNode } from '$lib/types/d3-extensions';
import type { LogicConnection, LogicNode } from '$lib/types/graph';
import * as d3 from 'd3';

// Create style engine instance with default theme
const style_engine = new StyleEngine(DEFAULT_THEME);

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

        // Build style context for declarative styling
        const context = build_style_context(
            node,
            connections,
            {
                selected: is_selected,
                pinned: is_pinned,
                hovered: is_hovered,
                connected: is_connected ? true : false,
                dragging: false
            },
            hovered_node_id !== null
        );

        // Resolve style using declarative style engine
        const resolved_style = style_engine.resolve_style(context);

        // Calculate dimming opacity
        let opacity = 1;
        if (hovered_node_id && !is_hovered && !is_connected) {
            opacity = 0.3;
        }

        // Apply styles to the HTML container
        const container = node_group.select('.node-container');
        container
            .style('background', resolved_style.background)
            .style(
                'border',
                `${resolved_style.border_width}px solid ${resolved_style.border_color}`
            )
            .style('border-radius', `${resolved_style.border_radius}px`)
            .style('color', resolved_style.text_color)
            .style('font-size', `${resolved_style.font_size}px`)
            .style('font-weight', resolved_style.font_weight)
            .style('padding', `${resolved_style.padding}px`)
            .style('box-shadow', resolved_style.box_shadow)
            .style('transition', resolved_style.transition)
            .style('cursor', resolved_style.cursor)
            .style('pointer-events', resolved_style.pointer_events);

        if (resolved_style.filter) {
            container.style('filter', resolved_style.filter);
        }
        if (resolved_style.transform) {
            container.style('transform', resolved_style.transform);
        }

        // Apply opacity to the entire node group
        node_group.style('opacity', opacity);

        // Update text content
        container.text(node.statement);
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

                    // Build style context with dimensions for overlay rendering
                    const is_selected = selection_store.is_selected(node.id);
                    const is_pinned = node.fx !== null && node.fx !== undefined;
                    const is_connected = hovered_node_id && connected_node_ids.has(node.id);
                    const is_hovered = node.id === hovered_node_id;

                    const context = build_style_context(
                        node,
                        connections,
                        {
                            selected: is_selected,
                            pinned: is_pinned,
                            hovered: is_hovered,
                            connected: is_connected ? true : false,
                            dragging: false
                        },
                        hovered_node_id !== null,
                        { width, height }
                    );

                    // Resolve style with dimensions to get overlay configurations
                    const resolved_style = style_engine.resolve_style(context);

                    // Render overlays using declarative system
                    render_overlays(
                        node_group as unknown as d3.Selection<
                            SVGGElement,
                            unknown,
                            SVGGElement,
                            unknown
                        >,
                        resolved_style.overlays
                    );
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
