/**
 * HTML export utilities for logic graphs
 *
 * Provides functionality to export graphs as standalone HTML files
 * with embedded D3 visualization code.
 */

import type { LogicGraph } from '$lib/types/graph';
import { trigger_download } from './download';

/**
 * Export as standalone HTML with full D3 visualization
 *
 * Creates a complete, self-contained HTML file that includes:
 * - D3.js library from CDN
 * - Full graph data embedded as JSON
 * - Interactive force-directed visualization
 * - Zoom and pan controls
 * - Node dragging functionality
 *
 * The exported HTML file can be opened in any modern browser without
 * requiring a web server or additional dependencies.
 *
 * @param graph - The graph to export
 * @returns Complete HTML document as string
 *
 * @example
 * ```ts
 * const html = export_to_html(graph);
 * // html is a complete standalone document
 * ```
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
 *
 * Exports the graph as a standalone HTML file and triggers a browser download.
 * The exported file can be opened directly in a browser for viewing and interaction.
 *
 * @param graph - The graph to export
 * @param filename - Name for the downloaded file (default: 'logic-graph.html')
 *
 * @example
 * ```ts
 * download_as_html(graph, 'my-graph.html');
 * ```
 */
export function download_as_html(graph: LogicGraph, filename = 'logic-graph.html'): void {
    const html_string = export_to_html(graph);
    const blob = new Blob([html_string], { type: 'text/html;charset=utf-8' });
    trigger_download(blob, filename);
}
