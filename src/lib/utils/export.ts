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
 * Export SVG to string with embedded styles
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
            stroke: #7c3aed;
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
 * Export to PNG or JPEG with custom dimensions and scale
 */
export async function export_to_image(
    format: 'png' | 'jpeg',
    options: {
        svg_element?: SVGSVGElement;
        scale?: number;
        background_color?: string;
    } = {}
): Promise<Blob> {
    const { svg_element, scale = 2, background_color } = options;

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
            // Apply scale for higher quality
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            // Scale the context
            ctx.scale(scale, scale);

            // Fill background
            const bg_color = background_color || (format === 'jpeg' ? '#1a1a1a' : 'transparent');
            if (bg_color !== 'transparent') {
                ctx.fillStyle = bg_color;
                ctx.fillRect(0, 0, img.width, img.height);
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
    const blob = await export_to_image('png', { svg_element, scale: 2 });
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
    const blob = await export_to_image('jpeg', {
        svg_element,
        scale: 2,
        background_color: '#1a1a1a'
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}

/**
 * Export as standalone HTML with full D3 visualization
 */
export function export_to_html(graph: LogicGraph): string {
    const graph_json = JSON.stringify(graph, null, 2);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${graph.metadata?.name || 'Logic Graph'}</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
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
            background: #1a1a1a;
            cursor: grab;
        }
        svg:active {
            cursor: grabbing;
        }
        .link {
            opacity: 0.8;
            transition: stroke-width 0.2s ease, opacity 0.2s ease;
        }
        .link:hover {
            opacity: 1;
        }
        .link-implication {
            stroke: #7c3aed;
        }
        .link-contradiction {
            stroke: #ef4444;
        }
        circle {
            fill: #4a5568;
            stroke: #3a3a3a;
            stroke-width: 2;
            cursor: pointer;
            transition: r 0.2s ease, stroke-width 0.2s ease;
        }
        circle:hover {
            fill: #5a6578;
        }
        .node-label {
            fill: #ffffff;
            font-size: 12px;
            text-anchor: middle;
            pointer-events: none;
            user-select: none;
        }
        .info {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(42, 42, 42, 0.9);
            border: 1px solid #3a3a3a;
            border-radius: 8px;
            padding: 16px;
            max-width: 300px;
        }
        .info h2 {
            font-size: 1.125rem;
            margin-bottom: 8px;
        }
        .info p {
            font-size: 0.875rem;
            color: #a0a0a0;
            margin-bottom: 4px;
        }
    </style>
</head>
<body>
    <div class="info">
        <h2>${graph.metadata?.name || 'Logic Graph'}</h2>
        ${graph.metadata?.description ? `<p>${graph.metadata.description}</p>` : ''}
        <p>Nodes: ${graph.nodes.length}</p>
        <p>Connections: ${graph.connections.length}</p>
    </div>
    <svg id="graph"></svg>
    <script>
        const graphData = ${graph_json};
        
        // Set up SVG
        const svg = d3.select('#graph');
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Create zoom container
        const g = svg.append('g').attr('class', 'zoom-container');
        
        // Add arrow markers
        const defs = svg.append('defs');
        
        // Implication arrow
        defs.append('marker')
            .attr('id', 'arrow-implication')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#7c3aed');
        
        // Contradiction arrows (both ends)
        defs.append('marker')
            .attr('id', 'arrow-contradiction')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#ef4444');
        
        defs.append('marker')
            .attr('id', 'arrow-contradiction-start')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', -10)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M10,-5L0,0L10,5')
            .attr('fill', '#ef4444');
        
        // Convert connections to D3 links
        const links = [];
        graphData.connections.forEach(conn => {
            conn.sources.forEach(source => {
                conn.targets.forEach(target => {
                    links.push({
                        source: source,
                        target: target,
                        type: conn.type,
                        connection: conn
                    });
                });
            });
        });
        
        // Create force simulation
        const simulation = d3.forceSimulation(graphData.nodes)
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(40))
            .force('link', d3.forceLink(links)
                .id(d => d.id)
                .distance(150)
                .strength(0.7));
        
        // Create links
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(links)
            .enter()
            .append('line')
            .attr('class', d => \`link link-\${d.type}\`)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', d => d.type === 'contradiction' ? '5,5' : null)
            .attr('marker-end', d => \`url(#arrow-\${d.type})\`)
            .attr('marker-start', d => d.type === 'contradiction' ? \`url(#arrow-\${d.type}-start)\` : null);
        
        // Create nodes
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(graphData.nodes)
            .enter()
            .append('circle')
            .attr('r', 8)
            .call(d3.drag()
                .on('start', dragStarted)
                .on('drag', dragged)
                .on('end', dragEnded))
            .append('title')
            .text(d => \`\${d.name}\${d.description ? '\\n' + d.description : ''}\`);
        
        // Create labels
        const label = g.append('g')
            .attr('class', 'labels')
            .selectAll('text')
            .data(graphData.nodes)
            .enter()
            .append('text')
            .attr('class', 'node-label')
            .attr('dy', -15)
            .text(d => d.name);
        
        // Update positions on tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
            
            label
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });
        
        // Drag functions
        function dragStarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragEnded(event, d) {
            if (!event.active) simulation.alphaTarget(0);
        }
        
        // Zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        
        svg.call(zoom);
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
