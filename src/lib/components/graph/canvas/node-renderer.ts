/**
 * Utility module for rendering node elements in D3 force-directed graphs.
 *
 * Provides functions to create and update SVG circle elements for nodes
 * with drag behavior, selection handling, and visual feedback.
 */
import * as d3 from 'd3';
import type { LogicNode } from '$lib/types/graph';
import type { DragTrackingNode } from '$lib/types/d3-extensions';
import { selection_store } from '$lib/stores/selection.svelte';

/**
 * Renders node elements in the SVG container.
 *
 * Creates SVG circle elements for each node with appropriate styling,
 * drag behavior, and interaction handlers. Updates existing nodes based
 * on selection and hover state.
 *
 * @param container - D3 selection of the SVG g element to render nodes in
 * @param nodes - Array of logic nodes to render
 * @param drag_handlers - Object with drag event handlers (started, dragged, ended)
 * @param hovered_node_id - ID of currently hovered node, or null
 * @param connected_node_ids - Set of node IDs connected to hovered node
 * @param show_descriptions - Whether to show descriptions in tooltips
 * @param on_hover - Callback function when node hover state changes
 */
export function render_nodes(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    nodes: LogicNode[],
    drag_handlers: {
        started: (
            event: d3.D3DragEvent<SVGCircleElement, DragTrackingNode, DragTrackingNode>,
            d: DragTrackingNode
        ) => void;
        dragged: (
            event: d3.D3DragEvent<SVGCircleElement, DragTrackingNode, DragTrackingNode>,
            d: DragTrackingNode
        ) => void;
        ended: (
            event: d3.D3DragEvent<SVGCircleElement, DragTrackingNode, DragTrackingNode>,
            d: DragTrackingNode
        ) => void;
    },
    hovered_node_id: string | null,
    connected_node_ids: Set<string>,
    show_descriptions: boolean,
    on_hover: (node_id: string | null) => void
) {
    const node_selection = container
        .select<SVGGElement>('g.nodes')
        .selectAll<SVGCircleElement, LogicNode>('circle')
        .data(nodes, (d) => d.id);

    node_selection.exit().remove();

    const node_enter = node_selection
        .enter()
        .append('circle')
        .attr('r', 8)
        .attr('fill', 'var(--node-default)')
        .attr('stroke', 'var(--border-default)')
        .attr('stroke-width', 2)
        .attr('cursor', 'pointer')
        .call(
            d3
                .drag<SVGCircleElement, DragTrackingNode>()
                .on('start', drag_handlers.started)
                .on('drag', drag_handlers.dragged)
                .on('end', drag_handlers.ended)
        )
        .on('click', (event, d) => {
            event.stopPropagation();
            selection_store.select_node(d.id);
        })
        .on('mouseover', function (event, d) {
            on_hover(d.id);
            d3.select(this)
                .attr('r', 10)
                .attr('stroke-width', 3)
                .style('filter', 'drop-shadow(0 0 8px var(--accent-primary))');
        })
        .on('mouseout', function (event, d) {
            on_hover(null);
            const is_selected = selection_store.is_selected(d.id);
            const is_pinned = d.fx !== null && d.fx !== undefined;
            d3.select(this)
                .attr('r', is_selected ? 10 : 8)
                .attr('stroke-width', is_pinned ? 3 : 2)
                .style(
                    'filter',
                    is_selected ? 'drop-shadow(0 0 8px var(--accent-primary))' : 'none'
                );
        });

    // Add title (tooltip) for nodes
    node_enter.append('title').text((d) => {
        if (show_descriptions && d.description) {
            return `${d.name}\n${d.description}`;
        }
        return d.name;
    });

    // Update merged selections
    node_selection
        .merge(node_enter)
        .attr('fill', (d) => {
            if (selection_store.is_selected(d.id)) return 'var(--node-selected)';
            if (hovered_node_id && connected_node_ids.has(d.id)) {
                return 'var(--node-hover)';
            }
            return 'var(--node-default)';
        })
        .attr('r', (d) => (selection_store.is_selected(d.id) ? 10 : 8))
        .attr('stroke', (d) => {
            const is_pinned = d.fx !== null && d.fx !== undefined;
            if (is_pinned) return 'var(--accent-tertiary)';
            return 'var(--border-default)';
        })
        .attr('stroke-width', (d) => {
            const is_pinned = d.fx !== null && d.fx !== undefined;
            return is_pinned ? 3 : 2;
        })
        .style('filter', (d) => {
            if (selection_store.is_selected(d.id))
                return 'drop-shadow(0 0 8px var(--accent-primary))';
            return 'none';
        })
        .style('opacity', (d) => {
            if (!hovered_node_id) return 1;
            if (d.id === hovered_node_id) return 1;
            if (connected_node_ids.has(d.id)) return 1;
            return 0.3;
        });

    // Update tooltips for all nodes (both new and existing)
    node_selection
        .merge(node_enter)
        .select('title')
        .text((d) => {
            if (show_descriptions && d.description) {
                return `${d.name}\n${d.description}`;
            }
            return d.name;
        });
}

/**
 * Updates node positions during simulation tick.
 *
 * Updates the cx and cy attributes of all node circle elements
 * to match the current positions from the force simulation.
 *
 * @param container - D3 selection of the SVG g element containing nodes
 */
export function update_node_positions(
    container: d3.Selection<SVGGElement, unknown, null, undefined>
) {
    container
        .selectAll<SVGCircleElement, LogicNode>('circle')
        .attr('cx', (d) => d.x!)
        .attr('cy', (d) => d.y!);
}
