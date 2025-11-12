/**
 * Navigation commands for controlling the graph view.
 *
 * These commands control pan, zoom, and view focus.
 * They integrate with D3's zoom behavior through the GraphCanvas component.
 */

import type { Command, CommandResult, ValidationResult } from '$lib/commands/types';
import { CommandCategory } from '$lib/commands/types';

/**
 * Payload for pan command.
 */
export interface PanPayload {
    /** Delta X to pan */
    dx: number;
    /** Delta Y to pan */
    dy: number;
    /** Whether to animate the transition */
    animate?: boolean;
}

/**
 * Command to pan the canvas.
 *
 * Note: This command emits a custom event that the GraphCanvas component
 * listens for to apply the pan transformation via D3.
 */
export const pan_command: Command<PanPayload, void> = {
    id: 'nav.pan',

    metadata: {
        name: 'Pan Canvas',
        description: 'Pan the graph canvas',
        category: CommandCategory.NAVIGATION,
        undoable: false,
        mutates_graph: false
    },

    validate(payload: PanPayload): ValidationResult {
        // Validate delta values are numbers
        if (typeof payload.dx !== 'number' || isNaN(payload.dx)) {
            return {
                valid: false,
                error: 'dx must be a valid number'
            };
        }

        if (typeof payload.dy !== 'number' || isNaN(payload.dy)) {
            return {
                valid: false,
                error: 'dy must be a valid number'
            };
        }

        return { valid: true };
    },

    async execute(payload: PanPayload): Promise<CommandResult<void>> {
        try {
            // Emit a custom event that GraphCanvas will listen for
            const event = new CustomEvent('graph:pan', {
                detail: {
                    dx: payload.dx,
                    dy: payload.dy,
                    animate: payload.animate ?? true
                }
            });
            window.dispatchEvent(event);

            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to pan canvas'
            };
        }
    }
};

/**
 * Payload for zoom command.
 */
export interface ZoomPayload {
    /** Target zoom level (e.g., 1.0 = 100%, 2.0 = 200%) */
    scale?: number;
    /** Delta to zoom by (e.g., 0.1 = zoom in 10%, -0.1 = zoom out 10%) */
    delta?: number;
    /** Whether to animate the transition */
    animate?: boolean;
}

/**
 * Command to zoom the canvas.
 */
export const zoom_command: Command<ZoomPayload, void> = {
    id: 'nav.zoom',

    metadata: {
        name: 'Zoom Canvas',
        description: 'Zoom the graph canvas in or out',
        category: CommandCategory.NAVIGATION,
        undoable: false,
        mutates_graph: false
    },

    validate(payload: ZoomPayload): ValidationResult {
        // Must provide either scale or delta
        if (payload.scale === undefined && payload.delta === undefined) {
            return {
                valid: false,
                error: 'Either scale or delta must be provided'
            };
        }

        // Validate scale if provided
        if (payload.scale !== undefined) {
            if (typeof payload.scale !== 'number' || isNaN(payload.scale)) {
                return {
                    valid: false,
                    error: 'scale must be a valid number'
                };
            }

            if (payload.scale <= 0) {
                return {
                    valid: false,
                    error: 'scale must be positive'
                };
            }
        }

        // Validate delta if provided
        if (payload.delta !== undefined) {
            if (typeof payload.delta !== 'number' || isNaN(payload.delta)) {
                return {
                    valid: false,
                    error: 'delta must be a valid number'
                };
            }
        }

        return { valid: true };
    },

    async execute(payload: ZoomPayload): Promise<CommandResult<void>> {
        try {
            // Emit a custom event that GraphCanvas will listen for
            const event = new CustomEvent('graph:zoom', {
                detail: {
                    scale: payload.scale,
                    delta: payload.delta,
                    animate: payload.animate ?? true
                }
            });
            window.dispatchEvent(event);

            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to zoom canvas'
            };
        }
    }
};

/**
 * Command to zoom in.
 */
export const zoom_in_command: Command<void, void> = {
    id: 'nav.zoom.in',

    metadata: {
        name: 'Zoom In',
        description: 'Zoom in on the graph',
        category: CommandCategory.NAVIGATION,
        undoable: false,
        mutates_graph: false
    },

    validate(): ValidationResult {
        return { valid: true };
    },

    async execute(): Promise<CommandResult<void>> {
        // Use the zoom command with a delta
        return await zoom_command.execute({ delta: 0.2, animate: true }, { timestamp: Date.now() });
    }
};

/**
 * Command to zoom out.
 */
export const zoom_out_command: Command<void, void> = {
    id: 'nav.zoom.out',

    metadata: {
        name: 'Zoom Out',
        description: 'Zoom out on the graph',
        category: CommandCategory.NAVIGATION,
        undoable: false,
        mutates_graph: false
    },

    validate(): ValidationResult {
        return { valid: true };
    },

    async execute(): Promise<CommandResult<void>> {
        // Use the zoom command with a negative delta
        return await zoom_command.execute(
            { delta: -0.2, animate: true },
            { timestamp: Date.now() }
        );
    }
};

/**
 * Command to reset zoom to 100%.
 */
export const zoom_reset_command: Command<void, void> = {
    id: 'nav.zoom.reset',

    metadata: {
        name: 'Reset Zoom',
        description: 'Reset zoom to 100%',
        category: CommandCategory.NAVIGATION,
        undoable: false,
        mutates_graph: false
    },

    validate(): ValidationResult {
        return { valid: true };
    },

    async execute(): Promise<CommandResult<void>> {
        // Use the zoom command with scale = 1.0
        return await zoom_command.execute({ scale: 1.0, animate: true }, { timestamp: Date.now() });
    }
};

/**
 * Command to recenter the view on all nodes.
 */
export const recenter_command: Command<void, void> = {
    id: 'nav.recenter',

    metadata: {
        name: 'Recenter View',
        description: 'Center the view on all nodes',
        category: CommandCategory.NAVIGATION,
        undoable: false,
        mutates_graph: false
    },

    validate(): ValidationResult {
        return { valid: true };
    },

    async execute(): Promise<CommandResult<void>> {
        try {
            // Emit a custom event that GraphCanvas will listen for
            const event = new CustomEvent('graph:recenter');
            window.dispatchEvent(event);

            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to recenter view'
            };
        }
    }
};

/**
 * Payload for focus node command.
 */
export interface FocusNodePayload {
    /** ID of node to focus on */
    node_id: string;
    /** Whether to animate the transition */
    animate?: boolean;
}

/**
 * Command to focus on a specific node.
 */
export const focus_node_command: Command<FocusNodePayload, void> = {
    id: 'nav.node.focus',

    metadata: {
        name: 'Focus Node',
        description: 'Center the view on a specific node',
        category: CommandCategory.NAVIGATION,
        undoable: false,
        mutates_graph: false
    },

    validate(payload: FocusNodePayload): ValidationResult {
        if (!payload.node_id) {
            return {
                valid: false,
                error: 'Node ID is required'
            };
        }

        return { valid: true };
    },

    async execute(payload: FocusNodePayload): Promise<CommandResult<void>> {
        try {
            // Emit a custom event that GraphCanvas will listen for
            const event = new CustomEvent('graph:focus-node', {
                detail: {
                    node_id: payload.node_id,
                    animate: payload.animate ?? true
                }
            });
            window.dispatchEvent(event);

            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to focus on node'
            };
        }
    }
};
