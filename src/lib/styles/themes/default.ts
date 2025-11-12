/**
 * Default dark theme for Logic Graph
 *
 * This is the primary theme matching the current visual design.
 * All visual properties are defined declaratively using design tokens.
 */

import type { StyleTheme } from '../types';
import { OverlayType, OverlayPosition, AnimationType, InteractionType } from '../types';
import { NodeType, QuestionState, StatementState } from '$lib/types/graph';

/**
 * Default dark theme definition
 */
export const DEFAULT_THEME: StyleTheme = {
    id: 'default',
    name: 'Default Dark Theme',

    // ========================================================================
    // Design Tokens
    // ========================================================================
    tokens: {
        colors: {
            background: {
                default: '#1e293b', // slate-800 - Default dark background
                hover: '#334155', // slate-700 - Slightly lighter on hover
                resolved: '#f8fafc', // slate-50 - Light background for resolved/decided
                dark: '#0f172a' // slate-900 - Darker variant
            },
            border: {
                default: '#64748b', // slate-500 - Neutral gray (undecided statements)
                subtle: '#94a3b8', // slate-400 - Lighter gray
                emphasis: '#e2e8f0', // slate-200 - Very light (for resolved)
                white: '#ffffff' // Pure white (for settled/decided)
            },
            text: {
                primary: '#e2e8f0', // slate-200 - Light text on dark
                secondary: '#cbd5e1', // slate-300 - Slightly darker
                inverse: '#0f172a', // slate-900 - Dark text on light
                muted: '#94a3b8' // slate-400 - De-emphasized text
            },
            status: {
                // Node type/state colors
                question_active: '#f59e0b', // amber-500 - Warm, attention-grabbing (needs answer)
                question_resolved: '#6b7280', // gray-500 - Neutral cool gray (answered)
                statement_settled: '#ffffff', // white - Pure white (decided axiom)

                // Interaction state colors
                selected: '#3b82f6', // blue-500 - Primary interactive blue
                pinned: '#8b5cf6', // violet-500 - Purple for user-fixed position
                connected: '#10b981', // emerald-500 - Green for connections/relationships
                hover: '#60a5fa' // blue-400 - Lighter blue for hover state
            },
            overlay: {
                pin_bg: '#1e293b', // slate-800 - Matches node background
                pin_icon: '#a78bfa', // violet-400 - Lighter purple for visibility
                answer_bg: '#10b981', // emerald-500 - Success green
                answer_icon: '#ffffff', // white - High contrast
                selection: '#3b82f6' // blue-500 - Matches selected state
            }
        },
        spacing: {
            node_padding: 12,
            node_gap: 8,
            indicator_offset: 4,
            selection_padding: 4
        },
        typography: {
            font_family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            font_size: {
                node: 14,
                label: 12,
                indicator: 10
            },
            line_height: 1.4,
            font_weight: {
                normal: 400,
                medium: 500,
                bold: 600
            }
        },
        borders: {
            radius: {
                node: 6, // Slightly more rounded for softer look
                indicator: 10,
                selection: 8
            },
            width: {
                default: 2,
                emphasis: 3,
                hover: 2.5
            }
        },
        shadows: {
            none: 'none',
            subtle: '0 1px 3px rgba(0, 0, 0, 0.2)',
            medium: '0 4px 6px rgba(0, 0, 0, 0.3)',
            emphasis: '0 6px 12px rgba(0, 0, 0, 0.4)',
            glow_blue: '0 0 12px rgba(59, 130, 246, 0.5)', // Blue glow for selected
            glow_amber: '0 0 8px rgba(245, 158, 11, 0.4)' // Subtle amber glow for questions
        },
        animations: {
            duration: {
                fast: 150,
                normal: 200,
                slow: 300
            },
            easing: {
                linear: 'linear',
                ease_in: 'cubic-bezier(0.4, 0, 1, 1)',
                ease_out: 'cubic-bezier(0, 0, 0.2, 1)',
                ease_in_out: 'cubic-bezier(0.4, 0, 0.2, 1)',
                bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }
        }
    },

    // ========================================================================
    // Style Variants
    // ========================================================================
    variants: {
        // Base variant for all statement nodes (default debated state)
        base_statement: {
            id: 'base_statement',
            name: 'Default Statement',
            description: 'Base style for statement nodes (debated, undecided)',
            style: {
                background: '{{colors.background.default}}',
                border_color: '{{colors.border.default}}', // Neutral gray for undecided
                border_width: '{{borders.width.default}}',
                border_radius: '{{borders.radius.node}}',
                text_color: '{{colors.text.primary}}',
                font_size: '{{typography.font_size.node}}',
                font_weight: '{{typography.font_weight.normal}}',
                padding: '{{spacing.node_padding}}',
                opacity: 1,
                box_shadow: '{{shadows.subtle}}',
                transition:
                    'all {{animations.duration.normal}}ms {{animations.easing.ease_in_out}}',
                cursor: 'pointer',
                pointer_events: 'auto',
                min_width: 80,
                max_width: 200,
                min_height: 40
            }
        },

        // Active question (amber border, needs answer)
        question_active: {
            id: 'question_active',
            name: 'Active Question',
            description: 'Question node that needs an answer (undecided)',
            style: {
                border_color: '{{colors.status.question_active}}', // Warm amber
                border_width: '{{borders.width.emphasis}}', // Thicker for attention
                box_shadow: '{{shadows.glow_amber}}' // Subtle amber glow
            }
        },

        // Resolved question (light background, white border, decided)
        question_resolved: {
            id: 'question_resolved',
            name: 'Resolved Question',
            description: 'Question node that has been answered (decided)',
            style: {
                background: '{{colors.background.resolved}}', // Light background
                border_color: '{{colors.border.white}}', // White border (decided)
                border_width: '{{borders.width.emphasis}}', // Thicker for visibility
                text_color: '{{colors.text.inverse}}', // Dark text on light
                box_shadow: '{{shadows.medium}}' // Lift it slightly
            }
        },

        // Settled axiom statement (white border, decided foundation)
        statement_settled: {
            id: 'statement_settled',
            name: 'Settled Axiom',
            description: 'Axiom statement that is settled (decided foundation)',
            style: {
                border_color: '{{colors.status.statement_settled}}', // Pure white
                border_width: '{{borders.width.emphasis}}', // Thicker for importance
                box_shadow: '{{shadows.medium}}' // Lift it for importance
            }
        },

        // Selected state (blue border, glow, emphasis)
        selected: {
            id: 'selected',
            name: 'Selected Node',
            description: 'Node is currently selected',
            style: {
                border_color: '{{colors.status.selected}}', // Bright blue
                border_width: '{{borders.width.emphasis}}',
                box_shadow: '{{shadows.glow_blue}}' // Blue glow
            },
            overlays: [
                {
                    type: OverlayType.SELECTION,
                    position: OverlayPosition.BEHIND,
                    style: {
                        color: '{{colors.overlay.selection}}',
                        opacity: 0.6,
                        padding: 4
                    },
                    animation: {
                        type: AnimationType.PULSE,
                        duration: 2000,
                        easing: '{{animations.easing.ease_in_out}}',
                        iterations: Infinity
                    }
                }
            ]
        },

        // Pinned state (violet border, emphasis)
        pinned: {
            id: 'pinned',
            name: 'Pinned Node',
            description: 'Node is pinned in place (user decision)',
            style: {
                border_color: '{{colors.status.pinned}}', // Purple
                border_width: '{{borders.width.emphasis}}'
            },
            overlays: [
                {
                    type: OverlayType.PIN,
                    position: OverlayPosition.TOP_RIGHT,
                    style: {
                        size: 20,
                        background: '{{colors.overlay.pin_bg}}',
                        color: '{{colors.overlay.pin_icon}}',
                        opacity: 0.95
                    },
                    animation: {
                        type: AnimationType.FADE_IN,
                        duration: 300,
                        easing: '{{animations.easing.ease_out}}'
                    }
                }
            ]
        },

        // Hovered state (lighter background, subtle lift)
        hovered: {
            id: 'hovered',
            name: 'Hovered Node',
            description: 'Mouse is hovering over node',
            style: {
                background: '{{colors.background.hover}}',
                border_color: '{{colors.status.hover}}', // Lighter blue
                border_width: '{{borders.width.hover}}',
                box_shadow: '{{shadows.emphasis}}' // Lift slightly
            }
        },

        // Connected state (green border, relationship highlight)
        connected: {
            id: 'connected',
            name: 'Connected Node',
            description: 'Node is connected to hovered node',
            style: {
                border_color: '{{colors.status.connected}}', // Emerald green
                border_width: '{{borders.width.emphasis}}',
                opacity: 1
            }
        },

        // Dimmed state (reduced opacity)
        dimmed: {
            id: 'dimmed',
            name: 'Dimmed Node',
            description: 'Node is dimmed (another node is hovered)',
            style: {
                opacity: 0.3
            }
        },

        // Answered question (checkmark overlay)
        answered: {
            id: 'answered',
            name: 'Answered Question',
            description: 'Question node has an answer linked',
            style: {},
            overlays: [
                {
                    type: OverlayType.CHECKMARK,
                    position: OverlayPosition.TOP_RIGHT,
                    style: {
                        size: 20,
                        background: '{{colors.overlay.answer_bg}}', // Green success
                        color: '{{colors.overlay.answer_icon}}', // White checkmark
                        opacity: 0.95
                    },
                    animation: {
                        type: AnimationType.SCALE_IN,
                        duration: 400,
                        easing: '{{animations.easing.bounce}}'
                    }
                }
            ]
        }
    },

    // ========================================================================
    // Style Rules (Priority-Ordered)
    // ========================================================================
    rules: [
        // ------------------------------------------------------------------------
        // Highest Priority: Selection (1000)
        // ------------------------------------------------------------------------
        {
            id: 'rule_selected',
            priority: 1000,
            condition: { type: 'interaction', interaction_type: InteractionType.SELECTED },
            variant: 'selected',
            terminal: false
        },

        // ------------------------------------------------------------------------
        // High Priority: Pinned (900)
        // ------------------------------------------------------------------------
        {
            id: 'rule_pinned',
            priority: 900,
            condition: { type: 'interaction', interaction_type: InteractionType.PINNED },
            variant: 'pinned',
            terminal: false
        },

        // ------------------------------------------------------------------------
        // Medium-High Priority: Hover (800)
        // ------------------------------------------------------------------------
        {
            id: 'rule_hovered',
            priority: 800,
            condition: { type: 'interaction', interaction_type: InteractionType.HOVERED },
            variant: 'hovered',
            terminal: false
        },

        // ------------------------------------------------------------------------
        // Medium Priority: Connected (700)
        // ------------------------------------------------------------------------
        {
            id: 'rule_connected',
            priority: 700,
            condition: { type: 'interaction', interaction_type: InteractionType.CONNECTED },
            variant: 'connected',
            terminal: false
        },

        // ------------------------------------------------------------------------
        // Medium-Low Priority: Dimmed (600)
        // ------------------------------------------------------------------------
        {
            id: 'rule_dimmed',
            priority: 600,
            condition: {
                type: 'composite',
                operator: 'AND',
                conditions: [
                    // This node is not hovered
                    {
                        type: 'custom',
                        evaluate: (ctx) => ctx.interactions.hovered === false
                    },
                    // This node is not connected
                    {
                        type: 'custom',
                        evaluate: (ctx) => ctx.interactions.connected === false
                    },
                    // Some other node IS hovered
                    {
                        type: 'custom',
                        evaluate: (ctx) => ctx.graph_state?.any_node_hovered === true
                    }
                ]
            },
            variant: 'dimmed',
            terminal: false
        },

        // ------------------------------------------------------------------------
        // Overlay Priority: Answered (500)
        // ------------------------------------------------------------------------
        {
            id: 'rule_answered',
            priority: 500,
            condition: {
                type: 'custom',
                evaluate: (ctx) => ctx.graph_state?.has_answer === true
            },
            variant: 'answered',
            terminal: false
        },

        // ------------------------------------------------------------------------
        // Low Priority: Node Type and State Specific (200)
        // ------------------------------------------------------------------------

        // Resolved question
        {
            id: 'rule_question_resolved',
            priority: 200,
            condition: {
                type: 'composite',
                operator: 'AND',
                conditions: [
                    { type: 'node_type', node_type: NodeType.QUESTION },
                    {
                        type: 'node_state',
                        state_type: 'question_state',
                        state_value: QuestionState.RESOLVED
                    }
                ]
            },
            variant: 'question_resolved',
            terminal: false
        },

        // Active question
        {
            id: 'rule_question_active',
            priority: 200,
            condition: {
                type: 'composite',
                operator: 'AND',
                conditions: [
                    { type: 'node_type', node_type: NodeType.QUESTION },
                    {
                        type: 'composite',
                        operator: 'OR',
                        conditions: [
                            {
                                type: 'node_state',
                                state_type: 'question_state',
                                state_value: QuestionState.ACTIVE
                            },
                            {
                                type: 'custom',
                                evaluate: (ctx) => ctx.node.question_state === undefined
                            }
                        ]
                    }
                ]
            },
            variant: 'question_active',
            terminal: false
        },

        // Settled axiom statement
        {
            id: 'rule_statement_settled',
            priority: 200,
            condition: {
                type: 'composite',
                operator: 'AND',
                conditions: [
                    {
                        type: 'composite',
                        operator: 'OR',
                        conditions: [
                            { type: 'node_type', node_type: NodeType.STATEMENT },
                            {
                                type: 'custom',
                                evaluate: (ctx) => ctx.node.type === undefined
                            }
                        ]
                    },
                    {
                        type: 'node_state',
                        state_type: 'statement_state',
                        state_value: StatementState.SETTLED
                    },
                    {
                        type: 'custom',
                        evaluate: (ctx) => ctx.graph_state?.is_axiom === true
                    }
                ]
            },
            variant: 'statement_settled',
            terminal: false
        },

        // ------------------------------------------------------------------------
        // Lowest Priority: Base Statement (100)
        // ------------------------------------------------------------------------
        {
            id: 'rule_base_statement',
            priority: 100,
            condition: {
                type: 'composite',
                operator: 'OR',
                conditions: [
                    { type: 'node_type', node_type: NodeType.STATEMENT },
                    {
                        type: 'custom',
                        evaluate: (ctx) => ctx.node.type === undefined
                    }
                ]
            },
            variant: 'base_statement',
            terminal: false
        }
    ]
};
