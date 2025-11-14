/**
 * Core command system types.
 *
 * Commands represent semantic actions that can be executed, validated,
 * and potentially undone. All state changes should go through commands.
 */

import type { Notification } from '$lib/stores/notification.svelte';
import type { AnimationConfig, AnimationType } from '$lib/types/animations';

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
 * Payload for sound effects.
 */
export interface SoundEffectPayload {
    /** URL or identifier of the sound resource */
    src: string;
    /** Volume between 0 and 1 */
    volume?: number;
    /** Whether to loop the sound */
    loop?: boolean;
}

/**
 * Payload for navigation effects.
 */
export interface NavigationEffectPayload {
    /** Path or route to navigate to */
    href: string;
    /** Replace current history entry instead of pushing */
    replace?: boolean;
    /** Optional query params */
    params?: Record<string, string | number | boolean>;
}

/**
 * Mapping from CommandEffectType to concrete payload shapes.
 * Indexing this map with a `CommandEffectType` yields the exact payload type
 * expected for that effect. This enables type-safe handling of `effects`.
 */
export interface CommandEffectMap {
    [CommandEffectType.TOAST]: Pick<
        Notification,
        'message' | 'type' | 'duration' | 'actions'
    >;
    [CommandEffectType.ANIMATION]: AnimationEffectPayload;
    [CommandEffectType.SOUND]: SoundEffectPayload;
    [CommandEffectType.NAVIGATION]: NavigationEffectPayload;
}

/**
 * A side effect produced by command execution. The `payload` type is
 * discriminated by the `type` field, so e.g. a value with
 * `type: CommandEffectType.ANIMATION` has `payload: AnimationEffectPayload`.
 */
export type CommandEffect<EffectType extends CommandEffectType> =
    EffectType extends unknown ? { type: EffectType; payload: CommandEffectMap[EffectType] } : never;

/**
 * Payload for animation effects.
 */
export interface AnimationEffectPayload {
    /** Target element or node ID */
    target: string;
    /** Type of animation */
    type: AnimationType;
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
    effects?: CommandEffect<CommandEffectType>[];
    /** Metadata about execution */
    metadata?: Record<string, unknown>;
}

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
export interface CommandHistoryEntry<PayloadData, ResultData> {
    /** Command ID */
    command: string;
    /** Command payload */
    payload: PayloadData;
    /** Command result */
    result: CommandResult<ResultData>;
    /** Execution timestamp */
    timestamp: number;
}
