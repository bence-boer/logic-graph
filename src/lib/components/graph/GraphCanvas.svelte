<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as d3 from 'd3';
    import type { Simulation, SimulationNodeDatum, SimulationLinkDatum } from 'd3';
    import { graph_store } from '$lib/stores/graph.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
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
    let hovered_node_id = $state<string | null>(null);

    // Store mutable copies for D3 simulation
    let simulation_nodes: LogicNode[] = [];
    let simulation_links: D3Link[] = [];

    // Reactive references to store data
    let nodes = $derived(graph_store.nodes);
    let connections = $derived(graph_store.connections);
    let links = $derived(convert_connections_to_d3_links(connections));
    let show_labels = $derived(ui_store.show_labels);
    let show_descriptions = $derived(ui_store.show_descriptions);

    // Get connected node IDs for highlighting
    function get_connected_node_ids(node_id: string): Set<string> {
        const connected = new Set<string>();
        connections.forEach((conn) => {
            if (conn.sources.includes(node_id)) {
                conn.targets.forEach((target) => connected.add(target));
            }
            if (conn.targets.includes(node_id)) {
                conn.sources.forEach((source) => connected.add(source));
            }
        });
        return connected;
    }

    // Check if a link is connected to the hovered node
    function is_link_connected_to_hovered(link: D3Link): boolean {
        if (!hovered_node_id) return false;
        const source_id = (link.source as LogicNode).id;
        const target_id = (link.target as LogicNode).id;
        return source_id === hovered_node_id || target_id === hovered_node_id;
    }

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

        // Create initial mutable copies for simulation
        simulation_nodes = nodes.map((n) => ({ ...n }));
        simulation_links = links.map((l) => ({ ...l }));

        // Initialize force simulation
        simulation = d3
            .forceSimulation<LogicNode>(simulation_nodes)
            .force('charge', d3.forceManyBody<LogicNode>().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide<LogicNode>().radius(40))
            .force(
                'link',
                d3
                    .forceLink<LogicNode, D3Link>(simulation_links)
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
            .data(
                simulation_links,
                (d) => `${(d.source as LogicNode).id}-${(d.target as LogicNode).id}`
            );

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
            )
            .attr('cursor', 'pointer')
            .on('click', (event, d) => {
                event.stopPropagation();
                selection_store.select_connection(d.connection.id);
            })
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .attr('stroke-width', 4)
                    .style('filter', 'drop-shadow(0 0 4px currentColor)');
            })
            .on('mouseout', function (event, d) {
                const is_selected = selection_store.is_selected(d.connection.id);
                d3.select(this)
                    .attr('stroke-width', is_selected ? 3 : 2)
                    .style('filter', is_selected ? 'drop-shadow(0 0 6px currentColor)' : 'none');
            });

        // Update merged link selection
        link_selection
            .merge(link_enter)
            .attr('stroke-width', (d) => {
                const is_selected = selection_store.is_selected(d.connection.id);
                const is_connected = is_link_connected_to_hovered(d);
                if (is_selected) return 3;
                if (is_connected) return 3;
                return 2;
            })
            .style('filter', (d) => {
                const is_selected = selection_store.is_selected(d.connection.id);
                const is_connected = is_link_connected_to_hovered(d);
                if (is_selected) return 'drop-shadow(0 0 6px currentColor)';
                if (is_connected) return 'drop-shadow(0 0 4px currentColor)';
                return 'none';
            })
            .style('opacity', (d) => {
                if (!hovered_node_id) return 0.8;
                const is_connected = is_link_connected_to_hovered(d);
                return is_connected ? 1 : 0.3;
            });

        // Update nodes
        const node_selection = container
            .select<SVGGElement>('g.nodes')
            .selectAll<SVGCircleElement, LogicNode>('circle')
            .data(simulation_nodes, (d) => d.id);

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
            .on('mouseover', function (event, d) {
                hovered_node_id = d.id;
                d3.select(this)
                    .attr('r', 10)
                    .attr('stroke-width', 3)
                    .style('filter', 'drop-shadow(0 0 8px var(--accent-primary))');
                render_graph(); // Re-render to update link highlighting
            })
            .on('mouseout', function (event, d) {
                hovered_node_id = null;
                const is_selected = selection_store.is_selected(d.id);
                const is_pinned = d.fx !== null && d.fx !== undefined;
                d3.select(this)
                    .attr('r', is_selected ? 10 : 8)
                    .attr('stroke-width', is_pinned ? 3 : 2)
                    .style(
                        'filter',
                        is_selected ? 'drop-shadow(0 0 8px var(--accent-primary))' : 'none'
                    );
                render_graph(); // Re-render to update link highlighting
            });

        // Add title (tooltip) for nodes
        node_enter.append('title').text((d) => {
            if (show_descriptions && d.description) {
                return `${d.name}\n${d.description}`;
            }
            return d.name;
        });

        // Update merged selections
        node_selection
            .merge(node_enter)
            .attr('fill', (d) => {
                if (selection_store.is_selected(d.id)) return 'var(--node-selected)';
                if (hovered_node_id && get_connected_node_ids(hovered_node_id).has(d.id)) {
                    return 'var(--node-hover)';
                }
                return 'var(--node-default)';
            })
            .attr('r', (d) => (selection_store.is_selected(d.id) ? 10 : 8))
            .attr('stroke', (d) => {
                const is_pinned = d.fx !== null && d.fx !== undefined;
                if (is_pinned) return 'var(--accent-tertiary)';
                return 'var(--border-default)';
            })
            .attr('stroke-width', (d) => {
                const is_pinned = d.fx !== null && d.fx !== undefined;
                return is_pinned ? 3 : 2;
            })
            .style('filter', (d) => {
                if (selection_store.is_selected(d.id))
                    return 'drop-shadow(0 0 8px var(--accent-primary))';
                return 'none';
            })
            .style('opacity', (d) => {
                if (!hovered_node_id) return 1;
                if (d.id === hovered_node_id) return 1;
                if (get_connected_node_ids(hovered_node_id).has(d.id)) return 1;
                return 0.3;
            });

        // Update tooltips for all nodes (both new and existing)
        node_selection
            .merge(node_enter)
            .select('title')
            .text((d) => {
                if (show_descriptions && d.description) {
                    return `${d.name}\n${d.description}`;
                }
                return d.name;
            });

        // Add labels
        const label_selection = container
            .select<SVGGElement>('g.labels')
            .selectAll<SVGTextElement, LogicNode>('text')
            .data(simulation_nodes, (d) => d.id);

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

        // Update label opacity based on hover state and show_labels setting
        label_selection
            .merge(label_enter)
            .style('display', show_labels ? 'block' : 'none')
            .style('opacity', (d) => {
                if (!show_labels) return 0;
                if (!hovered_node_id) return 1;
                if (d.id === hovered_node_id) return 1;
                if (get_connected_node_ids(hovered_node_id).has(d.id)) return 1;
                return 0.3;
            })
            .style('font-weight', (d) => {
                if (selection_store.is_selected(d.id)) return 'bold';
                if (d.id === hovered_node_id) return 'bold';
                return 'normal';
            });
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
        // Store the starting position to detect if node was actually dragged
        (d as any)._drag_start_x = d.x;
        (d as any)._drag_start_y = d.y;
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
        
        // Check if the node was actually dragged (moved more than 5 pixels)
        const start_x = (d as any)._drag_start_x ?? d.x;
        const start_y = (d as any)._drag_start_y ?? d.y;
        const distance_moved = Math.sqrt(
            Math.pow((d.x ?? 0) - start_x, 2) + Math.pow((d.y ?? 0) - start_y, 2)
        );
        
        if (distance_moved > 5) {
            // Node was dragged - keep it pinned
            graph_store.update_node(d.id, {
                x: d.x,
                y: d.y,
                fx: d.fx,
                fy: d.fy
            });
        } else {
            // Node was just clicked - unpin it
            d.fx = null;
            d.fy = null;
            graph_store.update_node(d.id, {
                x: d.x,
                y: d.y,
                fx: null,
                fy: null
            });
        }
        
        // Clean up temporary drag tracking properties
        delete (d as any)._drag_start_x;
        delete (d as any)._drag_start_y;
    }

    // React to data changes
    $effect(() => {
        // When nodes or links change, update the simulation and re-render
        if (simulation) {
            // Sync store data to simulation arrays
            // Update existing nodes and add new ones
            const node_map = new Map(simulation_nodes.map((n) => [n.id, n]));

            // Update or add nodes from store
            nodes.forEach((store_node) => {
                const sim_node = node_map.get(store_node.id);
                if (sim_node) {
                    // Update existing node properties (preserve D3 properties)
                    Object.assign(sim_node, {
                        name: store_node.name,
                        description: store_node.description,
                        fx: store_node.fx,
                        fy: store_node.fy
                    });
                } else {
                    // Add new node
                    simulation_nodes.push({ ...store_node });
                }
            });

            // Remove deleted nodes
            simulation_nodes = simulation_nodes.filter((sim_node) =>
                nodes.some((store_node) => store_node.id === sim_node.id)
            );

            // Update links
            simulation_links = links.map((l) => ({ ...l }));

            // Update simulation with new data
            simulation.nodes(simulation_nodes);
            const link_force = simulation.force<d3.ForceLink<LogicNode, D3Link>>('link');
            if (link_force) {
                link_force.links(simulation_links);
            }
            simulation.alpha(0.3).restart();
            render_graph();
        }
    });

    // React to UI setting changes
    $effect(() => {
        // When show_labels or show_descriptions changes, re-render
        if (simulation) {
            // Access the reactive values to track them
            show_labels;
            show_descriptions;
            render_graph();
        }
    });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<svg
    bind:this={svg_container}
    class="h-full w-full cursor-grab bg-(--bg-primary) active:cursor-grabbing"
    role="application"
    aria-label="Logic graph visualization"
    onclick={() => {
        selection_store.clear_selection();
        ui_store.close_right_panel();
    }}
    onkeydown={(e) => {
        if (e.key === 'Escape') {
            selection_store.clear_selection();
            ui_store.close_right_panel();
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
    :global(.link) {
        opacity: 0.8;
        transition:
            stroke-width 0.2s ease,
            opacity 0.2s ease;
    }

    :global(.link:hover) {
        opacity: 1;
    }

    :global(.node-label) {
        transition:
            opacity 0.2s ease,
            font-weight 0.2s ease;
        user-select: none;
    }

    :global(circle) {
        transition:
            r 0.2s ease,
            stroke-width 0.2s ease,
            opacity 0.2s ease;
    }
</style>
