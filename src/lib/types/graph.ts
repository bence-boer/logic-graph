/**
 * Type definitions for the Logic Graph application
 */

/**
 * Represents a single node in the logic graph
 */
export interface LogicNode {
    /** Unique identifier for the node */
    id: string;
    /** The logical statement represented by this node (rendered in the UI) */
    statement: string;
    /** Additional details about the statement (optional, rendered in the UI) */
    details?: string;
    /** X position (managed by D3 force simulation) */
    x?: number;
    /** Y position (managed by D3 force simulation) */
    y?: number;
    /** X velocity (managed by D3 force simulation) */
    vx?: number;
    /** Y velocity (managed by D3 force simulation) */
    vy?: number;
    /** Fixed X position for pinning nodes */
    fx?: number | null;
    /** Fixed Y position for pinning nodes */
    fy?: number | null;
    /** Node index (assigned by D3) */
    index?: number;
    /** Rendered width (calculated during rendering) */
    width?: number;
    /** Rendered height (calculated during rendering) */
    height?: number;
}

/**
 * Type of connection between nodes
 */
export enum ConnectionType {
    IMPLICATION = 'implication',
    CONTRADICTION = 'contradiction'
}

/**
 * Represents a connection (edge) between nodes in the logic graph
 */
export interface LogicConnection {
    /** Unique identifier for the connection (optional when importing, will be generated if missing) */
    id?: string;
    /** Type of logical relationship */
    type: ConnectionType;
    /** Array of source node IDs (supports multiple sources) */
    sources: string[];
    /** Array of target node IDs (supports multiple targets) */
    targets: string[];
}

/**
 * D3-compatible link format for the force simulation
 * This expands connections into individual source-target pairs
 */
export interface D3Link {
    /** Source node or node ID */
    source: string | LogicNode;
    /** Target node or node ID */
    target: string | LogicNode;
    /** Reference to the original connection */
    connection: LogicConnection;
    /** Index assigned by D3 */
    index?: number;
}

/**
 * Metadata for the graph
 */
export interface GraphMetadata {
    /** Statement of the graph */
    statement?: string;
    /** Details of the graph */
    details?: string;
    /** Creation timestamp */
    created?: string;
    /** Last modified timestamp */
    modified?: string;
}

/**
 * Complete logic graph structure
 */
export interface LogicGraph {
    /** Array of nodes in the graph */
    nodes: LogicNode[];
    /** Array of connections between nodes */
    connections: LogicConnection[];
    /** Optional metadata about the graph */
    metadata?: GraphMetadata;
}

/**
 * Selection state types
 */
export enum SelectionTypeEnum {
    NODE = 'node',
    CONNECTION = 'connection'
}

export type SelectionType = SelectionTypeEnum | null;

export interface Selection {
    /** Type of selected item */
    type: SelectionType;
    /** ID of selected item */
    id: string | null;
}

/**
 * Right panel mode types
 */
export enum RightPanelModeType {
    CLOSED = 'closed',
    EDIT_NODE = 'edit-node',
    EDIT_CONNECTION = 'edit-connection',
    CREATE_NODE = 'create-node',
    CREATE_CONNECTION = 'create-connection'
}

export type RightPanelMode =
    | { type: RightPanelModeType.CLOSED }
    | { type: RightPanelModeType.EDIT_NODE; node_id: string }
    | { type: RightPanelModeType.EDIT_CONNECTION; connection_id: string }
    | { type: RightPanelModeType.CREATE_NODE }
    | { type: RightPanelModeType.CREATE_CONNECTION };
