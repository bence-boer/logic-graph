/**
 * Type definitions for the declarative styling system
 *
 * This module defines the complete type system for node styling, including:
 * - Design tokens (colors, spacing, typography)
 * - Style variants (composable style configurations)
 * - Style rules (conditional application of variants)
 * - Style conditions (when rules apply)
 * - Resolved styles (final computed styles)
 * - Overlays (visual indicators like pins and checkmarks)
 */

import type { LogicNode, LogicConnection, NodeType, StatementState } from '$lib/types/graph';

// ============================================================================
// Design Tokens
// ============================================================================

/**
 * Complete design token system for the application
 */
export interface StyleTokens {
    colors: ColorTokens;
    spacing: SpacingTokens;
    typography: TypographyTokens;
    borders: BorderTokens;
    shadows: ShadowTokens;
    animations: AnimationTokens;
}

export interface ColorTokens {
    background: {
        default: string;
        hover: string;
        resolved: string; // Light background for resolved/answered nodes
        dark: string;
    };
    border: {
        default: string;
        emphasis: string;
        subtle: string;
        white: string; // Pure white for settled/decided nodes
    };
    text: {
        primary: string;
        secondary: string;
        inverse: string;
        muted: string; // De-emphasized text
    };
    status: {
        // Node type/state colors
        question_active: string; // Active/unanswered question
        question_resolved: string; // Resolved/answered question
        statement_settled: string; // Settled axiom statement
        // Interaction state colors
        selected: string;
        pinned: string;
        connected: string;
        hover: string;
    };
    overlay: {
        pin_bg: string;
        pin_icon: string;
        answer_bg: string;
        answer_icon: string;
        selection: string;
    };
}

export interface SpacingTokens {
    node_padding: number;
    node_gap: number;
    indicator_offset: number;
    selection_padding: number;
}

export interface TypographyTokens {
    font_family: string;
    font_size: {
        node: number;
        label: number;
        indicator: number;
    };
    line_height: number;
    font_weight: {
        normal: number;
        medium: number;
        bold: number;
    };
}

export interface BorderTokens {
    radius: {
        node: number;
        indicator: number;
        selection: number;
    };
    width: {
        default: number;
        emphasis: number;
        hover: number;
    };
}

export interface ShadowTokens {
    none: string;
    subtle: string;
    medium: string;
    emphasis: string;
    glow_blue: string; // Blue glow for selected
    glow_amber: string; // Amber glow for active questions
}

export interface AnimationTokens {
    duration: {
        fast: number;
        normal: number;
        slow: number;
    };
    easing: {
        linear: string;
        ease_in: string;
        ease_out: string;
        ease_in_out: string;
        bounce: string;
    };
}

// ============================================================================
// Style Variants and Resolved Styles
// ============================================================================

/**
 * Complete resolved node style after all rules are applied
 */
export interface ResolvedNodeStyle {
    // Core visual properties
    background: string;
    border_color: string;
    border_width: number;
    border_radius: number;
    text_color: string;
    font_size: number;
    font_weight: number;
    opacity: number;

    // Box model
    padding: number;
    min_width: number;
    max_width: number;
    min_height: number;

    // Visual effects
    box_shadow: string;
    filter?: string;
    transform?: string;

    // Transitions
    transition: string;

    // Overlays (pin, checkmark, etc.)
    overlays: ResolvedOverlay[];

    // Additional indicators
    cursor: string;
    pointer_events: string;
}

/**
 * Partial style for composing variants
 * All properties optional to allow layering
 * Values can be strings (with token references) or direct values
 */
export type PartialNodeStyle = {
    [K in keyof Omit<ResolvedNodeStyle, 'overlays'>]?: ResolvedNodeStyle[K] | string;
};

/**
 * Node style variant - a named collection of style properties
 * Variants are composable and can be combined
 */
export interface NodeStyleVariant {
    /** Unique variant identifier */
    id: string;

    /** Human-readable name */
    name: string;

    /** Description of when this variant applies */
    description?: string;

    /** Style properties (uses tokens with {{token.path}} syntax) */
    style: PartialNodeStyle;

    /** Optional animations to apply */
    animations?: AnimationConfig[];

    /** Optional overlays to show */
    overlays?: OverlayConfig[];
}

// ============================================================================
// Overlays
// ============================================================================

/**
 * Overlay configuration (pin, checkmark, selection highlight)
 */
export interface OverlayConfig {
    /** Overlay type */
    type: OverlayType;

    /** Position relative to node */
    position: OverlayPosition;

    /** Visual properties */
    style: OverlayStyle;

    /** Show condition */
    condition?: StyleCondition;

    /** Animation on appear/disappear */
    animation?: AnimationConfig;
}

export enum OverlayType {
    PIN = 'pin',
    CHECKMARK = 'checkmark',
    SELECTION = 'selection',
    BADGE = 'badge',
    CUSTOM = 'custom'
}

export enum OverlayPosition {
    BEHIND = 'behind', // Behind the node (e.g., selection highlight)
    TOP_LEFT = 'top-left',
    TOP_RIGHT = 'top-right',
    BOTTOM_LEFT = 'bottom-left',
    BOTTOM_RIGHT = 'bottom-right',
    CENTER = 'center',
    CUSTOM = 'custom'
}

export interface OverlayStyle {
    size?: number;
    padding?: number; // Padding around the node (for BEHIND overlays)
    color?: string;
    background?: string;
    border?: string;
    icon?: string;
    opacity?: number;
    offset?: { x: number; y: number };
}

export interface ResolvedOverlay extends OverlayConfig {
    /** Computed absolute position */
    x: number;
    y: number;

    /** Computed size */
    width: number;
    height: number;

    /** Whether currently visible */
    visible: boolean;
}

// ============================================================================
// Animations
// ============================================================================

/**
 * Animation configuration
 */
export interface AnimationConfig {
    /** Animation name/type */
    type: AnimationType;

    /** Duration in milliseconds */
    duration: number;

    /** Easing function */
    easing: string;

    /** Delay before starting */
    delay?: number;

    /** Number of iterations (1 = once, Infinity = loop) */
    iterations?: number;

    /** Animation direction */
    direction?: 'normal' | 'reverse' | 'alternate';
}

export enum AnimationType {
    FADE_IN = 'fade-in',
    FADE_OUT = 'fade-out',
    SCALE_IN = 'scale-in',
    SCALE_OUT = 'scale-out',
    PULSE = 'pulse',
    SHAKE = 'shake',
    SLIDE_IN = 'slide-in',
    SLIDE_OUT = 'slide-out'
}

// ============================================================================
// Style Rules and Conditions
// ============================================================================

/**
 * Style rule - conditionally applies a variant
 * Rules are evaluated in order of priority
 */
export interface StyleRule {
    /** Unique rule identifier */
    id: string;

    /** Rule priority (higher = evaluated first) */
    priority: number;

    /** Condition that must be met for rule to apply */
    condition: StyleCondition;

    /** Variant to apply if condition is met */
    variant: string; // References NodeStyleVariant.id

    /** Whether this rule should stop further rule evaluation */
    terminal?: boolean;
}

/**
 * Style condition - determines if a rule applies
 * Conditions are composable with AND/OR/NOT logic
 */
export type StyleCondition =
    | NodeTypeCondition
    | NodeStateCondition
    | InteractionCondition
    | CompositeCondition
    | CustomCondition;

export interface NodeTypeCondition {
    type: 'node_type';
    node_type: NodeType;
}

export interface NodeStateCondition {
    type: 'node_state';
    state_type: 'statement_state';
    state_value: StatementState;
}

export interface InteractionCondition {
    type: 'interaction';
    interaction_type: InteractionType;
}

export enum InteractionType {
    SELECTED = 'selected',
    PINNED = 'pinned',
    HOVERED = 'hovered',
    CONNECTED = 'connected',
    DRAGGING = 'dragging'
}

export interface CompositeCondition {
    type: 'composite';
    operator: 'AND' | 'OR' | 'NOT';
    conditions: StyleCondition[];
}

export interface CustomCondition {
    type: 'custom';
    evaluate: (context: StyleContext) => boolean;
}

// ============================================================================
// Style Context
// ============================================================================

/**
 * Style context - all information needed to evaluate conditions and resolve styles
 */
export interface StyleContext {
    /** The node being styled */
    node: LogicNode;

    /** All connections in the graph */
    connections: LogicConnection[];

    /** Interaction states */
    interactions: {
        selected: boolean;
        pinned: boolean;
        hovered: boolean;
        connected: boolean;
        dragging: boolean;
    };

    /** Additional context */
    graph_state?: {
        is_axiom: boolean;
        has_answer: boolean;
        answer_node_id?: string;
        any_node_hovered: boolean;
    };

    /** Current theme */
    theme: string;

    /** Node dimensions (for overlay positioning) */
    dimensions?: {
        width: number;
        height: number;
    };
}

// ============================================================================
// Theme
// ============================================================================

/**
 * Complete style theme definition
 */
export interface StyleTheme {
    /** Unique theme identifier */
    id: string;

    /** Human-readable theme name */
    name: string;

    /** Design tokens */
    tokens: StyleTokens;

    /** Named style variants */
    variants: Record<string, NodeStyleVariant>;

    /** Style rules (priority-ordered) */
    rules: StyleRule[];
}
