/**
 * Style utilities
 *
 * Helper functions for working with the style system
 */

import type { StyleContext } from '../types';
import type { LogicNode, LogicConnection } from '$lib/types/graph';
import { is_axiom_node } from '$lib/utils/node-classification';

/**
 * Build a style context from node data and interaction states
 *
 * @param node - The node to style
 * @param connections - All connections in the graph
 * @param interactions - Interaction state flags
 * @param any_node_hovered - Whether any node is currently hovered
 * @param dimensions - Optional node dimensions for overlay positioning
 * @returns Complete style context
 *
 * @example
 * ```ts
 * const context = build_style_context(
 *   node,
 *   connections,
 *   { selected: true, pinned: false, hovered: false, connected: false, dragging: false },
 *   false
 * );
 * const style = engine.resolve_style(context);
 * ```
 */
export function build_style_context(
    node: LogicNode,
    connections: LogicConnection[],
    interactions: {
        selected: boolean;
        pinned: boolean;
        hovered: boolean;
        connected: boolean;
        dragging: boolean;
    },
    any_node_hovered: boolean,
    dimensions?: { width: number; height: number }
): StyleContext {
    // Determine if node is an axiom
    const is_axiom = is_axiom_node(node.id, connections);

    // Determine if question has an answer
    const has_answer = node.answered_by !== undefined && node.answered_by !== null;

    return {
        node,
        connections,
        interactions,
        graph_state: {
            is_axiom,
            has_answer,
            answer_node_id: node.answered_by,
            any_node_hovered
        },
        theme: 'default',
        dimensions
    };
}
