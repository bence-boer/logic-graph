/**
 * Utility module for rendering node elements in D3 force-directed graphs.
 *
 * Provides functions to create and update SVG rectangle elements for nodes
 * with drag behavior, selection handling, visual feedback, and text wrapping.
 */
import * as d3 from 'd3';
import type { LogicNode } from '$lib/types/graph';
import type { DragTrackingNode } from '$lib/types/d3-extensions';
import { selection_store } from '$lib/stores/selection.svelte';

// Node dimensions configuration
const NODE_CONFIG = {
    MAX_WIDTH: 200,
    MAX_HEIGHT: 80,
    PADDING: 12,
    LINE_HEIGHT: 16,
    FONT_SIZE: 14,
    BORDER_RADIUS: 4
} as const;

/**
 * Wraps text to fit within a maximum width.
 *
 * Splits text into lines that fit within the specified width,
 * breaking at word boundaries when possible.
 *
 * @param text - The text to wrap
 * @param max_width - Maximum width in pixels
 * @param line_height - Height of each line in pixels
 * @param max_height - Maximum total height in pixels
 * @returns Array of text lines
 */
function wrap_text(
    text: string,
    max_width: number,
    line_height: number,
    max_height: number
): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current_line = '';
    const max_lines = Math.floor(max_height / line_height);

    // Create a temporary text element to measure text width
    const temp_text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    temp_text.style.fontSize = `${NODE_CONFIG.FONT_SIZE}px`;
    temp_text.style.fontFamily = 'inherit';
    document.body.appendChild(temp_text);

    for (const word of words) {
        const test_line = current_line ? `${current_line} ${word}` : word;
        temp_text.textContent = test_line;
        const width = temp_text.getComputedTextLength();

        if (width > max_width && current_line) {
            lines.push(current_line);
            current_line = word;

            // Check if we've reached max lines
            if (lines.length >= max_lines) {
                break;
            }
        } else {
            current_line = test_line;
        }
    }

    // Add the last line if we haven't exceeded max lines
    if (current_line && lines.length < max_lines) {
        lines.push(current_line);
    }

    // If we have more text than fits, add ellipsis to the last line
    if (lines.length === max_lines && words.length > 0) {
        let last_line = lines[lines.length - 1];
        temp_text.textContent = last_line + '...';

        // If adding ellipsis makes it too long, trim words
        while (temp_text.getComputedTextLength() > max_width && last_line.split(' ').length > 1) {
            const words_in_line = last_line.split(' ');
            words_in_line.pop();
            last_line = words_in_line.join(' ');
            temp_text.textContent = last_line + '...';
        }

        lines[lines.length - 1] = last_line + '...';
    }

    document.body.removeChild(temp_text);
    return lines;
}

/**
 * Renders node elements in the SVG container.
 *
 * Creates SVG group elements containing rectangles and text for each node
 * with appropriate styling, drag behavior, and interaction handlers.
 * Updates existing nodes based on selection and hover state.
 *
 * @param container - D3 selection of the SVG g element to render nodes in
 * @param nodes - Array of logic nodes to render
 * @param drag_handlers - Object with drag event handlers (started, dragged, ended)
 * @param hovered_node_id - ID of currently hovered node, or null
 * @param connected_node_ids - Set of node IDs connected to hovered node
 * @param on_hover - Callback function when node hover state changes
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
) {
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
                .select('rect')
                .attr('stroke-width', 3)
                .style('filter', 'drop-shadow(0 0 8px var(--accent-primary))');
        })
        .on('mouseout', function (event, node) {
            on_hover(null);
            const is_selected = selection_store.is_selected(node.id);
            const is_pinned = node.fx !== null && node.fx !== undefined;
            d3.select(this)
                .select('rect')
                .attr('stroke-width', is_pinned ? 3 : 2)
                .style(
                    'filter',
                    is_selected ? 'drop-shadow(0 0 8px var(--accent-primary))' : 'none'
                );
        });

    // Add rectangle to each node
    node_enter
        .append('rect')
        .attr('rx', NODE_CONFIG.BORDER_RADIUS)
        .attr('ry', NODE_CONFIG.BORDER_RADIUS)
        .attr('fill', 'var(--node-default)')
        .attr('stroke', 'var(--border-default)')
        .attr('stroke-width', 2);

    // Add text container for each node
    node_enter
        .append('text')
        .attr('class', 'node-text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'var(--text-primary)')
        .attr('font-size', `${NODE_CONFIG.FONT_SIZE}px`)
        .attr('pointer-events', 'none');

    // Add title (tooltip) for nodes
    node_enter.append('title').text((d) => {
        if (d.details) {
            return `${d.statement}\n${d.details}`;
        }
        return d.statement;
    });

    // Update merged selections
    const merged_nodes = node_selection.merge(node_enter);

    // Update rectangle styling
    merged_nodes
        .select('rect')
        .attr('fill', (node) => {
            if (selection_store.is_selected(node.id)) return 'var(--node-selected)';
            if (hovered_node_id && connected_node_ids.has(node.id)) {
                return 'var(--node-hover)';
            }
            return 'var(--node-default)';
        })
        .attr('stroke', (node) => {
            const is_pinned = node.fx !== null && node.fx !== undefined;
            if (is_pinned) return 'var(--accent-tertiary)';
            return 'var(--border-default)';
        })
        .attr('stroke-width', (node) => {
            const is_pinned = node.fx !== null && node.fx !== undefined;
            return is_pinned ? 3 : 2;
        })
        .style('filter', (node) => {
            if (selection_store.is_selected(node.id))
                return 'drop-shadow(0 0 8px var(--accent-primary))';
            return 'none';
        })
        .style('opacity', (node) => {
            if (!hovered_node_id) return 1;
            if (node.id === hovered_node_id) return 1;
            if (connected_node_ids.has(node.id)) return 1;
            return 0.3;
        });

    // Update text content with wrapping
    merged_nodes.each(function (node) {
        const text_element = d3.select(this).select<SVGTextElement>('text.node-text');
        const max_text_width = NODE_CONFIG.MAX_WIDTH - 2 * NODE_CONFIG.PADDING;
        const max_text_height = NODE_CONFIG.MAX_HEIGHT - 2 * NODE_CONFIG.PADDING;

        // Wrap text
        const lines = wrap_text(
            node.statement,
            max_text_width,
            NODE_CONFIG.LINE_HEIGHT,
            max_text_height
        );

        // Clear existing tspans
        text_element.selectAll('tspan').remove();

        // Add tspan for each line
        const total_height = lines.length * NODE_CONFIG.LINE_HEIGHT;
        const start_y = -total_height / 2 + NODE_CONFIG.LINE_HEIGHT / 2;

        lines.forEach((line, i) => {
            text_element
                .append('tspan')
                .attr('x', 0)
                .attr('dy', i === 0 ? start_y : NODE_CONFIG.LINE_HEIGHT)
                .text(line);
        });

        // Update rectangle size based on text
        const rect = d3.select(this).select('rect');
        const text_bbox = (text_element.node() as SVGTextElement).getBBox();
        const rect_width = Math.min(
            NODE_CONFIG.MAX_WIDTH,
            Math.max(text_bbox.width + 2 * NODE_CONFIG.PADDING, 60)
        );
        const rect_height = Math.min(
            NODE_CONFIG.MAX_HEIGHT,
            text_bbox.height + 2 * NODE_CONFIG.PADDING
        );

        rect.attr('width', rect_width)
            .attr('height', rect_height)
            .attr('x', -rect_width / 2)
            .attr('y', -rect_height / 2);
    });

    // Update node group opacity
    merged_nodes.style('opacity', (node) => {
        if (!hovered_node_id) return 1;
        if (node.id === hovered_node_id) return 1;
        if (connected_node_ids.has(node.id)) return 1;
        return 0.3;
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
