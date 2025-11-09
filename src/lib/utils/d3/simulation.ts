/**
 * D3 force simulation utilities
 *
 * This module provides utilities for creating and managing D3 force simulations
 * for the logic graph visualization.
 */

import * as d3 from 'd3';
import type { Simulation } from 'd3';
import type { LogicNode, D3Link } from '$lib/types/graph';

/**
 * Configuration for the force simulation
 */
export interface SimulationConfig {
    /** Strength of the charge force (negative = repulsion) */
    charge_strength: number;
    /** Desired distance between linked nodes */
    link_distance: number;
    /** Radius for collision detection between nodes */
    collision_radius: number;
    /** Center point [x, y] for the centering force */
    center_force: [number, number];
    /** Strength of the link force (0-1) */
    link_strength: number;
}

/**
 * Default simulation configuration
 */
export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
    charge_strength: -300,
    link_distance: 225,
    collision_radius: 40,
    center_force: [0, 0],
    link_strength: 0.7
};

/**
 * Create a new D3 force simulation
 *
 * Initializes a force simulation with the specified configuration and data.
 * The simulation includes charge (repulsion), centering, collision detection,
 * and link forces.
 *
 * @param nodes - Array of nodes for the simulation
 * @param links - Array of links between nodes
 * @param config - Configuration for the simulation forces
 * @returns Configured D3 force simulation
 *
 * @example
 * ```ts
 * const simulation = create_simulation(
 *   graph_nodes,
 *   graph_links,
 *   { ...DEFAULT_SIMULATION_CONFIG, charge_strength: -400 }
 * );
 *
 * simulation.on('tick', () => {
 *   // Update visualization
 * });
 * ```
 */
export function create_simulation(
    nodes: LogicNode[],
    links: D3Link[],
    config: SimulationConfig
): Simulation<LogicNode, D3Link> {
    return d3
        .forceSimulation<LogicNode>(nodes)
        .force('charge', d3.forceManyBody<LogicNode>().strength(config.charge_strength))
        .force('center', d3.forceCenter(config.center_force[0], config.center_force[1]))
        .force('collision', d3.forceCollide<LogicNode>().radius(config.collision_radius))
        .force(
            'link',
            d3
                .forceLink<LogicNode, D3Link>(links)
                .id((d) => d.id)
                .distance(config.link_distance)
                .strength(config.link_strength)
        );
}

/**
 * Update simulation with new data
 *
 * Updates the nodes and links in an existing simulation. This is more
 * efficient than creating a new simulation from scratch.
 *
 * @param simulation - The simulation to update
 * @param nodes - New array of nodes
 * @param links - New array of links
 * @param restart_alpha - Alpha value to restart with (default: 0.3)
 *
 * @example
 * ```ts
 * // When graph data changes
 * update_simulation(my_simulation, updated_nodes, updated_links);
 * ```
 */
export function update_simulation(
    simulation: Simulation<LogicNode, D3Link>,
    nodes: LogicNode[],
    links: D3Link[],
    restart_alpha: number = 0.3
): void {
    simulation.nodes(nodes);

    const link_force = simulation.force<d3.ForceLink<LogicNode, D3Link>>('link');
    if (link_force) {
        link_force.links(links);
    }

    simulation.alpha(restart_alpha).restart();
}

/**
 * Update simulation center position
 *
 * Updates the centering force to a new position. Useful when the
 * canvas is resized.
 *
 * @param simulation - The simulation to update
 * @param center - New center point [x, y]
 *
 * @example
 * ```ts
 * // When canvas resizes
 * update_simulation_center(my_simulation, [new_width / 2, new_height / 2]);
 * ```
 */
export function update_simulation_center(
    simulation: Simulation<LogicNode, D3Link>,
    center: [number, number]
): void {
    const center_force = simulation.force<d3.ForceCenter<LogicNode>>('center');
    if (center_force) {
        center_force.x(center[0]).y(center[1]);
    }
}

/**
 * Sync store nodes with simulation nodes
 *
 * Updates simulation nodes to match the store data while preserving
 * D3's internal properties (positions, velocities, etc.). This is used
 * to keep the simulation in sync with the application state.
 *
 * @param simulation_nodes - Current simulation nodes array (will be modified)
 * @param store_nodes - Source nodes from the store
 * @returns Updated simulation nodes array
 *
 * @example
 * ```ts
 * // When store data changes
 * simulation_nodes = sync_simulation_nodes(simulation_nodes, graph_store.nodes);
 * ```
 */
export function sync_simulation_nodes(
    simulation_nodes: LogicNode[],
    store_nodes: LogicNode[]
): LogicNode[] {
    const node_map = new Map(simulation_nodes.map((node) => [node.id, node]));

    // Update existing nodes and add new ones
    store_nodes.forEach((store_node) => {
        const sim_node = node_map.get(store_node.id);
        if (sim_node) {
            // Update existing node properties (preserve D3 properties)
            Object.assign(sim_node, {
                statement: store_node.statement,
                details: store_node.details,
                fx: store_node.fx,
                fy: store_node.fy
            });
        } else {
            // Add new node
            simulation_nodes.push({ ...store_node });
        }
    });

    // Remove deleted nodes
    return simulation_nodes.filter((sim_node) =>
        store_nodes.some((store_node) => store_node.id === sim_node.id)
    );
}
