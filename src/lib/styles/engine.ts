/**
 * Style engine - resolves node styles based on declarative rules and context
 *
 * This module provides the core style resolution logic that evaluates
 * style rules, composes variants, and produces final resolved styles.
 */

import type {
    StyleTheme,
    StyleContext,
    StyleCondition,
    NodeStyleVariant,
    PartialNodeStyle,
    ResolvedNodeStyle,
    ResolvedOverlay,
    OverlayConfig,
    NodeTypeCondition,
    NodeStateCondition,
    InteractionCondition,
    CompositeCondition,
    CustomCondition
} from './types';
import { OverlayPosition } from './types';
import { NodeType } from '$lib/types/graph';

/**
 * Style engine class - resolves styles for nodes based on rules and context
 *
 * @example
 * ```ts
 * const engine = new StyleEngine(DEFAULT_THEME);
 * const context = build_style_context(node, connections, interactions);
 * const style = engine.resolve_style(context);
 * // Apply style to node
 * ```
 */
export class StyleEngine {
    private theme: StyleTheme;
    private resolved_tokens: Map<string, string | number> = new Map();

    constructor(theme: StyleTheme) {
        this.theme = theme;
        this.resolve_tokens();
    }

    /**
     * Resolve token references to actual values
     * Flattens nested token structure into a flat map for easy lookup
     */
    private resolve_tokens(): void {
        const flatten = (obj: Record<string, unknown>, prefix = ''): void => {
            for (const [key, value] of Object.entries(obj)) {
                const path = prefix ? `${prefix}.${key}` : key;
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    flatten(value as Record<string, unknown>, path);
                } else {
                    this.resolved_tokens.set(path, value as string | number);
                }
            }
        };

        flatten(this.theme.tokens as unknown as Record<string, unknown>);
    }

    /**
     * Resolve a style value, replacing token references with actual values
     * Supports {{token.path}} syntax
     *
     * @param value - Value that may contain token references
     * @returns Resolved value with tokens replaced
     *
     * @example
     * ```ts
     * resolve_value('{{colors.background.default}}') // => '#1e293b'
     * resolve_value(2) // => 2
     * ```
     */
    private resolve_value(value: string | number | undefined): string | number | undefined {
        if (typeof value !== 'string') return value;

        const token_pattern = /\{\{([^}]+)\}\}/g;
        return value.replace(token_pattern, (match, token_path) => {
            const resolved = this.resolved_tokens.get(token_path);
            return resolved !== undefined ? String(resolved) : match;
        });
    }

    /**
     * Evaluate a style condition against a context
     *
     * @param condition - Condition to evaluate
     * @param context - Style context with node and state information
     * @returns Whether the condition is satisfied
     */
    private evaluate_condition(condition: StyleCondition, context: StyleContext): boolean {
        switch (condition.type) {
            case 'node_type': {
                const node_type_condition = condition as NodeTypeCondition;
                return (
                    context.node.type === node_type_condition.node_type ||
                    (node_type_condition.node_type === NodeType.STATEMENT &&
                        context.node.type === undefined)
                );
            }

            case 'node_state': {
                const node_state_condition = condition as NodeStateCondition;
                return context.node.statement_state === node_state_condition.state_value;
            }

            case 'interaction': {
                const interaction_condition = condition as InteractionCondition;
                return context.interactions[interaction_condition.interaction_type];
            }

            case 'composite': {
                const composite_condition = condition as CompositeCondition;
                const results = composite_condition.conditions.map((c) =>
                    this.evaluate_condition(c, context)
                );
                switch (composite_condition.operator) {
                    case 'AND':
                        return results.every((r) => r);
                    case 'OR':
                        return results.some((r) => r);
                    case 'NOT':
                        return !results[0];
                }
                break;
            }

            case 'custom': {
                const custom_condition = condition as CustomCondition;
                return custom_condition.evaluate(context);
            }
        }

        return false;
    }

    /**
     * Get applicable variants for a node based on rules
     *
     * @param context - Style context
     * @returns Array of applicable variants in priority order
     */
    private get_applicable_variants(context: StyleContext): NodeStyleVariant[] {
        const applicable_variants: NodeStyleVariant[] = [];

        // Sort rules by priority (highest first)
        const sorted_rules = [...this.theme.rules].sort((a, b) => b.priority - a.priority);

        for (const rule of sorted_rules) {
            if (this.evaluate_condition(rule.condition, context)) {
                const variant = this.theme.variants[rule.variant];
                if (variant) {
                    applicable_variants.push(variant);
                }
                if (rule.terminal) {
                    break;
                }
            }
        }

        return applicable_variants;
    }

    /**
     * Compose multiple partial styles into a single resolved style
     * Later variants override earlier ones
     *
     * @param variants - Array of variants to compose
     * @returns Composed partial style
     */
    private compose_styles(variants: NodeStyleVariant[]): PartialNodeStyle {
        const composed: PartialNodeStyle = {};

        // Apply variants in order (later variants override earlier ones)
        for (const variant of variants) {
            Object.assign(composed, variant.style);
        }

        // Resolve all token references
        const resolved: PartialNodeStyle = {};
        for (const [key, value] of Object.entries(composed)) {
            resolved[key as keyof PartialNodeStyle] = this.resolve_value(value) as never;
        }

        return resolved;
    }

    /**
     * Collect all overlays from applicable variants
     *
     * @param variants - Array of variants that may have overlays
     * @param context - Style context for overlay positioning
     * @returns Array of resolved overlays
     */
    private collect_overlays(
        variants: NodeStyleVariant[],
        context: StyleContext
    ): ResolvedOverlay[] {
        const overlays: ResolvedOverlay[] = [];

        for (const variant of variants) {
            if (variant.overlays) {
                for (const overlay of variant.overlays) {
                    // Check overlay condition if present
                    if (overlay.condition && !this.evaluate_condition(overlay.condition, context)) {
                        continue;
                    }

                    // Resolve overlay position
                    const resolved = this.resolve_overlay_position(overlay, context);
                    overlays.push(resolved);
                }
            }
        }

        return overlays;
    }

    /**
     * Resolve overlay absolute position based on node dimensions
     *
     * @param overlay - Overlay configuration
     * @param context - Style context with node dimensions
     * @returns Resolved overlay with computed position
     */
    private resolve_overlay_position(
        overlay: OverlayConfig,
        context: StyleContext
    ): ResolvedOverlay {
        const width = context.dimensions?.width ?? 100;
        const height = context.dimensions?.height ?? 40;
        const size = overlay.style.size ?? 20;
        const padding = overlay.style.padding ?? 4;

        let x = 0;
        let y = 0;
        let overlay_width = size;
        let overlay_height = size;

        switch (overlay.position) {
            case OverlayPosition.BEHIND:
                // Selection highlight - surrounds the entire node with padding
                overlay_width = width + padding * 2;
                overlay_height = height + padding * 2;
                x = -width / 2 - padding;
                y = -height / 2 - padding;
                break;
            case OverlayPosition.TOP_LEFT:
                x = -width / 2 + (overlay.style.offset?.x ?? 4);
                y = -height / 2 + (overlay.style.offset?.y ?? 4);
                break;
            case OverlayPosition.TOP_RIGHT:
                x = width / 2 - size + (overlay.style.offset?.x ?? -4);
                y = -height / 2 + (overlay.style.offset?.y ?? 4);
                break;
            case OverlayPosition.BOTTOM_LEFT:
                x = -width / 2 + (overlay.style.offset?.x ?? 4);
                y = height / 2 - size + (overlay.style.offset?.y ?? -4);
                break;
            case OverlayPosition.BOTTOM_RIGHT:
                x = width / 2 - size + (overlay.style.offset?.x ?? -4);
                y = height / 2 - size + (overlay.style.offset?.y ?? -4);
                break;
            case OverlayPosition.CENTER:
                x = 0;
                y = 0;
                break;
            case OverlayPosition.CUSTOM:
                x = overlay.style.offset?.x ?? 0;
                y = overlay.style.offset?.y ?? 0;
                break;
        }

        // Resolve token references in overlay style
        const resolved_style = { ...overlay.style };
        if (resolved_style.color) {
            resolved_style.color = this.resolve_value(resolved_style.color) as string;
        }
        if (resolved_style.background) {
            resolved_style.background = this.resolve_value(resolved_style.background) as string;
        }

        return {
            ...overlay,
            style: resolved_style,
            x,
            y,
            width: overlay_width,
            height: overlay_height,
            visible: true
        };
    }

    /**
     * Resolve complete style for a node
     * This is the main public API
     *
     * @param context - Style context with node, connections, and interaction states
     * @returns Fully resolved style ready for application
     *
     * @example
     * ```ts
     * const style = engine.resolve_style({
     *   node: my_node,
     *   connections: all_connections,
     *   interactions: { selected: true, pinned: false, hovered: false, connected: false, dragging: false },
     *   graph_state: { is_axiom: false, has_answer: false, any_node_hovered: false },
     *   theme: 'default',
     *   dimensions: { width: 150, height: 60 }
     * });
     * ```
     */
    public resolve_style(context: StyleContext): ResolvedNodeStyle {
        // Get applicable variants
        const variants = this.get_applicable_variants(context);

        // Compose styles from all variants
        const composed = this.compose_styles(variants);

        // Collect overlays
        const overlays = this.collect_overlays(variants, context);

        // Build final resolved style with defaults
        const resolved: ResolvedNodeStyle = {
            // Core visual properties
            background: (composed.background as string) ?? '#1e293b',
            border_color: (composed.border_color as string) ?? '#475569',
            border_width: (composed.border_width as number) ?? 2,
            border_radius: (composed.border_radius as number) ?? 4,
            text_color: (composed.text_color as string) ?? '#e2e8f0',
            font_size: (composed.font_size as number) ?? 14,
            font_weight: (composed.font_weight as number) ?? 400,
            opacity: (composed.opacity as number) ?? 1,

            // Box model
            padding: (composed.padding as number) ?? 12,
            min_width: (composed.min_width as number) ?? 80,
            max_width: (composed.max_width as number) ?? 200,
            min_height: (composed.min_height as number) ?? 40,

            // Visual effects
            box_shadow: (composed.box_shadow as string) ?? 'none',
            filter: composed.filter as string | undefined,
            transform: composed.transform as string | undefined,

            // Transitions
            transition: (composed.transition as string) ?? 'all 200ms ease-in-out',

            // Overlays
            overlays,

            // Additional indicators
            cursor: (composed.cursor as string) ?? 'pointer',
            pointer_events: (composed.pointer_events as string) ?? 'auto'
        };

        return resolved;
    }

    /**
     * Get the current theme
     */
    public get_theme(): StyleTheme {
        return this.theme;
    }

    /**
     * Update the theme
     * This will re-resolve all token references
     */
    public set_theme(theme: StyleTheme): void {
        this.theme = theme;
        this.resolved_tokens.clear();
        this.resolve_tokens();
    }
}
