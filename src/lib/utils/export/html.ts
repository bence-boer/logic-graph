import type { LogicGraph } from '$lib/types/graph';
import { trigger_download } from './download';

/**
 * Generate a standalone HTML string representing the given logic graph.
 * The returned string can be saved as an .html file and opened directly.
 *
 * Implementation notes:
 * - We stringify the graph into the generated page so the page is fully
 *   self-contained. The generated script avoids using inner `${...}`
 * *  template expressions to prevent accidental interpolation by the outer
 *   TypeScript template literal.
 */
export function export_to_html(graph: LogicGraph): string {
    const graph_json = JSON.stringify(graph);

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Logic Graph Export</title>
  <script src="https://unpkg.com/d3@7/dist/d3.min.js"></script>
  <style>
    html,body{height:100%;margin:0}
    body{background:#0b1020;color:#e6eef8;font-family:Inter, system-ui, sans-serif}
    svg{width:100%;height:100%;display:block}
    .link{stroke:#94a3b8;stroke-width:2;opacity:0.85}
    .link-contradiction{stroke-dasharray:5,5;stroke:#ef4444}
    .link-implication{stroke:#eda312}
    .node{fill:#0f1724;stroke:#94a3b8;stroke-width:2}
    .node-selected{stroke:#8b5cf6}
    .node-label{font-size:12px;fill:#cbd5e1;pointer-events:none;text-anchor:middle}
    .info{position:fixed;left:16px;top:16px;background:rgba(17,24,39,0.9);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);max-width:320px}
  </style>
</head>
<body>
  <div class="info">
    <h2>${graph.metadata?.statement || 'Logic Graph'}</h2>
    ${graph.metadata?.details ? `<p>${graph.metadata.details}</p>` : ''}
    <p>Nodes: ${graph.nodes.length}</p>
    <p>Connections: ${graph.connections.length}</p>
  </div>
  <svg id="graph" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice"></svg>
  <script>
    (function(){
      const graphData = ${graph_json};
      const svg = d3.select('#graph');
      const width = Math.max(window.innerWidth, 800);
      const height = Math.max(window.innerHeight, 600);

      // defs and markers
      const defs = svg.append('defs');
      const markerImp = defs.append('marker')
        .attr('id','arrow-implication')
        .attr('viewBox','0 -5 10 10')
        .attr('refX',20)
        .attr('refY',0)
        .attr('markerWidth',6)
        .attr('markerHeight',6)
        .attr('orient','auto');
      markerImp.append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#eda312');

      const markerContra = defs.append('marker')
        .attr('id','arrow-contradiction')
        .attr('viewBox','0 -5 10 10')
        .attr('refX',20)
        .attr('refY',0)
        .attr('markerWidth',6)
        .attr('markerHeight',6)
        .attr('orient','auto');
      markerContra.append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#ef4444');

      const markerContraStart = defs.append('marker')
        .attr('id','arrow-contradiction-start')
        .attr('viewBox','0 -5 10 10')
        .attr('refX',-10)
        .attr('refY',0)
        .attr('markerWidth',6)
        .attr('markerHeight',6)
        .attr('orient','auto');
      markerContraStart.append('path').attr('d','M10,-5L0,0L10,5').attr('fill','#ef4444');

      // convert connections to links
      const links = [];
      graphData.connections.forEach(function(conn){
        conn.sources.forEach(function(source){
          conn.targets.forEach(function(target){
            links.push({ source: source, target: target, type: conn.type, connection: conn });
          });
        });
      });

      // simulation
      const simulation = d3.forceSimulation(graphData.nodes)
        .force('link', d3.forceLink(links).id(function(d){ return d.id; }).distance(150).strength(0.7))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width/2, height/2))
        .force('collision', d3.forceCollide().radius(40));

      // container group
      const g = svg.append('g').attr('class','zoom-container');

      // links
      const link = g.append('g').attr('class','links')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('class', function(l){ return 'link link-' + l.type; })
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', function(l){ return l.type === 'contradiction' ? '5,5' : null; })
        .attr('marker-end', function(l){ return 'url(#arrow-' + l.type + ')'; })
        .attr('marker-start', function(l){ return l.type === 'contradiction' ? 'url(#arrow-contradiction-start)' : null; });

      // nodes
      const node = g.append('g').attr('class','nodes')
        .selectAll('circle')
        .data(graphData.nodes)
        .enter()
        .append('circle')
        .attr('r', 8)
        .attr('class','node')
        .call(d3.drag()
          .on('start', function(event,d){ if(!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag', function(event,d){ d.fx = event.x; d.fy = event.y; })
          .on('end', function(event,d){ if(!event.active) simulation.alphaTarget(0); }));

      node.append('title').text(function(d){ return d.statement + (d.details ? '\n' + d.details : ''); });

      // labels
      const label = g.append('g').attr('class','labels')
        .selectAll('text')
        .data(graphData.nodes)
        .enter()
        .append('text')
        .attr('class','node-label')
        .attr('dy', -15)
        .text(function(d){ return d.statement; });

      simulation.on('tick', function(){
        link
          .attr('x1', function(d){ return d.source.x; })
          .attr('y1', function(d){ return d.source.y; })
          .attr('x2', function(d){ return d.target.x; })
          .attr('y2', function(d){ return d.target.y; });

        node
          .attr('cx', function(d){ return d.x; })
          .attr('cy', function(d){ return d.y; });

        label
          .attr('x', function(d){ return d.x; })
          .attr('y', function(d){ return d.y; });
      });

      // zoom
      const zoom = d3.zoom().scaleExtent([0.1,4]).on('zoom', function(event){ g.attr('transform', event.transform); });
      svg.call(zoom);
    })();
  </script>
</body>
</html>`;
}

/**
 * Download as HTML
 *
 * Exports the graph as a standalone HTML file and triggers a browser download.
 */
export function download_as_html(graph: LogicGraph, filename = 'logic-graph.html'): void {
    const html_string = export_to_html(graph);
    const blob = new Blob([html_string], { type: 'text/html;charset=utf-8' });
    trigger_download(blob, filename);
}
