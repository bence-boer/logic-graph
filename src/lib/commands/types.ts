/**
 * Core command system types.
 *
 * Commands represent semantic actions that can be executed, validated,
 * and potentially undone. All state changes should go through commands.
 */

import type { AnimationType, AnimationConfig } from '$lib/types/animations';

/**
 * Category classification for commands.
 */
export enum CommandCategory {
    /** Create, update, delete nodes/connections */
    GRAPH_MUTATION = 'graph_mutation',
    /** Pan, zoom, recenter view */
    NAVIGATION = 'navigation',
    /** Select, deselect nodes/connections */
    SELECTION = 'selection',
    /** Open/close panels, modals */
    UI_CONTROL = 'ui_control',
    /** Import, export operations */
    FILE_OPERATION = 'file_operation',
    /** Layout, filter, search operations */
    VIEW_CONTROL = 'view_control',
    /** Undo/redo operations */
    HISTORY = 'history'
}

/**
 * Metadata describing a command.
 */
export interface CommandMetadata {
    /** Human-readable command name */
    name: string;
    /** Brief description of what the command does */
    description: string;
    /** Command category for organization */
    category: CommandCategory;
    /** Can this command be undone? */
    undoable: boolean;
    /** Does this command modify graph state? */
    mutates_graph: boolean;
}

/**
 * Context provided to command execution.
 */
export interface CommandContext {
    /** Timestamp when command was initiated */
    timestamp: number;
    /** Optional abort signal for cancellation */
    signal?: AbortSignal;
    /** Additional context data */
    metadata?: Record<string, unknown>;
}

/**
 * Type of side effect a command can produce.
 */
export enum CommandEffectType {
    /** Show a toast notification */
    TOAST = 'toast',
    /** Trigger an animation */
    ANIMATION = 'animation',
    /** Play a sound */
    SOUND = 'sound',
    /** Navigate to a different view */
    NAVIGATION = 'navigation'
}

/**
 * A side effect produced by command execution.
 */
export interface CommandEffect<PayloadData = Record<string, unknown>> {
    type: CommandEffectType;
    payload: PayloadData;
}

/**
 * Payload for animation effects.
 */
export interface AnimationEffectPayload {
    /** Target element or node ID */
    target: string;
    /** Type of animation */
    animation_type: AnimationType;
    /** Animation configuration */
    config: AnimationConfig;
}

/**
 * Result of command execution.
 */
export interface CommandResult<ResultData = void> {
    /** Was the command successful? */
    success: boolean;
    /** Result data (if any) */
    data?: ResultData;
    /** Error message if failed */
    error?: string;
    /** Side effects to apply */
    effects?: CommandEffect[];
    /** Metadata about execution */
    metadata?: Record<string, unknown>;
}

/**
 * Base command payload type.
 */
export type CommandPayload = Record<
    string,
    string | number | boolean | null | CommandPayload | CommandPayload[]
>;

/**
 * A command that can be executed.
 *
 * Commands encapsulate state changes with validation and optional undo support.
 *
 * @template PayloadData - Type of data required to execute the command
 * @template ResultData - Type of data returned by the command
 */
export interface Command<PayloadData = void, ResultData = void> {
    /** Unique command identifier (e.g., 'graph.node.create') */
    readonly id: string;

    /** Command metadata */
    readonly metadata: CommandMetadata;

    /**
     * Validate that the command can be executed with the given payload.
     *
     * @param payload - Command payload to validate
     * @param context - Execution context
     * @returns Validation result with optional error message
     */
    validate(payload: PayloadData, context: CommandContext): ValidationResult;

    /**
     * Execute the command.
     *
     * @param payload - Command payload
     * @param context - Execution context
     * @returns Command result
     */
    execute(payload: PayloadData, context: CommandContext): Promise<CommandResult<ResultData>>;

    /**
     * Undo the command (if undoable).
     *
     * @param result - Result from original execution
     * @param context - Execution context
     * @returns Undo result
     */
    undo?(result: CommandResult<ResultData>, context: CommandContext): Promise<CommandResult<void>>;
}

/**
 * Result of command validation.
 */
export interface ValidationResult {
    /** Is the command valid? */
    valid: boolean;
    /** Error message if invalid */
    error?: string;
    /** Field-specific errors (for forms) */
    field_errors?: Record<string, string>;
}

/**
 * Entry in command history for undo/redo.
 */
export interface CommandHistoryEntry<PayloadData = CommandPayload, ResultData = CommandPayload> {
    /** Command ID */
    command: string;
    /** Command payload */
    payload: PayloadData;
    /** Command result */
    result: CommandResult<ResultData>;
    /** Execution timestamp */
    timestamp: number;
}
