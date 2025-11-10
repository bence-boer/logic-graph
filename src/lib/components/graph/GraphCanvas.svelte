<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import type { D3Link, LogicNode } from '$lib/types/graph';
    import { convert_connections_to_d3_links } from '$lib/utils/d3-helpers';
    import { create_drag_handlers } from '$lib/utils/d3/interactions';
    import {
        create_simulation,
        DEFAULT_SIMULATION_CONFIG,
        sync_simulation_nodes,
        update_simulation,
        update_collision_radii
    } from '$lib/utils/d3/simulation';
    import { GraphTopology } from '$lib/utils/graph-algorithms';
    import type { Simulation } from 'd3';
    import * as d3 from 'd3';
    import { onDestroy, onMount } from 'svelte';
    import ArrowMarkers from './ArrowMarkers.svelte';
    import {
        render_links,
        render_nodes,
        update_link_positions,
        update_node_positions
    } from './canvas';

    let svg_container: SVGSVGElement;
    let width = $state(0);
    let height = $state(0);
    let simulation: Simulation<LogicNode, D3Link> | null = null;
    let hovered_node_id = $state<string | null>(null);
    let zoom_behavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;

    // Store mutable copies for D3 simulation
    let simulation_nodes: LogicNode[] = [];
    let simulation_links: D3Link[] = [];

    // Track last time we synced positions to avoid too frequent updates
    let last_position_sync = 0;
    const POSITION_SYNC_INTERVAL = 1000; // Sync every 1 second during simulation

    // SVG container reference
    let svg_zoom_container: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;

    // Reactive references to store data
    let nodes = $derived(graph_store.nodes);
    let connections = $derived(graph_store.connections);
    let links = $derived(convert_connections_to_d3_links(connections));

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
        zoom_behavior = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                if (svg_zoom_container) {
                    svg_zoom_container.attr('transform', event.transform);
                }
            });

        svg.call(zoom_behavior);

        // Create initial mutable copies for simulation
        simulation_nodes = nodes.map((node) => ({ ...node }));
        simulation_links = links.map((l) => ({ ...l }));

        // Initialize force simulation with extracted utility
        simulation = create_simulation(simulation_nodes, simulation_links, {
            ...DEFAULT_SIMULATION_CONFIG,
            center_force: [width / 2, height / 2]
        });

        simulation.on('tick', tick_handler);

        // Sync positions back to store after simulation stabilizes
        simulation.on('end', () => {
            sync_positions_to_store();
        });

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
        
        // Render nodes and update collision radii when dimensions are calculated
        render_nodes(
            svg_zoom_container,
            simulation_nodes,
            drag_handlers,
            hovered_node_id,
            connected_node_ids,
            handle_node_hover
        ).then(() => {
            // After node dimensions are calculated, update collision radii
            if (simulation) {
                update_collision_radii(simulation, DEFAULT_SIMULATION_CONFIG.collision_radius);
                // Give the simulation a gentle nudge to adjust positions
                simulation.alpha(0.1).restart();
            }
        });
    }

    function tick_handler() {
        if (!svg_zoom_container) return;

        // Delegate position updates to utility functions
        update_link_positions(svg_zoom_container);
        update_node_positions(svg_zoom_container);

        // Periodically sync positions to store (throttled)
        const now = Date.now();
        if (now - last_position_sync > POSITION_SYNC_INTERVAL) {
            sync_positions_to_store();
            last_position_sync = now;
        }
    }

    /**
     * Syncs node positions from the D3 simulation back to the store.
     * This ensures nodes have their x,y coordinates available for operations like pinning.
     */
    function sync_positions_to_store() {
        simulation_nodes.forEach((sim_node) => {
            const store_node = nodes.find((node) => node.id === sim_node.id);
            if (store_node && sim_node.x !== undefined && sim_node.y !== undefined) {
                // Only update if positions have changed or weren't set
                if (store_node.x !== sim_node.x || store_node.y !== sim_node.y) {
                    graph_store.update_node(sim_node.id, {
                        x: sim_node.x,
                        y: sim_node.y
                    });
                }
            }
        });
    }

    /**
     * Recenter and reset zoom to fit all nodes in view
     */
    export function recenter_view() {
        if (!svg_container || !zoom_behavior || !svg_zoom_container) return;

        const svg = d3.select(svg_container);

        // Reset to identity transform (no zoom, no pan)
        svg.transition().duration(750).call(zoom_behavior.transform, d3.zoomIdentity);
    }

    // React to data changes
    $effect(() => {
        // When nodes or links change, update the simulation and re-render
        if (simulation) {
            // Sync store data to simulation arrays using extracted utility
            simulation_nodes = sync_simulation_nodes(simulation_nodes, nodes);

            // Update links
            simulation_links = links.map((link) => ({ ...link }));

            // Update simulation with new data using extracted utility
            update_simulation(simulation, simulation_nodes, simulation_links);
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
    onkeydown={(event) => {
        if (event.key === 'Escape') {
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

    :global(.node rect) {
        transition:
            stroke-width 0.2s ease,
            opacity 0.2s ease;
    }

    :global(.node text) {
        user-select: none;
    }
</style>
