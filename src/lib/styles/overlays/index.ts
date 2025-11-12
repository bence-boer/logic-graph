/**
 * Overlay rendering utilities
 *
 * Functions to render visual overlays on nodes including:
 * - Pin indicators
 * - Checkmark indicators
 * - Selection highlights
 */

import type { ResolvedOverlay } from '../types';
import { OverlayType } from '../types';
import * as d3 from 'd3';

/**
 * Render all overlays for a node
 *
 * @param node_group - D3 selection of the node group
 * @param overlays - Array of resolved overlays to render
 *
 * @example
 * ```ts
 * render_overlays(node_group, resolved_style.overlays);
 * ```
 */
export function render_overlays(
    node_group: d3.Selection<SVGGElement, unknown, SVGGElement, unknown>,
    overlays: ResolvedOverlay[]
): void {
    const overlays_group = node_group.select<SVGGElement>('g.overlays');

    // Bind overlay data
    const overlay_selection = overlays_group
        .selectAll<SVGGElement, ResolvedOverlay>('g.overlay')
        .data(overlays, (d) => d.type);

    // Remove old overlays
    overlay_selection.exit().remove();

    // Add new overlays
    const overlay_enter = overlay_selection
        .enter()
        .append('g')
        .attr('class', (d) => `overlay overlay-${d.type}`)
        .style('pointer-events', 'none');

    // Render overlay content based on type
    overlay_enter.each(function (this: SVGGElement, d: ResolvedOverlay) {
        const group = d3.select<SVGGElement, ResolvedOverlay>(this);
        render_overlay_content(
            group as unknown as d3.Selection<SVGGElement, ResolvedOverlay, SVGGElement, unknown>,
            d
        );
    });

    // Update all overlays
    overlay_selection
        .merge(overlay_enter)
        .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
        .style('opacity', (d) => (d.visible ? (d.style.opacity ?? 1) : 0));
}

/**
 * Render specific overlay content based on type
 */
function render_overlay_content(
    group: d3.Selection<SVGGElement, ResolvedOverlay, SVGGElement, unknown>,
    overlay: ResolvedOverlay
): void {
    switch (overlay.type) {
        case OverlayType.PIN:
            render_pin_indicator(group, overlay);
            break;
        case OverlayType.CHECKMARK:
            render_checkmark_indicator(group, overlay);
            break;
        case OverlayType.SELECTION:
            render_selection_highlight(group, overlay);
            break;
        default:
            // Other overlay types can be added here
            break;
    }
}

/**
 * Render pin indicator overlay
 */
function render_pin_indicator(
    group: d3.Selection<SVGGElement, ResolvedOverlay, SVGGElement, unknown>,
    overlay: ResolvedOverlay
): void {
    const size = overlay.width;
    const center_x = size / 2;
    const center_y = size / 2;

    // Background circle
    group
        .append('circle')
        .attr('cx', center_x)
        .attr('cy', center_y)
        .attr('r', size / 2)
        .attr('fill', overlay.style.background ?? '#1e293b')
        .attr('fill-opacity', 0.9);

    // Pin icon SVG
    const icon_size = size * 0.6;
    const icon_offset = (size - icon_size) / 2;

    const pin_svg = group
        .append('svg')
        .attr('x', icon_offset)
        .attr('y', icon_offset)
        .attr('width', icon_size)
        .attr('height', icon_size)
        .attr('viewBox', '0 0 24 24')
        .attr('fill', 'none')
        .attr('stroke', overlay.style.color ?? '#8b5cf6')
        .attr('stroke-width', '2.5')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');

    // Pin icon paths
    pin_svg.append('path').attr('d', 'M12 17v5');
    pin_svg
        .append('path')
        .attr(
            'd',
            'M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z'
        );
}

/**
 * Render checkmark indicator overlay
 */
function render_checkmark_indicator(
    group: d3.Selection<SVGGElement, ResolvedOverlay, SVGGElement, unknown>,
    overlay: ResolvedOverlay
): void {
    const size = overlay.width;
    const center_x = size / 2;
    const center_y = size / 2;

    // Background circle
    group
        .append('circle')
        .attr('cx', center_x)
        .attr('cy', center_y)
        .attr('r', size / 2)
        .attr('fill', overlay.style.background ?? '#10b981')
        .attr('fill-opacity', 0.95);

    // Checkmark icon SVG
    const icon_size = size * 0.6;
    const icon_offset = (size - icon_size) / 2;

    const check_svg = group
        .append('svg')
        .attr('x', icon_offset)
        .attr('y', icon_offset)
        .attr('width', icon_size)
        .attr('height', icon_size)
        .attr('viewBox', '0 0 24 24')
        .attr('fill', 'none')
        .attr('stroke', overlay.style.color ?? 'white')
        .attr('stroke-width', '3')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');

    // Checkmark polyline
    check_svg.append('polyline').attr('points', '20 6 9 17 4 12');
}

/**
 * Render selection highlight overlay
 */
function render_selection_highlight(
    group: d3.Selection<SVGGElement, ResolvedOverlay, SVGGElement, unknown>,
    overlay: ResolvedOverlay
): void {
    // Selection highlight is a rect that surrounds the node
    group
        .append('rect')
        .attr('class', 'selection-highlight')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', overlay.width)
        .attr('height', overlay.height)
        .attr('rx', 6)
        .attr('fill', 'none')
        .attr('stroke', overlay.style.color ?? '#3b82f6')
        .attr('stroke-width', 2)
        .style('animation', 'pulse-selection 2s ease-in-out infinite')
        .style('opacity', overlay.style.opacity ?? 0.8);
}
