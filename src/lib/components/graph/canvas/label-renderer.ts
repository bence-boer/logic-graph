/**
 * Utility module for rendering label elements in D3 force-directed graphs.
 *
 * Provides functions to create and update SVG text elements for node labels
 * with visibility control and responsive styling.
 */
import * as d3 from 'd3';
import type { LogicNode } from '$lib/types/graph';
import { selection_store } from '$lib/stores/selection.svelte';

/**
 * Renders label elements in the SVG container.
 *
 * Creates SVG text elements for each node label with appropriate
 * positioning and visibility based on UI settings and hover state.
 *
 * @param container - D3 selection of the SVG g element to render labels in
 * @param nodes - Array of logic nodes to render labels for
 * @param hovered_node_id - ID of currently hovered node, or null
 * @param connected_node_ids - Set of node IDs connected to hovered node
 * @param show_labels - Whether labels should be visible
 */
export function render_labels(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    nodes: LogicNode[],
    hovered_node_id: string | null,
    connected_node_ids: Set<string>,
    show_labels: boolean
) {
    const label_selection = container
        .select<SVGGElement>('g.labels')
        .selectAll<SVGTextElement, LogicNode>('text')
        .data(nodes, (d) => d.id);

    label_selection.exit().remove();

    const label_enter = label_selection
        .enter()
        .append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .attr('dy', -15)
        .attr('fill', 'var(--text-primary)')
        .attr('font-size', '12px')
        .attr('pointer-events', 'none')
        .text((d) => d.name);

    // Update label opacity based on hover state and show_labels setting
    label_selection
        .merge(label_enter)
        .style('display', show_labels ? 'block' : 'none')
        .style('opacity', (d) => {
            if (!show_labels) return 0;
            if (!hovered_node_id) return 1;
            if (d.id === hovered_node_id) return 1;
            if (connected_node_ids.has(d.id)) return 1;
            return 0.3;
        })
        .style('font-weight', (d) => {
            if (selection_store.is_selected(d.id)) return 'bold';
            if (d.id === hovered_node_id) return 'bold';
            return 'normal';
        });
}

/**
 * Updates label positions during simulation tick.
 *
 * Updates the x and y attributes of all label text elements
 * to match the current positions of their associated nodes.
 *
 * @param container - D3 selection of the SVG g element containing labels
 */
export function update_label_positions(
    container: d3.Selection<SVGGElement, unknown, null, undefined>
) {
    container
        .selectAll<SVGTextElement, LogicNode>('text.node-label')
        .attr('x', (d) => d.x!)
        .attr('y', (d) => d.y!);
}
