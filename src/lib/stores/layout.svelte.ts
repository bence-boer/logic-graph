/**
 * Layout store using Svelte 5 runes
 * Manages layout algorithm settings and preferences
 */

export enum LayoutAlgorithm {
    FORCE = 'force',
    HIERARCHICAL = 'hierarchical',
    CIRCULAR = 'circular',
    GRID = 'grid'
}

export enum HierarchicalDirection {
    TOP_DOWN = 'top-down',
    BOTTOM_UP = 'bottom-up',
    LEFT_RIGHT = 'left-right',
    RIGHT_LEFT = 'right-left'
}

export enum CircularSortBy {
    NONE = 'none',
    DEGREE = 'degree',
    NAME = 'name'
}

export enum GridAlignment {
    CENTER = 'center',
    LEFT = 'left',
    RIGHT = 'right'
}

export interface ForceLayoutSettings {
    strength: number; // Link strength (-100 to 0)
    distance: number; // Link distance (20 to 300)
    collision_radius: number; // Node collision radius (10 to 100)
    charge_strength: number; // Node charge strength (-1000 to -10)
    center_strength: number; // Centering force strength (0 to 1)
}

export interface HierarchicalLayoutSettings {
    direction: HierarchicalDirection;
    level_separation: number; // Space between levels (50 to 300)
    node_separation: number; // Space between nodes in same level (20 to 200)
}

export interface CircularLayoutSettings {
    radius: number; // Circle radius (100 to 500)
    start_angle: number; // Starting angle in degrees (0 to 360)
    sort_by: CircularSortBy;
}

export interface GridLayoutSettings {
    columns: number; // Number of columns (1 to 10)
    cell_width: number; // Width of each cell (50 to 300)
    cell_height: number; // Height of each cell (50 to 300)
    alignment: GridAlignment;
}

function create_layout_store() {
    let _current_algorithm = $state<LayoutAlgorithm>(LayoutAlgorithm.FORCE);

    let _force_settings = $state<ForceLayoutSettings>({
        strength: -30,
        distance: 100,
        collision_radius: 40,
        charge_strength: -300,
        center_strength: 0.1
    });

    let _hierarchical_settings = $state<HierarchicalLayoutSettings>({
        direction: HierarchicalDirection.TOP_DOWN,
        level_separation: 150,
        node_separation: 100
    });

    let _circular_settings = $state<CircularLayoutSettings>({
        radius: 250,
        start_angle: 0,
        sort_by: CircularSortBy.NONE
    });

    let _grid_settings = $state<GridLayoutSettings>({
        columns: 3,
        cell_width: 150,
        cell_height: 150,
        alignment: GridAlignment.CENTER
    });

    return {
        get current_algorithm() {
            return _current_algorithm;
        },
        set current_algorithm(value: LayoutAlgorithm) {
            _current_algorithm = value;
        },

        get force_settings() {
            return _force_settings;
        },
        set force_settings(value: ForceLayoutSettings) {
            _force_settings = value;
        },

        get hierarchical_settings() {
            return _hierarchical_settings;
        },
        set hierarchical_settings(value: HierarchicalLayoutSettings) {
            _hierarchical_settings = value;
        },

        get circular_settings() {
            return _circular_settings;
        },
        set circular_settings(value: CircularLayoutSettings) {
            _circular_settings = value;
        },

        get grid_settings() {
            return _grid_settings;
        },
        set grid_settings(value: GridLayoutSettings) {
            _grid_settings = value;
        },

        update_force_setting<Key extends keyof ForceLayoutSettings>(
            key: Key,
            value: ForceLayoutSettings[Key]
        ): void {
            _force_settings[key] = value;
        },

        update_hierarchical_setting<Key extends keyof HierarchicalLayoutSettings>(
            key: Key,
            value: HierarchicalLayoutSettings[Key]
        ): void {
            _hierarchical_settings[key] = value;
        },

        update_circular_setting<Key extends keyof CircularLayoutSettings>(
            key: Key,
            value: CircularLayoutSettings[Key]
        ): void {
            _circular_settings[key] = value;
        },

        update_grid_setting<Key extends keyof GridLayoutSettings>(
            key: Key,
            value: GridLayoutSettings[Key]
        ): void {
            _grid_settings[key] = value;
        },

        reset_to_defaults(): void {
            _force_settings = {
                strength: -30,
                distance: 100,
                collision_radius: 40,
                charge_strength: -300,
                center_strength: 0.1
            };
            _hierarchical_settings = {
                direction: HierarchicalDirection.TOP_DOWN,
                level_separation: 150,
                node_separation: 100
            };
            _circular_settings = {
                radius: 250,
                start_angle: 0,
                sort_by: CircularSortBy.NONE
            };
            _grid_settings = {
                columns: 3,
                cell_width: 150,
                cell_height: 150,
                alignment: GridAlignment.CENTER
            };
        }
    };
}

export const layout_store = create_layout_store();
