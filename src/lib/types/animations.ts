/**
 * Animation system type definitions.
 *
 * This module defines types for the centralized animation system that handles
 * all visual transitions and effects in the application.
 *
 * @module types/animations
 */

/**
 * Supported animation types for visual effects.
 *
 * Each type represents a distinct visual transition pattern that can be
 * applied to DOM elements or canvas objects.
 */
export enum AnimationType {
    /** Fade in from transparent to opaque */
    FADE_IN = 'fade_in',
    /** Fade out from opaque to transparent */
    FADE_OUT = 'fade_out',
    /** Grow in from scale 0 to 1 */
    GROW_IN = 'grow_in',
    /** Shrink out from scale 1 to 0 */
    SHRINK_OUT = 'shrink_out',
    /** Slide in from a direction */
    SLIDE_IN = 'slide_in',
    /** Slide out to a direction */
    SLIDE_OUT = 'slide_out',
    /** Pulse scale effect (zoom in and back) */
    PULSE = 'pulse',
    /** Shake horizontally (error feedback) */
    SHAKE = 'shake',
    /** Pan the canvas to a position */
    PAN = 'pan',
    /** Zoom the canvas to a scale */
    ZOOM = 'zoom',
    /** Highlight an element briefly */
    HIGHLIGHT = 'highlight',
    /** Bounce effect */
    BOUNCE = 'bounce'
}

/**
 * Easing function type for animation interpolation.
 *
 * @param t - Normalized time value (0-1)
 * @returns Eased value (typically 0-1, but can exceed for bounce/elastic)
 */
export type EasingFunction = (t: number) => number;

/**
 * Standard easing function names.
 */
export enum EasingType {
    LINEAR = 'linear',
    EASE_IN = 'ease_in',
    EASE_OUT = 'ease_out',
    EASE_IN_OUT = 'ease_in_out',
    BOUNCE = 'bounce',
    ELASTIC = 'elastic',
    CUSTOM = 'custom'
}

/**
 * Direction for slide animations.
 */
export enum SlideDirection {
    UP = 'up',
    DOWN = 'down',
    LEFT = 'left',
    RIGHT = 'right'
}

/**
 * Configuration for an animation.
 */
export interface AnimationConfig {
    /** Duration in milliseconds */
    duration: number;
    /** Easing function name or custom function */
    easing: EasingType | EasingFunction;
    /** Delay before starting in milliseconds */
    delay?: number;
    /** Callback when animation completes */
    on_complete?: () => void;
    /** Callback when animation is cancelled */
    on_cancel?: () => void;
    /** Additional animation-specific options */
    options?: AnimationOptions;
}

/**
 * Additional options specific to certain animation types.
 */
export interface AnimationOptions {
    /** For slide animations */
    direction?: SlideDirection;
    /** For slide animations - distance in pixels */
    distance?: number;
    /** For highlight animations - color */
    color?: string;
    /** For pan animations - target position */
    target_x?: number;
    target_y?: number;
    /** For zoom animations - target scale */
    target_scale?: number;
    /** For pulse/shake - number of repetitions */
    repeat?: number;
}

/**
 * State of an active animation.
 */
export interface AnimationState {
    /** Unique animation ID */
    id: string;
    /** Type of animation */
    type: AnimationType;
    /** Target selector or ID */
    target: string;
    /** Animation configuration */
    config: AnimationConfig;
    /** When the animation started (timestamp) */
    start_time: number;
    /** Current progress (0-1) */
    progress: number;
    /** Whether the animation is paused */
    paused: boolean;
    /** Animation frame request ID */
    frame_id?: number;
}

/**
 * Target for an animation - can be DOM element or canvas object.
 */
export interface AnimationTarget {
    /** Unique identifier for the target */
    id: string;
    /** Type of target */
    type: 'dom' | 'canvas' | 'node' | 'connection';
    /** Element reference (for DOM targets) */
    element?: HTMLElement | SVGElement;
    /** Node ID (for canvas node targets) */
    node_id?: string;
    /** Connection ID (for canvas connection targets) */
    connection_id?: string;
}

/**
 * Animation preset definition.
 *
 * Presets provide pre-configured animations for common use cases.
 */
export interface AnimationPreset {
    /** Preset name */
    name: string;
    /** Animation type */
    type: AnimationType;
    /** Default configuration */
    config: AnimationConfig;
    /** Description of the preset */
    description?: string;
}

/**
 * Result of starting an animation.
 */
export interface AnimationResult {
    /** Animation ID for tracking */
    id: string;
    /** Promise that resolves when animation completes */
    promise: Promise<void>;
    /** Function to cancel the animation */
    cancel: () => void;
}

/**
 * Animation queue entry.
 */
export interface AnimationQueueEntry {
    /** Target identifier */
    target: string;
    /** Animation type */
    type: AnimationType;
    /** Configuration */
    config: AnimationConfig;
    /** Priority (higher runs first) */
    priority: number;
}

/**
 * Supported CSS properties for transitions.
 */
export enum TransitionProperty {
    OPACITY = 'opacity',
    TRANSFORM = 'transform',
    SCALE = 'scale',
    TRANSLATE_X = 'translateX',
    TRANSLATE_Y = 'translateY',
    BACKGROUND_COLOR = 'backgroundColor',
    BORDER_COLOR = 'borderColor',
    COLOR = 'color',
    WIDTH = 'width',
    HEIGHT = 'height'
}

/**
 * Transition specification for property animation.
 */
export interface TransitionSpec {
    /** CSS property to animate */
    property: TransitionProperty;
    /** Start value */
    from: string | number;
    /** End value */
    to: string | number;
    /** Unit for numeric values */
    unit?: string;
}
