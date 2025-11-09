/**
 * SVG export utilities for logic graphs
 *
 * Provides functionality to export graph visualizations as SVG with embedded styles.
 */

import { trigger_download } from './download';

/**
 * Export SVG to string with embedded styles
 *
 * Clones the SVG element, sets appropriate viewBox dimensions based on content,
 * and embeds CSS styles for proper rendering when saved as a standalone file.
 *
 * @param svg_element - Optional SVG element to export (defaults to first .graph-canvas)
 * @returns SVG string with embedded styles and XML declaration
 *
 * @throws {Error} If no SVG element is found
 * @throws {Error} If provided element is not an SVGSVGElement
 *
 * @example
 * ```ts
 * const svg_string = export_to_svg();
 * console.log(svg_string); // Full SVG markup with styles
 * ```
 */
export function export_to_svg(svg_element?: SVGSVGElement): string {
    const svg_node = svg_element || document.querySelector('svg.graph-canvas');
    if (!svg_node) {
        throw new Error('No SVG element found');
    }

    // Ensure we have an SVGSVGElement
    if (!(svg_node instanceof SVGSVGElement)) {
        throw new Error('Element is not an SVG element');
    }

    // Clone the SVG to avoid modifying the original
    const svg_clone = svg_node.cloneNode(true) as SVGSVGElement;

    // Get the bounding box of the content
    const bbox = svg_node.getBBox();
    const padding = 40;

    // Set viewBox to content bounds with padding
    svg_clone.setAttribute(
        'viewBox',
        `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`
    );
    svg_clone.setAttribute('width', `${bbox.width + padding * 2}`);
    svg_clone.setAttribute('height', `${bbox.height + padding * 2}`);

    // Embed CSS styles
    const style = document.createElement('style');
    style.textContent = `
        .graph-canvas {
            background: #1a1a1a;
        }
        .link {
            opacity: 0.8;
        }
        .link-implication {
            stroke: #eda312;
        }
        .link-contradiction {
            stroke: #ef4444;
        }
        circle {
            fill: #4a5568;
            stroke: #3a3a3a;
            stroke-width: 2;
        }
        .node-label {
            fill: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            text-anchor: middle;
            user-select: none;
        }
    `;
    svg_clone.insertBefore(style, svg_clone.firstChild);

    const serializer = new XMLSerializer();
    let svg_string = serializer.serializeToString(svg_clone);

    // Add XML declaration
    svg_string = '<?xml version="1.0" standalone="no"?>\r\n' + svg_string;

    return svg_string;
}

/**
 * Download SVG as file
 *
 * Exports the graph as an SVG file and triggers a browser download.
 *
 * @param filename - Name for the downloaded file (default: 'logic-graph.svg')
 * @param svg_element - Optional SVG element to export
 *
 * @example
 * ```ts
 * download_as_svg('my-graph.svg');
 * ```
 */
export function download_as_svg(filename = 'logic-graph.svg', svg_element?: SVGSVGElement): void {
    const svg_string = export_to_svg(svg_element);
    const blob = new Blob([svg_string], { type: 'image/svg+xml;charset=utf-8' });
    trigger_download(blob, filename);
}
