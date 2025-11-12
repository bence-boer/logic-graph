/**
 * Interaction system types.
 *
 * Defines the types for mapping user interactions (events) to commands.
 */

import type { CommandPayload } from '$lib/commands/types';

/**
 * Context where an interaction can occur.
 */
export enum InteractionContext {
    /** On the graph canvas */
    CANVAS = 'canvas',
    /** On a specific node */
    NODE = 'node',
    /** On a specific connection */
    CONNECTION = 'connection',
    /** In the left panel */
    PANEL_LEFT = 'panel.left',
    /** In the right panel */
    PANEL_RIGHT = 'panel.right',
    /** In a search panel */
    PANEL_SEARCH = 'panel.search',
    /** In any form */
    FORM = 'form',
    /** In any modal */
    MODAL = 'modal',
    /** Anywhere in the app */
    GLOBAL = 'global'
}

/**
 * Type of event matcher.
 */
export enum EventMatcherType {
    /** Single click */
    CLICK = 'click',
    /** Double click */
    DOUBLE_CLICK = 'double_click',
    /** Right click / context menu */
    CONTEXT_MENU = 'context_menu',
    /** Key press */
    KEY = 'key',
    /** Key combination (e.g., Ctrl+Z) */
    KEY_COMBO = 'key_combo',
    /** Drag operation */
    DRAG = 'drag',
    /** Mouse hover */
    HOVER = 'hover',
    /** Touch gesture */
    GESTURE = 'gesture'
}

/**
 * Event matcher configuration.
 *
 * Defines what events should trigger an interaction.
 */
export interface EventMatcher {
    /** Type of event to match */
    type: EventMatcherType;

    /** CSS selector for target element (optional) */
    target?: string;

    /** Data attribute to match (e.g., 'action' for data-action) */
    data_attribute?: string;

    /** Key or key combination for keyboard events */
    key?: string;

    /** Modifier keys required (for keyboard and mouse events) */
    modifiers?: KeyModifier[];

    /** Gesture type (for touch events) */
    gesture?: GestureType;

    /** Prevent default browser behavior */
    prevent_default?: boolean;

    /** Stop event propagation */
    stop_propagation?: boolean;
}

/**
 * Keyboard modifier keys.
 */
export enum KeyModifier {
    CTRL = 'ctrl',
    SHIFT = 'shift',
    ALT = 'alt',
    META = 'meta'
}

/**
 * Touch gesture types.
 */
export enum GestureType {
    /** Single tap */
    TAP = 'tap',
    /** Long press */
    LONG_PRESS = 'long_press',
    /** Two-finger pinch (zoom) */
    PINCH = 'pinch',
    /** Swipe in a direction */
    SWIPE = 'swipe',
    /** Two-finger rotate */
    ROTATE = 'rotate',
    /** Two-finger pan */
    PAN = 'pan'
}

/**
 * Precondition type for interactions.
 */
export enum InteractionPreconditionType {
    /** Must have selected node(s) */
    HAS_SELECTION = 'has_selection',
    /** Must not have selection */
    NO_SELECTION = 'no_selection',
    /** Must be in edit mode */
    EDIT_MODE = 'edit_mode',
    /** Custom condition check */
    CUSTOM = 'custom'
}

/**
 * Precondition for interaction execution.
 */
export interface InteractionPrecondition<ContextData = unknown> {
    /** Type of precondition */
    type: InteractionPreconditionType;

    /** Invert the condition */
    negate?: boolean;

    /** Custom check function */
    check?: (context: ContextData) => boolean;
}

/**
 * Payload mapper function.
 *
 * Extracts command payload from interaction event.
 */
export type PayloadMapper<EventData = Event> = (event: EventData) => CommandPayload;

/**
 * Interaction definition.
 *
 * Maps user interactions to commands declaratively.
 */
export interface InteractionDefinition<EventData = Event> {
    /** Unique interaction identifier */
    id: string;

    /** Contexts where this interaction is active */
    contexts: InteractionContext[];

    /** Event matcher */
    matcher: EventMatcher;

    /** Command to execute */
    command: string;

    /** Preconditions for execution */
    preconditions?: InteractionPrecondition[];

    /** Map event to command payload */
    payload_mapper?: PayloadMapper<EventData>;

    /** Priority (higher = checked first) */
    priority?: number;

    /** Human-readable description */
    description?: string;
}

/**
 * Active interaction context data.
 */
export interface ActiveInteractionContext {
    /** Current interaction context */
    context: InteractionContext;

    /** Additional context data */
    data?: Record<string, unknown>;
}
