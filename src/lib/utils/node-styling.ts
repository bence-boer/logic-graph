/**
 * Node styling utilities
 *
 * Centralizes all node visual appearance logic based on node type, state,
 * and interaction states (selected, pinned, hovered, connected).
 */

import type { LogicNode, LogicConnection } from '$lib/types/graph';
import {
    is_question_node,
    is_active_question,
    is_resolved_question,
    is_axiom_node,
    is_settled_statement
} from './node-classification';

/**
 * Node style configuration
 */
export interface NodeStyle {
    /** Background color */
    background: string;
    /** Border color */
    border_color: string;
    /** Border width in pixels */
    border_width: number;
    /** Text color */
    text_color: string;
}

// ============================================================================
// Color Constants
// ============================================================================

const COLORS = {
    // Default statement colors
    DEFAULT_BACKGROUND: '#1e293b', // slate-800
    DEFAULT_BORDER: '#475569', // slate-600
    DEFAULT_TEXT: '#e2e8f0', // slate-200

    // Question colors
    QUESTION_ACTIVE_BORDER: '#f59e0b', // amber-500
    QUESTION_RESOLVED_BACKGROUND: '#fafafa', // neutral-50 (very light)
    QUESTION_RESOLVED_BORDER: '#e5e5e5', // neutral-200 (very light)
    QUESTION_RESOLVED_TEXT: '#0a0a0a', // black

    // Statement state colors
    STATEMENT_SETTLED_BORDER: '#ffffff', // white

    // Interaction state colors
    SELECTED_BORDER: '#3b82f6', // blue-500
    PINNED_BORDER: '#8b5cf6', // violet-500
    HOVERED_BACKGROUND: '#334155', // slate-700
    CONNECTED_HIGHLIGHT: '#14b8a6' // teal-500
} as const;

const BORDER_WIDTHS = {
    DEFAULT: 2,
    SELECTED: 3,
    PINNED: 3,
    HOVERED: 2
} as const;

// ============================================================================
// Main Styling Function
// ============================================================================

/**
 * Gets the complete visual style for a node based on its type, state, and interaction states.
 *
 * Priority order for border color (highest to lowest):
 * 1. Selected state
 * 2. Pinned state
 * 3. Node type/state specific colors
 * 4. Default color
 *
 * @param node - The node to style
 * @param connections - All connections in the graph (needed to determine axiom status)
 * @param is_selected - Whether the node is currently selected
 * @param is_pinned - Whether the node is pinned in place
 * @param is_connected - Whether the node is connected to the currently selected item
 * @param is_hovered - Whether the node is currently hovered
 * @returns Complete style configuration for the node
 *
 * @example
 * ```ts
 * const style = get_node_style(node, connections, true, false, false, false);
 * // Apply style to node element
 * element.style.backgroundColor = style.background;
 * element.style.borderColor = style.border_color;
 * element.style.borderWidth = `${style.border_width}px`;
 * element.style.color = style.text_color;
 * ```
 */
export function get_node_style(
    node: LogicNode,
    connections: LogicConnection[],
    is_selected: boolean,
    is_pinned: boolean,
    is_connected: boolean,
    is_hovered: boolean
): NodeStyle {
    // Start with default style
    let background: string = COLORS.DEFAULT_BACKGROUND;
    let border_color: string = COLORS.DEFAULT_BORDER;
    let border_width: number = BORDER_WIDTHS.DEFAULT;
    let text_color: string = COLORS.DEFAULT_TEXT;

    // ========================================================================
    // Apply type and state specific styling
    // ========================================================================

    if (is_question_node(node)) {
        if (is_resolved_question(node)) {
            // Resolved question: very light background and border, black text
            background = COLORS.QUESTION_RESOLVED_BACKGROUND;
            border_color = COLORS.QUESTION_RESOLVED_BORDER;
            text_color = COLORS.QUESTION_RESOLVED_TEXT;
        } else if (is_active_question(node)) {
            // Active question: amber border, default background and text
            border_color = COLORS.QUESTION_ACTIVE_BORDER;
        }
    } else {
        // Statement node
        if (is_axiom_node(node.id, connections) && is_settled_statement(node)) {
            // Settled axiom: white border
            border_color = COLORS.STATEMENT_SETTLED_BORDER;
        }
    }

    // ========================================================================
    // Apply interaction state overrides (in priority order)
    // ========================================================================

    // Hover effect (background only)
    if (is_hovered) {
        // Only darken background for nodes with dark backgrounds
        if (background === COLORS.DEFAULT_BACKGROUND) {
            background = COLORS.HOVERED_BACKGROUND;
        }
    }

    // Connected highlight
    if (is_connected) {
        border_color = COLORS.CONNECTED_HIGHLIGHT;
    }

    // Pinned state (higher priority than connected)
    if (is_pinned) {
        border_color = COLORS.PINNED_BORDER;
        border_width = BORDER_WIDTHS.PINNED;
    }

    // Selected state (highest priority)
    if (is_selected) {
        border_color = COLORS.SELECTED_BORDER;
        border_width = BORDER_WIDTHS.SELECTED;
    }

    return {
        background,
        border_color,
        border_width,
        text_color
    };
}

/**
 * Gets CSS string for inline styles from a NodeStyle object.
 * Useful for applying styles directly to elements.
 *
 * @param style - The node style configuration
 * @returns CSS string for inline styling
 *
 * @example
 * ```ts
 * const style = get_node_style(node, connections, false, false, false, false);
 * const css = get_style_css_string(style);
 * element.setAttribute('style', css);
 * // Result: "background: #1e293b; border-color: #475569; border-width: 2px; color: #e2e8f0"
 * ```
 */
export function get_style_css_string(style: NodeStyle): string {
    return `background: ${style.background}; border-color: ${style.border_color}; border-width: ${style.border_width}px; color: ${style.text_color}`;
}
