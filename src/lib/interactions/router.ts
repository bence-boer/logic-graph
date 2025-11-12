/**
 * Interaction router.
 *
 * Routes user events to commands based on interaction definitions.
 */

import type {
    InteractionDefinition,
    EventMatcher,
    EventMatcherType,
    ActiveInteractionContext
} from './types';
import { InteractionContext, EventMatcherType as MatcherType, KeyModifier } from './types';
import { command_executor } from '$lib/commands/executor';
import type { CommandPayload } from '$lib/commands/types'; /**
 * Interaction router handles event listening and command dispatching.
 */
export class InteractionRouter {
    private interactions: InteractionDefinition[] = [];
    private active_context: ActiveInteractionContext = {
        context: InteractionContext.GLOBAL
    };
    private listeners: Array<{ element: EventTarget; type: string; handler: EventListener }> = [];

    /**
     * Register an interaction definition.
     *
     * @param interaction - Interaction to register
     *
     * @example
     * ```ts
     * router.register({
     *   id: 'canvas.click.deselect',
     *   contexts: [InteractionContext.CANVAS],
     *   matcher: { type: EventMatcherType.CLICK },
     *   command: 'selection.clear'
     * });
     * ```
     */
    register(interaction: InteractionDefinition): void {
        this.interactions.push(interaction);
        // Sort by priority (higher first)
        this.interactions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    /**
     * Register multiple interactions.
     *
     * @param interactions - Array of interactions to register
     *
     * @example
     * ```ts
     * router.register_all([
     *   canvas_click_interaction,
     *   node_double_click_interaction,
     *   keyboard_shortcut_interaction
     * ]);
     * ```
     */
    register_all(interactions: InteractionDefinition[]): void {
        for (const interaction of interactions) {
            this.register(interaction);
        }
    }

    /**
     * Set the active interaction context.
     *
     * @param context - Context to activate
     * @param data - Optional context data
     *
     * @example
     * ```ts
     * router.set_context(InteractionContext.FORM, {
     *   form_id: 'create_node'
     * });
     * ```
     */
    set_context(context: InteractionContext, data?: Record<string, unknown>): void {
        this.active_context = { context, data };
    }

    /**
     * Get the current interaction context.
     *
     * @returns Active context
     */
    get_context(): ActiveInteractionContext {
        return this.active_context;
    }

    /**
     * Initialize event listeners.
     *
     * Sets up listeners for all event types used by registered interactions.
     *
     * @param root - Root element to attach listeners to (default: document)
     *
     * @example
     * ```ts
     * router.initialize(document.body);
     * ```
     */
    initialize(root: EventTarget = document): void {
        // Remove existing listeners
        this.cleanup();

        // Collect unique event types
        const event_types = new Set<string>();
        for (const interaction of this.interactions) {
            const event_type = this.matcher_to_event_type(interaction.matcher.type);
            if (event_type) {
                event_types.add(event_type);
            }
        }

        // Remove keydown from generic handlers - we'll handle it separately
        const has_keyboard_events = event_types.has('keydown');
        if (has_keyboard_events) {
            event_types.delete('keydown');
        }

        // Add listeners for each event type (except keydown)
        for (const event_type of event_types) {
            const handler = (event: Event) => this.handle_event(event);
            root.addEventListener(event_type, handler);
            this.listeners.push({ element: root, type: event_type, handler });
        }

        // Special handling for keyboard events
        if (has_keyboard_events) {
            const key_handler = (event: Event) =>
                this.handle_keyboard_event(event as KeyboardEvent);
            root.addEventListener('keydown', key_handler);
            this.listeners.push({ element: root, type: 'keydown', handler: key_handler });
        }
    }

    /**
     * Clean up all event listeners.
     *
     * @example
     * ```ts
     * router.cleanup();
     * ```
     */
    cleanup(): void {
        for (const { element, type, handler } of this.listeners) {
            element.removeEventListener(type, handler);
        }
        this.listeners = [];
    }

    /**
     * Handle an incoming event.
     *
     * @param event - DOM event
     */
    private async handle_event(event: Event): Promise<void> {
        // Find matching interactions
        const matching = this.find_matching_interactions(event);

        // Execute first matching interaction
        if (matching.length > 0) {
            const interaction = matching[0];
            await this.execute_interaction(interaction, event);
        }
    }

    /**
     * Handle keyboard events.
     *
     * @param event - Keyboard event
     */
    private async handle_keyboard_event(event: KeyboardEvent): Promise<void> {
        // Skip keyboard shortcuts if user is typing in an input field
        if (this.is_typing_in_input(event)) {
            return;
        }

        // Find keyboard interactions
        const matching = this.interactions.filter((interaction) => {
            if (
                interaction.matcher.type !== MatcherType.KEY &&
                interaction.matcher.type !== MatcherType.KEY_COMBO
            ) {
                return false;
            }

            // Check context
            if (!this.is_context_active(interaction.contexts)) {
                return false;
            }

            // Check key
            if (
                interaction.matcher.key &&
                interaction.matcher.key.toLowerCase() !== event.key.toLowerCase()
            ) {
                return false;
            }

            // Check modifiers
            if (interaction.matcher.modifiers) {
                if (!this.check_modifiers(event, interaction.matcher.modifiers)) {
                    return false;
                }
            }

            return true;
        });

        // Execute first matching interaction
        if (matching.length > 0) {
            const interaction = matching[0];
            await this.execute_interaction(interaction, event);
        }
    }

    /**
     * Check if user is typing in an input field.
     *
     * @param event - Keyboard event
     * @returns True if user is focused on an input element
     */
    private is_typing_in_input(event: KeyboardEvent): boolean {
        const target = event.target;
        if (!(target instanceof Element)) {
            return false;
        }

        const tag_name = target.tagName.toLowerCase();
        const is_editable = target.getAttribute('contenteditable') === 'true';

        // Check if focused on input, textarea, select, or contenteditable element
        if (
            tag_name === 'input' ||
            tag_name === 'textarea' ||
            tag_name === 'select' ||
            is_editable
        ) {
            return true;
        }

        return false;
    }

    /**
     * Find interactions matching an event.
     *
     * @param event - DOM event
     * @returns Array of matching interactions
     */
    private find_matching_interactions(event: Event): InteractionDefinition[] {
        return this.interactions.filter((interaction) => {
            // Check context
            if (!this.is_context_active(interaction.contexts)) {
                return false;
            }

            // Check event type
            if (!this.does_event_match(event, interaction.matcher)) {
                return false;
            }

            // Check preconditions
            if (interaction.preconditions) {
                if (!this.check_preconditions(interaction.preconditions)) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Check if any of the given contexts is active.
     *
     * @param contexts - Contexts to check
     * @returns True if any context is active
     */
    private is_context_active(contexts: InteractionContext[]): boolean {
        return (
            contexts.includes(this.active_context.context) ||
            contexts.includes(InteractionContext.GLOBAL)
        );
    }

    /**
     * Check if an event matches a matcher.
     *
     * @param event - DOM event
     * @param matcher - Event matcher
     * @returns True if event matches
     */
    private does_event_match(event: Event, matcher: EventMatcher): boolean {
        const event_type = this.matcher_to_event_type(matcher.type);
        if (event.type !== event_type) {
            return false;
        }

        // Check target selector
        if (matcher.target && event.target instanceof Element) {
            if (!event.target.matches(matcher.target)) {
                return false;
            }
        }

        // Check data attribute
        if (matcher.data_attribute && event.target instanceof Element) {
            if (!event.target.hasAttribute(`data-${matcher.data_attribute}`)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check keyboard modifiers.
     *
     * @param event - Keyboard event
     * @param modifiers - Required modifiers
     * @returns True if all modifiers match
     */
    private check_modifiers(event: KeyboardEvent, modifiers: KeyModifier[]): boolean {
        for (const modifier of modifiers) {
            switch (modifier) {
                case KeyModifier.CTRL:
                    if (!event.ctrlKey) return false;
                    break;
                case KeyModifier.SHIFT:
                    if (!event.shiftKey) return false;
                    break;
                case KeyModifier.ALT:
                    if (!event.altKey) return false;
                    break;
                case KeyModifier.META:
                    if (!event.metaKey) return false;
                    break;
            }
        }
        return true;
    }

    /**
     * Check interaction preconditions.
     *
     * @param preconditions - Preconditions to check
     * @returns True if all preconditions pass
     */
    private check_preconditions(preconditions: InteractionDefinition['preconditions']): boolean {
        if (!preconditions) return true;

        for (const precondition of preconditions) {
            if (precondition.check) {
                const result = precondition.check(this.active_context);
                if (precondition.negate ? result : !result) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Execute an interaction.
     *
     * @param interaction - Interaction to execute
     * @param event - Triggering event
     */
    private async execute_interaction(
        interaction: InteractionDefinition,
        event: Event
    ): Promise<void> {
        // Handle event options
        if (interaction.matcher.prevent_default) {
            event.preventDefault();
        }
        if (interaction.matcher.stop_propagation) {
            event.stopPropagation();
        }

        // Build payload
        const payload: CommandPayload = interaction.payload_mapper
            ? interaction.payload_mapper(event)
            : {};

        // Execute command
        try {
            await command_executor.execute(interaction.command, payload);
        } catch (error) {
            console.error(`Failed to execute interaction ${interaction.id}:`, error);
        }
    }

    /**
     * Convert matcher type to DOM event type.
     *
     * @param matcher_type - Matcher type
     * @returns DOM event type
     */
    private matcher_to_event_type(matcher_type: EventMatcherType): string | null {
        switch (matcher_type) {
            case MatcherType.CLICK:
                return 'click';
            case MatcherType.DOUBLE_CLICK:
                return 'dblclick';
            case MatcherType.CONTEXT_MENU:
                return 'contextmenu';
            case MatcherType.KEY:
            case MatcherType.KEY_COMBO:
                return 'keydown';
            case MatcherType.DRAG:
                return 'drag';
            case MatcherType.HOVER:
                return 'mouseover';
            default:
                return null;
        }
    }

    /**
     * Get all registered interactions.
     *
     * @returns Array of interactions
     */
    get_all_interactions(): InteractionDefinition[] {
        return [...this.interactions];
    }

    /**
     * Clear all registered interactions.
     */
    clear(): void {
        this.cleanup();
        this.interactions = [];
    }
}

/**
 * Global interaction router instance.
 */
export const interaction_router = new InteractionRouter();
