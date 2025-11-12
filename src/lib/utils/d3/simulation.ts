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
    /** Base radius for collision detection between nodes (will be adjusted dynamically) */
    collision_radius: number;
    /** Center point [x, y] for the centering force */
    center_force: [number, number];
    /** Strength of the link force (0-1) */
    link_strength: number;
    /** Strength of the centering force (higher = stronger pull to center) */
    center_strength: number;
    /** Maximum distance for charge force (beyond this, nodes don't repel each other) */
    charge_max_distance: number;
}

/**
 * Default simulation configuration
 */
export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
    charge_strength: -300,
    link_distance: 225,
    collision_radius: 50, // Base collision radius, will be adjusted per node
    center_force: [0, 0],
    link_strength: 0.7,
    center_strength: 0.05, // Weak centering force to prevent nodes from drifting too far
    charge_max_distance: 500 // Stop repelling beyond this distance
};

/**
 * Calculate dynamic collision radius for a node based on its dimensions.
 *
 * Uses the diagonal of the node's bounding box to ensure nodes don't overlap.
 *
 * @param node - The node to calculate collision radius for
 * @param base_radius - Base collision radius as fallback
 * @returns Collision radius in pixels
 */
function calculate_collision_radius(node: LogicNode, base_radius: number): number {
    if (node.width && node.height) {
        // Use the diagonal of the rectangle as the collision radius
        // Add a small padding (5px) to prevent overlapping borders
        return Math.sqrt(node.width * node.width + node.height * node.height) / 2 + 5;
    }
    return base_radius;
}

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
        .force(
            'charge',
            d3
                .forceManyBody<LogicNode>()
                .strength(config.charge_strength)
                .distanceMax(config.charge_max_distance)
        )
        .force(
            'center',
            d3
                .forceCenter(config.center_force[0], config.center_force[1])
                .strength(config.center_strength)
        )
        .force(
            'collision',
            d3
                .forceCollide<LogicNode>()
                .radius((node) => calculate_collision_radius(node, config.collision_radius))
        )
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
 * Update collision radii based on node dimensions
 *
 * Recalculates collision radii for all nodes based on their current dimensions.
 * Should be called after node dimensions change (e.g., after text wrapping).
 *
 * @param simulation - The simulation to update
 * @param base_radius - Base collision radius for nodes without dimensions
 *
 * @example
 * ```ts
 * // After node dimensions are calculated
 * update_collision_radii(my_simulation, 50);
 * simulation.alpha(0.3).restart();
 * ```
 */
export function update_collision_radii(
    simulation: Simulation<LogicNode, D3Link>,
    base_radius: number
): void {
    const collision_force = simulation.force<d3.ForceCollide<LogicNode>>('collision');
    if (collision_force) {
        collision_force.radius((node) => calculate_collision_radius(node, base_radius));
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
            // Update existing node properties (preserve D3 physics properties: x, y, vx, vy, index)
            // Sync all application properties that affect styling and behavior
            Object.assign(sim_node, {
                statement: store_node.statement,
                details: store_node.details,
                type: store_node.type,
                question_state: store_node.question_state,
                statement_state: store_node.statement_state,
                answered_by: store_node.answered_by,
                manual_state_override: store_node.manual_state_override,
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
