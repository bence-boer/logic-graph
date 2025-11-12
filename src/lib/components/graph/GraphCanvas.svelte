<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import type { D3Link, LogicNode } from '$lib/types/graph';
    import { convert_connections_to_d3_links } from '$lib/utils/d3-helpers';
    import { create_drag_handlers } from '$lib/utils/d3/interactions';
    import {
        calculate_recenter_transform,
        calculate_focus_transform
    } from '$lib/utils/d3/recenter';
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

    // Track last zoom scale to detect when to re-render
    let last_zoom_scale = 1;
    const ZOOM_THRESHOLD = 0.1; // Only re-render if zoom changes by more than 10%

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
    // TODO: Move drag logic to interaction system in future refactoring
    // For now, keep D3 drag handlers as they're tightly integrated with simulation
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

        // Add navigation command event listeners
        window.addEventListener('graph:pan', handle_pan_event as EventListener);
        window.addEventListener('graph:zoom', handle_zoom_event as EventListener);
        window.addEventListener('graph:recenter', handle_recenter_event as EventListener);
        window.addEventListener('graph:focus-node', handle_focus_node_event as EventListener);
    });

    onDestroy(() => {
        window.removeEventListener('resize', update_dimensions);
        window.removeEventListener('graph:pan', handle_pan_event as EventListener);
        window.removeEventListener('graph:zoom', handle_zoom_event as EventListener);
        window.removeEventListener('graph:recenter', handle_recenter_event as EventListener);
        window.removeEventListener('graph:focus-node', handle_focus_node_event as EventListener);
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

                    // Only re-render nodes if zoom scale changed significantly
                    // This avoids expensive re-renders during pan operations
                    const scale_change = Math.abs(event.transform.k - last_zoom_scale);
                    const relative_change = scale_change / last_zoom_scale;

                    if (relative_change > ZOOM_THRESHOLD) {
                        last_zoom_scale = event.transform.k;
                        render_graph();
                    }
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
        // Pass svg_container so node renderer can account for zoom transform
        render_nodes(
            svg_zoom_container,
            simulation_nodes,
            connections,
            drag_handlers,
            hovered_node_id,
            connected_node_ids,
            handle_node_hover,
            svg_container
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
     * Recenter and reset zoom to fit all nodes in view.
     *
     * Uses the calculate_recenter_transform utility to properly calculate
     * the bounding box of all nodes and determine the appropriate scale
     * and translation to fit them in the viewport with padding.
     */
    export function recenter_view() {
        if (!svg_container || !zoom_behavior || !svg_zoom_container) return;

        const svg = d3.select(svg_container);

        // Calculate transform to fit all nodes using utility function
        const transform = calculate_recenter_transform(nodes, width, height, {
            padding_fraction: 0.1, // 10% padding on all sides
            min_scale: 0.1,
            max_scale: 4.0,
            default_scale: 1.0
        });

        if (transform) {
            // Apply transform with smooth animation
            svg.transition()
                .duration(750)
                .ease(d3.easeCubicInOut)
                .call(zoom_behavior.transform, transform);
        }
    }

    /**
     * Handle pan command event
     */
    function handle_pan_event(event: CustomEvent<{ dx: number; dy: number; animate: boolean }>) {
        if (!svg_container || !zoom_behavior) return;

        const svg = d3.select(svg_container);
        const current_transform = d3.zoomTransform(svg_container);
        const new_transform = current_transform.translate(event.detail.dx, event.detail.dy);

        if (event.detail.animate) {
            svg.transition().duration(300).call(zoom_behavior.transform, new_transform);
        } else {
            svg.call(zoom_behavior.transform, new_transform);
        }
    }

    /**
     * Handle zoom command event
     */
    function handle_zoom_event(
        event: CustomEvent<{ scale?: number; delta?: number; animate: boolean }>
    ) {
        if (!svg_container || !zoom_behavior) return;

        const svg = d3.select(svg_container);
        const current_transform = d3.zoomTransform(svg_container);

        let new_scale: number;
        if (event.detail.scale !== undefined) {
            new_scale = event.detail.scale;
        } else if (event.detail.delta !== undefined) {
            new_scale = current_transform.k * (1 + event.detail.delta);
        } else {
            return;
        }

        // Clamp scale to zoom extent
        new_scale = Math.max(0.1, Math.min(4, new_scale));

        const new_transform = current_transform.scale(new_scale / current_transform.k);

        if (event.detail.animate) {
            svg.transition().duration(300).call(zoom_behavior.transform, new_transform);
        } else {
            svg.call(zoom_behavior.transform, new_transform);
        }
    }

    /**
     * Handle recenter command event
     */
    function handle_recenter_event() {
        recenter_view();
    }

    /**
     * Handle focus node command event.
     *
     * Uses the calculate_focus_transform utility to properly center
     * the target node in the viewport while maintaining the current zoom level.
     */
    function handle_focus_node_event(event: CustomEvent<{ node_id: string; animate: boolean }>) {
        if (!svg_container || !zoom_behavior) return;

        const node = simulation_nodes.find((n) => n.id === event.detail.node_id);
        if (!node) return;

        const svg = d3.select(svg_container);
        const current_transform = d3.zoomTransform(svg_container);

        // Calculate transform to center node using utility function
        const transform = calculate_focus_transform(node, width, height, current_transform.k);

        if (transform) {
            if (event.detail.animate) {
                svg.transition()
                    .duration(500)
                    .ease(d3.easeCubicInOut)
                    .call(zoom_behavior.transform, transform);
            } else {
                svg.call(zoom_behavior.transform, transform);
            }
        }
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

<!-- Canvas interactions handled by interaction router -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<svg
    bind:this={svg_container}
    class="graph-canvas h-full w-full cursor-grab bg-(--bg-primary) active:cursor-grabbing"
    role="application"
    aria-label="Logic graph visualization"
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
        cursor: pointer;
        transition:
            stroke-width 0.2s ease,
            opacity 0.2s ease,
            stroke 0.2s ease;
    }

    :global(.link:hover) {
        opacity: 1;
        stroke-width: 3px;
    }

    :global(.node-label) {
        transition:
            opacity 0.2s ease,
            font-weight 0.2s ease;
        user-select: none;
    }

    :global(.node) {
        transition:
            opacity 0.2s ease,
            transform 0.2s ease;
    }

    :global(.node rect) {
        transition:
            stroke-width 0.2s ease,
            opacity 0.2s ease;
    }

    :global(.node text) {
        user-select: none;
    }

    :global(.node .node-container) {
        transition:
            all 0.2s ease,
            border-width 0.1s ease;
    }

    /* Global keyframe animations for overlays */
    :global {
        @keyframes pulse-selection {
            0%,
            100% {
                opacity: 0.8;
            }
            50% {
                opacity: 1;
            }
        }

        @keyframes fade-in {
            from {
                opacity: 0;
                transform: scale(0.8);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        @keyframes scale-in {
            from {
                opacity: 0;
                transform: scale(0);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
    }
</style>
