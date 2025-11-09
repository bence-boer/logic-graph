/**
 * D3-specific type extensions for the Logic Graph application
 *
 * This file contains type definitions that extend the base LogicNode type
 * with D3-specific properties for drag tracking and simulation management.
 */

import type { LogicNode } from './graph';

/**
 * Extended LogicNode type for D3 drag tracking
 *
 * This interface adds temporary properties used during drag operations
 * to track the starting position of a node. These properties are used
 * to determine if a node was actually dragged or just clicked.
 */
export interface DragTrackingNode extends LogicNode {
    /** Starting X position when drag begins */
    _drag_start_x?: number;
    /** Starting Y position when drag begins */
    _drag_start_y?: number;
}

/**
 * LogicNode with all D3 simulation properties
 *
 * This interface represents a node that is fully integrated with D3's
 * force simulation. It includes all positioning and velocity properties
 * that D3 uses internally.
 */
export interface D3SimulationNode extends LogicNode {
    /** Current X position (required for simulation) */
    x: number;
    /** Current Y position (required for simulation) */
    y: number;
    /** X velocity (managed by D3 simulation) */
    vx?: number;
    /** Y velocity (managed by D3 simulation) */
    vy?: number;
    /** Fixed X position for pinning nodes (null to unpin) */
    fx?: number | null;
    /** Fixed Y position for pinning nodes (null to unpin) */
    fy?: number | null;
    /** Node index assigned by D3 */
    index?: number;
}

/**
 * Combined type for nodes that need both drag tracking and simulation properties
 *
 * This type is used for nodes in the drag handlers where we need both
 * the simulation properties and the drag tracking properties.
 */
export type D3DragNode = DragTrackingNode & D3SimulationNode;
