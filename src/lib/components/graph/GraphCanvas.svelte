<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as d3 from 'd3';
    import type { Simulation, SimulationNodeDatum, SimulationLinkDatum } from 'd3';
    import { graph_store } from '$lib/stores/graph.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import type { LogicNode, D3Link } from '$lib/types/graph';
    import { ConnectionType } from '$lib/types/graph';
    import {
        convert_connections_to_d3_links,
        get_arrow_marker_id,
        get_connection_class,
        get_connection_stroke_dasharray
    } from '$lib/utils/d3-helpers';
    import ArrowMarkers from './ArrowMarkers.svelte';

    let svg_container: SVGSVGElement;
    let width = $state(0);
    let height = $state(0);
    let simulation: Simulation<LogicNode, D3Link> | null = null;

    // Reactive references to store data
    let nodes = $derived(graph_store.nodes);
    let connections = $derived(graph_store.connections);
    let links = $derived(convert_connections_to_d3_links(connections));

    onMount(() => {
        // Load sample data for testing
        graph_store.load_sample_data();

        // Get container dimensions
        update_dimensions();
        window.addEventListener('resize', update_dimensions);

        // Initialize D3 visualization
        initialize_d3();
    });

    onDestroy(() => {
        window.removeEventListener('resize', update_dimensions);
        if (simulation) {
            simulation.stop();
        }
    });

    function update_dimensions() {
        if (svg_container) {
            width = svg_container.clientWidth;
            height = svg_container.clientHeight;
        }
    }

    function initialize_d3() {
        if (!svg_container) return;

        const svg = d3.select(svg_container);

        // Create zoom behavior
        const zoom_behavior = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                svg.select<SVGGElement>('g.zoom-container').attr('transform', event.transform);
            });

        svg.call(zoom_behavior);

        // Initialize force simulation
        simulation = d3
            .forceSimulation<LogicNode>(nodes)
            .force('charge', d3.forceManyBody<LogicNode>().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide<LogicNode>().radius(40))
            .force(
                'link',
                d3
                    .forceLink<LogicNode, D3Link>(links)
                    .id((d) => d.id)
                    .distance(150)
                    .strength(0.7)
            )
            .on('tick', tick_handler);

        // Initial render
        render_graph();
    }

    function render_graph() {
        if (!svg_container) return;

        const svg = d3.select(svg_container);
        const container = svg.select<SVGGElement>('g.zoom-container');

        // Update links
        const link_selection = container
            .select<SVGGElement>('g.links')
            .selectAll<SVGLineElement, D3Link>('line')
            .data(links, (d) => `${(d.source as LogicNode).id}-${(d.target as LogicNode).id}`);

        link_selection.exit().remove();

        const link_enter = link_selection
            .enter()
            .append('line')
            .attr('class', (d) => `link ${get_connection_class(d.connection.type)}`)
            .attr('stroke', (d) =>
                d.connection.type === ConnectionType.IMPLICATION
                    ? 'var(--link-implication)'
                    : 'var(--link-contradiction)'
            )
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', (d) => get_connection_stroke_dasharray(d.connection.type))
            .attr('marker-end', (d) => `url(#${get_arrow_marker_id(d.connection.type)})`)
            .attr('marker-start', (d) =>
                d.connection.type === ConnectionType.CONTRADICTION
                    ? `url(#${get_arrow_marker_id(d.connection.type)}-start)`
                    : null
            );

        // Update nodes
        const node_selection = container
            .select<SVGGElement>('g.nodes')
            .selectAll<SVGCircleElement, LogicNode>('circle')
            .data(nodes, (d) => d.id);

        node_selection.exit().remove();

        const node_enter = node_selection
            .enter()
            .append('circle')
            .attr('r', 8)
            .attr('fill', 'var(--node-default)')
            .attr('stroke', 'var(--border-default)')
            .attr('stroke-width', 2)
            .attr('cursor', 'pointer')
            .call(
                d3
                    .drag<SVGCircleElement, LogicNode>()
                    .on('start', drag_started)
                    .on('drag', dragged)
                    .on('end', drag_ended)
            )
            .on('click', (event, d) => {
                event.stopPropagation();
                selection_store.select_node(d.id);
            })
            .on('mouseover', function () {
                d3.select(this).attr('fill', 'var(--node-hover)');
            })
            .on('mouseout', function (event, d) {
                const is_selected = selection_store.is_selected(d.id);
                d3.select(this).attr(
                    'fill',
                    is_selected ? 'var(--node-selected)' : 'var(--node-default)'
                );
            });

        // Add labels
        const label_selection = container
            .select<SVGGElement>('g.labels')
            .selectAll<SVGTextElement, LogicNode>('text')
            .data(nodes, (d) => d.id);

        label_selection.exit().remove();

        const label_enter = label_selection
            .enter()
            .append('text')
            .attr('class', 'node-label')
            .attr('text-anchor', 'middle')
            .attr('dy', -15)
            .attr('fill', 'var(--text-primary)')
            .attr('font-size', '12px')
            .attr('pointer-events', 'none')
            .text((d) => d.name);

        // Update merged selections
        node_selection
            .merge(node_enter)
            .attr('fill', (d) =>
                selection_store.is_selected(d.id) ? 'var(--node-selected)' : 'var(--node-default)'
            );
    }

    function tick_handler() {
        if (!svg_container) return;

        const svg = d3.select(svg_container);
        const container = svg.select<SVGGElement>('g.zoom-container');

        // Update link positions
        container
            .selectAll<SVGLineElement, D3Link>('line.link')
            .attr('x1', (d) => (d.source as LogicNode).x!)
            .attr('y1', (d) => (d.source as LogicNode).y!)
            .attr('x2', (d) => (d.target as LogicNode).x!)
            .attr('y2', (d) => (d.target as LogicNode).y!);

        // Update node positions
        container
            .selectAll<SVGCircleElement, LogicNode>('circle')
            .attr('cx', (d) => d.x!)
            .attr('cy', (d) => d.y!);

        // Update label positions
        container
            .selectAll<SVGTextElement, LogicNode>('text.node-label')
            .attr('x', (d) => d.x!)
            .attr('y', (d) => d.y!);
    }

    function drag_started(
        event: d3.D3DragEvent<SVGCircleElement, LogicNode, LogicNode>,
        d: LogicNode
    ) {
        if (!event.active && simulation) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, LogicNode, LogicNode>, d: LogicNode) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function drag_ended(
        event: d3.D3DragEvent<SVGCircleElement, LogicNode, LogicNode>,
        d: LogicNode
    ) {
        if (!event.active && simulation) simulation.alphaTarget(0);
        // Keep node pinned after drag
        // To unpin, set d.fx = null and d.fy = null
    }

    // React to data changes
    $effect(() => {
        // When nodes or links change, update the simulation and re-render
        if (simulation) {
            simulation.nodes(nodes);
            const link_force = simulation.force<d3.ForceLink<LogicNode, D3Link>>('link');
            if (link_force) {
                link_force.links(links);
            }
            simulation.alpha(0.3).restart();
            render_graph();
        }
    });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<svg
    bind:this={svg_container}
    class="graph-canvas"
    role="application"
    aria-label="Logic graph visualization"
    onclick={() => selection_store.clear_selection()}
    onkeydown={(e) => {
        if (e.key === 'Escape') {
            selection_store.clear_selection();
        }
    }}
    tabindex="0"
>
    <ArrowMarkers />
    <g class="zoom-container">
        <g class="links"></g>
        <g class="nodes"></g>
        <g class="labels"></g>
    </g>
</svg>

<style>
    .graph-canvas {
        width: 100%;
        height: 100%;
        background: var(--bg-primary);
        cursor: grab;
    }

    .graph-canvas:active {
        cursor: grabbing;
    }

    :global(.link) {
        opacity: 0.8;
    }

    :global(.link:hover) {
        opacity: 1;
        stroke-width: 3px;
    }
</style>
