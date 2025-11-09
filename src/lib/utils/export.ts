/**
 * Export utilities for saving graphs to various formats
 */

import type { LogicGraph } from '$lib/types/graph';

/**
 * Export graph as JSON string
 */
export function export_graph_to_json(graph: LogicGraph): string {
    return JSON.stringify(graph, null, 2);
}

/**
 * Trigger a download of the graph as a JSON file
 */
export function download_graph_as_json(graph: LogicGraph, filename = 'logic-graph.json'): void {
    const json_string = export_graph_to_json(graph);
    const blob = new Blob([json_string], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}

/**
 * Export SVG to string
 */
export function export_to_svg(svg_element?: SVGSVGElement): string {
    const svg_node = svg_element || document.querySelector('svg.graph-canvas');
    if (!svg_node) {
        throw new Error('No SVG element found');
    }

    const serializer = new XMLSerializer();
    let svg_string = serializer.serializeToString(svg_node);

    // Add XML declaration
    svg_string = '<?xml version="1.0" standalone="no"?>\r\n' + svg_string;

    return svg_string;
}

/**
 * Download SVG as file
 */
export function download_as_svg(filename = 'logic-graph.svg', svg_element?: SVGSVGElement): void {
    const svg_string = export_to_svg(svg_element);
    const blob = new Blob([svg_string], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}

/**
 * Export to PNG or JPEG
 */
export async function export_to_image(
    format: 'png' | 'jpeg',
    svg_element?: SVGSVGElement
): Promise<Blob> {
    const svg_string = export_to_svg(svg_element);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    const img = new Image();
    const svg_blob = new Blob([svg_string], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svg_blob);

    return new Promise((resolve, reject) => {
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            // Fill white background for JPEG
            if (format === 'jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(url);
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                },
                `image/${format}`,
                0.95
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * Download as PNG
 */
export async function download_as_png(
    filename = 'logic-graph.png',
    svg_element?: SVGSVGElement
): Promise<void> {
    const blob = await export_to_image('png', svg_element);
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}

/**
 * Download as JPEG
 */
export async function download_as_jpeg(
    filename = 'logic-graph.jpg',
    svg_element?: SVGSVGElement
): Promise<void> {
    const blob = await export_to_image('jpeg', svg_element);
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}

/**
 * Export as standalone HTML
 */
export function export_to_html(graph: LogicGraph): string {
    // This is a basic template - can be enhanced with full visualization code
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${graph.metadata?.name || 'Logic Graph'}</title>
    <script src="https://cdn.jsdelivr.net/npm/d3@7/+esm" type="module"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #ffffff;
            overflow: hidden;
        }
        svg {
            width: 100vw;
            height: 100vh;
        }
        .node {
            cursor: pointer;
            stroke: #3a3a3a;
            stroke-width: 2;
        }
        .link {
            stroke-opacity: 0.8;
        }
        .link-implication {
            stroke: #7c3aed;
        }
        .link-contradiction {
            stroke: #ef4444;
        }
    </style>
</head>
<body>
    <svg id="graph"></svg>
    <script type="module">
        import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
        
        const graph = ${JSON.stringify(graph, null, 2)};
        
        // Basic D3 visualization code
        const svg = d3.select('#graph');
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        console.log('Graph loaded:', graph);
        // TODO: Add full D3 visualization implementation
    </script>
</body>
</html>`;
}

/**
 * Download as HTML
 */
export function download_as_html(graph: LogicGraph, filename = 'logic-graph.html'): void {
    const html_string = export_to_html(graph);
    const blob = new Blob([html_string], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}
