import type { LogicNode, LogicConnection } from '$lib/types/graph';
import type {
    ForceLayoutSettings,
    HierarchicalLayoutSettings,
    CircularLayoutSettings,
    GridLayoutSettings
} from '$lib/stores/layout.svelte';

export interface PositionedNode extends LogicNode {
    x: number;
    y: number;
}

/**
 * Apply force-directed layout algorithm
 * This is the default D3 force simulation approach
 */
export function apply_force_layout(
    nodes: LogicNode[],
    connections: LogicConnection[],
    settings: ForceLayoutSettings,
    width: number,
    height: number
): PositionedNode[] {
    // Force layout is handled by D3 simulation in GraphCanvas
    // This just ensures nodes have initial positions
    return nodes.map((node) => ({
        ...node,
        x: node.x ?? Math.random() * width,
        y: node.y ?? Math.random() * height
    }));
}

/**
 * Apply hierarchical layout algorithm
 * Organizes nodes in levels based on connection direction
 */
export function apply_hierarchical_layout(
    nodes: LogicNode[],
    connections: LogicConnection[],
    settings: HierarchicalLayoutSettings,
    width: number,
    height: number
): PositionedNode[] {
    // Build adjacency map
    const adjacency = new Map<string, string[]>();
    nodes.forEach((node) => adjacency.set(node.id, []));

    connections.forEach((conn) => {
        conn.sources.forEach((source_id) => {
            conn.targets.forEach((target_id) => {
                adjacency.get(source_id)?.push(target_id);
            });
        });
    });

    // Assign levels using BFS
    const levels = new Map<string, number>();
    const visited = new Set<string>();
    const roots = nodes.filter((node) => {
        const has_incoming = connections.some((conn) => conn.targets.includes(node.id));
        return !has_incoming;
    });

    if (roots.length === 0 && nodes.length > 0) {
        // No clear roots, use first node
        roots.push(nodes[0]);
    }

    const queue: Array<{ id: string; level: number }> = roots.map((node) => ({
        id: node.id,
        level: 0
    }));

    while (queue.length > 0) {
        const { id, level } = queue.shift()!;
        if (visited.has(id)) continue;

        visited.add(id);
        levels.set(id, level);

        const neighbors = adjacency.get(id) || [];
        neighbors.forEach((neighbor_id) => {
            if (!visited.has(neighbor_id)) {
                queue.push({ id: neighbor_id, level: level + 1 });
            }
        });
    }

    // Assign remaining nodes to level 0
    nodes.forEach((node) => {
        if (!levels.has(node.id)) {
            levels.set(node.id, 0);
        }
    });

    // Group nodes by level
    const levels_array: LogicNode[][] = [];
    nodes.forEach((node) => {
        const level = levels.get(node.id) || 0;
        if (!levels_array[level]) {
            levels_array[level] = [];
        }
        levels_array[level].push(node);
    });

    // Position nodes
    const positioned: PositionedNode[] = [];
    const { direction, level_separation, node_separation } = settings;

    levels_array.forEach((level_nodes, level_index) => {
        level_nodes.forEach((node, node_index) => {
            let x: number, y: number;

            if (direction === 'top-down') {
                y = level_index * level_separation + 100;
                x =
                    (node_index + 1) * node_separation +
                    (width - level_nodes.length * node_separation) / 2;
            } else if (direction === 'bottom-up') {
                y = height - (level_index * level_separation + 100);
                x =
                    (node_index + 1) * node_separation +
                    (width - level_nodes.length * node_separation) / 2;
            } else if (direction === 'left-right') {
                x = level_index * level_separation + 100;
                y =
                    (node_index + 1) * node_separation +
                    (height - level_nodes.length * node_separation) / 2;
            } else {
                // right-left
                x = width - (level_index * level_separation + 100);
                y =
                    (node_index + 1) * node_separation +
                    (height - level_nodes.length * node_separation) / 2;
            }

            positioned.push({ ...node, x, y });
        });
    });

    return positioned;
}

/**
 * Apply circular layout algorithm
 * Arranges nodes in a circle
 */
export function apply_circular_layout(
    nodes: LogicNode[],
    connections: LogicConnection[],
    settings: CircularLayoutSettings,
    width: number,
    height: number
): PositionedNode[] {
    const sorted_nodes = [...nodes];

    // Sort nodes if requested
    if (settings.sort_by === 'degree') {
        // Calculate degree (number of connections)
        const degrees = new Map<string, number>();
        nodes.forEach((node) => degrees.set(node.id, 0));

        connections.forEach((conn) => {
            conn.sources.forEach((id) => degrees.set(id, (degrees.get(id) || 0) + 1));
            conn.targets.forEach((id) => degrees.set(id, (degrees.get(id) || 0) + 1));
        });

        sorted_nodes.sort((a, b) => (degrees.get(b.id) || 0) - (degrees.get(a.id) || 0));
    } else if (settings.sort_by === 'name') {
        sorted_nodes.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Position nodes in circle
    const center_x = width / 2;
    const center_y = height / 2;
    const start_angle_rad = (settings.start_angle * Math.PI) / 180;
    const angle_step = (2 * Math.PI) / nodes.length;

    return sorted_nodes.map((node, index) => {
        const angle = start_angle_rad + index * angle_step;
        const x = center_x + settings.radius * Math.cos(angle);
        const y = center_y + settings.radius * Math.sin(angle);
        return { ...node, x, y };
    });
}

/**
 * Apply grid layout algorithm
 * Arranges nodes in a grid pattern
 */
export function apply_grid_layout(
    nodes: LogicNode[],
    connections: LogicConnection[],
    settings: GridLayoutSettings,
    width: number,
    height: number
): PositionedNode[] {
    const { columns, cell_width, cell_height, alignment } = settings;
    const rows = Math.ceil(nodes.length / columns);

    // Calculate starting position based on alignment
    let start_x: number;
    if (alignment === 'center') {
        start_x = (width - columns * cell_width) / 2 + cell_width / 2;
    } else if (alignment === 'left') {
        start_x = cell_width / 2;
    } else {
        // right
        start_x = width - columns * cell_width + cell_width / 2;
    }

    const start_y = (height - rows * cell_height) / 2 + cell_height / 2;

    return nodes.map((node, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        const x = start_x + col * cell_width;
        const y = start_y + row * cell_height;
        return { ...node, x, y };
    });
}
