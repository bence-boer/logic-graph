<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as d3 from 'd3';
    import type { Simulation } from 'd3';
    import { graph_store } from '$lib/stores/graph.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import type { LogicNode, D3Link } from '$lib/types/graph';
    import { convert_connections_to_d3_links } from '$lib/utils/d3-helpers';
    import { GraphTopology } from '$lib/utils/graph-algorithms';
    import {
        create_simulation,
        update_simulation,
        sync_simulation_nodes,
        DEFAULT_SIMULATION_CONFIG
    } from '$lib/utils/d3/simulation';
    import { create_drag_handlers } from '$lib/utils/d3/interactions';
    import {
        render_links,
        update_link_positions,
        render_nodes,
        update_node_positions,
        render_labels,
        update_label_positions
    } from './canvas';
    import ArrowMarkers from './ArrowMarkers.svelte';

    let svg_container: SVGSVGElement;
    let width = $state(0);
    let height = $state(0);
    let simulation: Simulation<LogicNode, D3Link> | null = null;
    let hovered_node_id = $state<string | null>(null);

    // Store mutable copies for D3 simulation
    let simulation_nodes: LogicNode[] = [];
    let simulation_links: D3Link[] = [];

    // SVG container reference
    let svg_zoom_container: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;

    // Reactive references to store data
    let nodes = $derived(graph_store.nodes);
    let connections = $derived(graph_store.connections);
    let links = $derived(convert_connections_to_d3_links(connections));
    let show_labels = $derived(ui_store.show_labels);
    let show_descriptions = $derived(ui_store.show_descriptions);

    // Use GraphTopology for efficient neighbor lookups
    let topology = $derived(new GraphTopology(connections));

    // Get connected node IDs for highlighting using cached topology
    let connected_node_ids = $derived(
        hovered_node_id ? topology.get_neighbors(hovered_node_id) : new Set<string>()
    );

    // Check if a link is connected to the hovered node
    function is_link_connected_to_hovered(link: D3Link): boolean {
        if (!hovered_node_id) return false;
        const source_id = (link.source as LogicNode).id;
        const target_id = (link.target as LogicNode).id;
        return source_id === hovered_node_id || target_id === hovered_node_id;
    }

    // Handle node hover events
    function handle_node_hover(node_id: string | null) {
        hovered_node_id = node_id;
        render_graph();
    }

    // Create drag handlers using extracted utility
    const drag_handlers = create_drag_handlers({
        simulation,
        on_pin: (node) => {
            graph_store.update_node(node.id, {
                x: node.x,
                y: node.y,
                fx: node.fx,
                fy: node.fy
            });
        },
        on_unpin: (node) => {
            graph_store.update_node(node.id, {
                x: node.x,
                y: node.y,
                fx: null,
                fy: null
            });
        }
    });

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
        svg_zoom_container = svg.select<SVGGElement>('g.zoom-container');

        // Create zoom behavior
        const zoom_behavior = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                if (svg_zoom_container) {
                    svg_zoom_container.attr('transform', event.transform);
                }
            });

        svg.call(zoom_behavior);

        // Create initial mutable copies for simulation
        simulation_nodes = nodes.map((n) => ({ ...n }));
        simulation_links = links.map((l) => ({ ...l }));

        // Initialize force simulation with extracted utility
        simulation = create_simulation(simulation_nodes, simulation_links, {
            ...DEFAULT_SIMULATION_CONFIG,
            center_force: [width / 2, height / 2]
        });

        simulation.on('tick', tick_handler);

        // Initial render
        render_graph();
    }

    function render_graph() {
        if (!svg_zoom_container) return;

        // Delegate rendering to utility functions
        render_links(
            svg_zoom_container,
            simulation_links,
            hovered_node_id,
            is_link_connected_to_hovered
        );
        render_nodes(
            svg_zoom_container,
            simulation_nodes,
            drag_handlers,
            hovered_node_id,
            connected_node_ids,
            show_descriptions,
            handle_node_hover
        );
        render_labels(
            svg_zoom_container,
            simulation_nodes,
            hovered_node_id,
            connected_node_ids,
            show_labels
        );
    }

    function tick_handler() {
        if (!svg_zoom_container) return;

        // Delegate position updates to utility functions
        update_link_positions(svg_zoom_container);
        update_node_positions(svg_zoom_container);
        update_label_positions(svg_zoom_container);
    }

    // React to data changes
    $effect(() => {
        // When nodes or links change, update the simulation and re-render
        if (simulation) {
            // Sync store data to simulation arrays using extracted utility
            simulation_nodes = sync_simulation_nodes(simulation_nodes, nodes);

            // Update links
            simulation_links = links.map((l) => ({ ...l }));

            // Update simulation with new data using extracted utility
            update_simulation(simulation, simulation_nodes, simulation_links);
            render_graph();
        }
    });

    // React to UI setting changes
    $effect(() => {
        // When show_labels or show_descriptions changes, re-render
        if (simulation) {
            // Access the reactive values to track them
            void show_labels;
            void show_descriptions;
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
