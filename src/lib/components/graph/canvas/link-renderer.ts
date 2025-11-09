/**
 * Utility module for rendering link elements in D3 force-directed graphs.
 *
 * Provides functions to create and update SVG line elements for connections
 * between nodes with appropriate styling, arrow markers, and interactions.
 */
import * as d3 from 'd3';
import type { LogicNode, D3Link } from '$lib/types/graph';
import { ConnectionType } from '$lib/types/graph';
import { selection_store } from '$lib/stores/selection.svelte';
import {
    get_arrow_marker_id,
    get_connection_class,
    get_connection_stroke_dasharray
} from '$lib/utils/d3-helpers';

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
        .data(links, (d) => `${(d.source as LogicNode).id}-${(d.target as LogicNode).id}`);

    link_selection.exit().remove();

    const link_enter = link_selection
        .enter()
        .append('line')
        .attr('class', (d) => `link ${get_connection_class(d.connection.type)}`)
        .attr('stroke', (d) =>
            d.connection.type === ConnectionType.IMPLICATION
                ? 'var(--link-implication)'
                : 'var(--link-contradiction)'
        )
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', (d) => get_connection_stroke_dasharray(d.connection.type))
        .attr('marker-end', (d) => `url(#${get_arrow_marker_id(d.connection.type)})`)
        .attr('marker-start', (d) =>
            d.connection.type === ConnectionType.CONTRADICTION
                ? `url(#${get_arrow_marker_id(d.connection.type)}-start)`
                : null
        )
        .attr('cursor', 'pointer')
        .on('click', (event, d) => {
            event.stopPropagation();
            selection_store.select_connection(d.connection.id);
        })
        .on('mouseover', function () {
            d3.select(this)
                .attr('stroke-width', 4)
                .style('filter', 'drop-shadow(0 0 4px currentColor)');
        })
        .on('mouseout', function (_event, d) {
            const is_selected = selection_store.is_selected(d.connection.id);
            d3.select(this)
                .attr('stroke-width', is_selected ? 3 : 2)
                .style('filter', is_selected ? 'drop-shadow(0 0 6px currentColor)' : 'none');
        });

    // Update merged link selection
    link_selection
        .merge(link_enter)
        .attr('stroke-width', (d) => {
            const is_selected = selection_store.is_selected(d.connection.id);
            const is_connected = is_link_connected_to_hovered(d);
            if (is_selected) return 3;
            if (is_connected) return 3;
            return 2;
        })
        .style('filter', (d) => {
            const is_selected = selection_store.is_selected(d.connection.id);
            const is_connected = is_link_connected_to_hovered(d);
            if (is_selected) return 'drop-shadow(0 0 6px currentColor)';
            if (is_connected) return 'drop-shadow(0 0 4px currentColor)';
            return 'none';
        })
        .style('opacity', (d) => {
            if (!hovered_node_id) return 0.8;
            const is_connected = is_link_connected_to_hovered(d);
            return is_connected ? 1 : 0.3;
        });
}

/**
 * Updates link positions during simulation tick.
 *
 * Updates the x1, y1, x2, y2 attributes of all link line elements
 * to match the current positions of their source and target nodes.
 *
 * @param container - D3 selection of the SVG g element containing links
 */
export function update_link_positions(
    container: d3.Selection<SVGGElement, unknown, null, undefined>
) {
    container
        .selectAll<SVGLineElement, D3Link>('line.link')
        .attr('x1', (d) => (d.source as LogicNode).x!)
        .attr('y1', (d) => (d.source as LogicNode).y!)
        .attr('x2', (d) => (d.target as LogicNode).x!)
        .attr('y2', (d) => (d.target as LogicNode).y!);
}
