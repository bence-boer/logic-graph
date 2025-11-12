/**
 * Style applicators - utilities for applying resolved styles to DOM elements
 *
 * This module provides functions to:
 * - Generate inline styles
 * - Apply styles to D3 selections
 * - Generate CSS variables
 */

import type { ResolvedNodeStyle } from '../types';
import type * as d3 from 'd3';

/**
 * Generate inline styles for properties that can't be predefined
 * Returns a record of CSS properties and values
 *
 * @param style - Resolved node style
 * @returns Object with CSS property-value pairs
 *
 * @example
 * ```ts
 * const inline_styles = generate_inline_styles(resolved_style);
 * // { 'background-color': '#1e293b', 'border-color': '#475569', ... }
 * ```
 */
export function generate_inline_styles(style: ResolvedNodeStyle): Record<string, string> {
    const styles: Record<string, string> = {
        'background-color': style.background,
        'border-color': style.border_color,
        'border-width': `${style.border_width}px`,
        'border-radius': `${style.border_radius}px`,
        color: style.text_color,
        'font-size': `${style.font_size}px`,
        'font-weight': String(style.font_weight),
        opacity: String(style.opacity),
        padding: `${style.padding}px`,
        'box-shadow': style.box_shadow,
        transition: style.transition,
        cursor: style.cursor,
        'pointer-events': style.pointer_events
    };

    // Optional properties
    if (style.filter) {
        styles['filter'] = style.filter;
    }
    if (style.transform) {
        styles['transform'] = style.transform;
    }

    return styles;
}

/**
 * Apply resolved style to D3 selection
 * Applies all inline styles to the node container element
 *
 * @param selection - D3 selection of node group
 * @param style - Resolved node style
 *
 * @example
 * ```ts
 * const node_group = d3.select('.node');
 * apply_style_to_d3_selection(node_group, resolved_style);
 * ```
 */
export function apply_style_to_d3_selection(
    selection: d3.Selection<SVGGElement, unknown, SVGGElement, unknown>,
    style: ResolvedNodeStyle
): void {
    const inline_styles = generate_inline_styles(style);

    const container = selection.select('.node-container');
    for (const [property, value] of Object.entries(inline_styles)) {
        container.style(property, value);
    }
}

/**
 * Generate CSS string for inline style attribute
 * Useful for setting styles directly via setAttribute
 *
 * @param style - Resolved node style
 * @returns CSS string
 *
 * @example
 * ```ts
 * const css = generate_css_string(resolved_style);
 * element.setAttribute('style', css);
 * // Result: "background-color: #1e293b; border-color: #475569; ..."
 * ```
 */
export function generate_css_string(style: ResolvedNodeStyle): string {
    const inline_styles = generate_inline_styles(style);
    return Object.entries(inline_styles)
        .map(([property, value]) => `${property}: ${value}`)
        .join('; ');
}

/**
 * Generate CSS class names based on style properties
 * Returns array of utility class names
 *
 * @param style - Resolved node style
 * @returns Array of CSS class names
 *
 * @example
 * ```ts
 * const classes = generate_css_classes(resolved_style);
 * // ['node', 'opacity-30', 'has-shadow']
 * ```
 */
export function generate_css_classes(style: ResolvedNodeStyle): string[] {
    const classes: string[] = ['node'];

    // Add opacity class if not fully opaque
    if (style.opacity < 1) {
        classes.push(`opacity-${Math.round(style.opacity * 100)}`);
    }

    // Add shadow class if shadow exists
    if (style.box_shadow !== 'none') {
        classes.push('has-shadow');
    }

    // Add pointer events class if disabled
    if (style.pointer_events === 'none') {
        classes.push('pointer-events-none');
    }

    // Add state class for node rendering
    classes.push('node-rendered');

    return classes;
}
