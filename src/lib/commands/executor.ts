/**
 * Command execution engine.
 *
 * Handles command registration, validation, and execution with
 * side effect processing and error handling.
 */

import { animation_store } from '$lib/stores/animation.svelte';
import { history_store } from '$lib/stores/history.svelte';
import { notification_store, type NotificationPresetID } from '$lib/stores/notification.svelte';
import type {
    AnimationEffectPayload,
    Command,
    CommandContext,
    CommandEffect,
    CommandHistoryEntry,
    CommandPayload,
    CommandResult
} from './types';
import { CommandEffectType } from './types';

const commands: Map<string, Command<CommandPayload, CommandPayload>> = new Map();


/**
 * Process a single command side effect.
 *
 * Override this method to customize effect handling.
 *
 * @param effect - Effect to process
 */
const process_effect = <EffectType extends CommandEffectType>(effect: CommandEffect<EffectType>): void => {
    switch (effect.type) {
        case CommandEffectType.TOAST: {
            // Handle toast notifications
            const payload = effect.payload;
            if (payload.message) {
                notification_store.show(payload.message, payload.type, {
                    duration: payload.duration,
                    actions: payload.actions
                });
            }
            break;
        }
        case CommandEffectType.ANIMATION: {
            // Handle animations through animation store
            const payload = effect.payload as unknown as AnimationEffectPayload;
            if (payload.target && payload.type && payload.config) {
                animation_store.start(payload.type, payload.target, payload.config);
            }
            break;
        }
        case CommandEffectType.SOUND: {
            // Emit custom event for sounds
            const event = new CustomEvent('command:sound', {
                detail: effect.payload
            });
            window.dispatchEvent(event);
            break;
        }
        case CommandEffectType.NAVIGATION: {
            // Emit custom event for navigation
            const event = new CustomEvent('command:navigation', {
                detail: effect.payload
            });
            window.dispatchEvent(event);
            break;
        }
        default:
            console.debug('Processing effect', effect);
    }
}

/**
 * Process command side effects.
 *
 * @param effects - Array of effects to process
 */
const process_effects = (effects: CommandEffect<CommandEffectType>[]): void => {
    for (const effect of effects) {
        process_effect(effect);
    }
}

/**
 * Command executor handles command registration and execution.
 */
export const command_executor = {

    /**
     * Register a command.
     *
     * @param command - Command to register
     *
     * @example
     * ```ts
     * const executor = new CommandExecutor();
     * executor.register(create_node_command);
     * ```
     */
    register<PayloadData extends CommandPayload, ResultData extends CommandPayload>(
        command: Command<PayloadData, ResultData>
    ): void {
        commands.set(
            command.id,
            command as unknown as Command<CommandPayload, CommandPayload>
        );
    },

    /**
     * Register multiple commands at once.
     *
     * @param commands - Array of commands to register
     *
     * @example
     * ```ts
     * executor.register_all([
     *   create_node_command,
     *   update_node_command,
     *   delete_node_command
     * ]);
     * ```
     */
    register_all(commands: Command<CommandPayload, CommandPayload>[]): void {
        for (const command of commands) {
            this.register(command);
        }
    },

    /**
     * Get a registered command by ID.
     *
     * @param command_id - Command identifier
     * @returns Command or undefined if not found
     *
     * @example
     * ```ts
     * const command = executor.get('graph.node.create');
     * ```
     */
    get(command_id: string): Command<CommandPayload, CommandPayload> | undefined {
        return commands.get(command_id);
    },

    /**
     * Check if a command is registered.
     *
     * @param command_id - Command identifier
     * @returns True if command exists
     *
     * @example
     * ```ts
     * if (executor.has('graph.node.create')) {
     *   // command is available
     * }
     * ```
     */
    has(command_id: string): boolean {
        return commands.has(command_id);
    },

    /**
     * Execute a command.
     *
     * Validates the command, executes it, and processes side effects.
     *
     * @param command_id - Command to execute
     * @param payload - Command payload
     * @param context - Execution context (optional)
     * @returns Command result
     * @throws Error if command not found or execution fails
     *
     * @example
     * ```ts
     * const result = await executor.execute('graph.node.create', {
     *   statement: 'New node',
     *   details: ''
     * });
     *
     * if (result.success) {
     *   console.log('Node created:', result.data);
     * }
     * ```
     */
    async execute<PayloadData extends CommandPayload = CommandPayload, ResultData = void>(
        command_id: string,
        payload: PayloadData,
        context?: Partial<CommandContext>
    ): Promise<CommandResult<ResultData>> {
        const command = commands.get(command_id);

        if (!command) {
            return {
                success: false,
                error: `Command '${command_id}' not found`
            } as CommandResult<ResultData>;
        }

        // Build full context
        const full_context: CommandContext = {
            timestamp: Date.now(),
            ...context
        };

        // Validate command
        const validation_result = command.validate(payload, full_context);
        if (!validation_result.valid) {
            return {
                success: false,
                error: validation_result.error || 'Validation failed',
                metadata: {
                    field_errors: validation_result.field_errors
                }
            } as CommandResult<ResultData>;
        }

        try {
            // Execute command
            const result = (await command.execute(
                payload,
                full_context
            )) as CommandResult<ResultData>;

            // Add to history if command is undoable and successful
            if (result.success && command.metadata.undoable) {
                const history_entry: CommandHistoryEntry<PayloadData, ResultData> = {
                    command: command_id,
                    payload,
                    result,
                    timestamp: full_context.timestamp
                };
                history_store.push(history_entry);
            }

            // Process side effects
            if (result.success && result.effects) {
                process_effects(result.effects);
            } else if (result.success) {
                // No explicit effects, try to use notification preset
                notification_store.success_for_command(command_id as NotificationPresetID, result.data as CommandPayload);
            }

            return result;
        } catch (error) {
            const error_message = error instanceof Error ? error.message : 'Unknown error occurred';
            // Show error notification with preset if available
            notification_store.error_for_command(command_id, error_message);

            return {
                success: false,
                error: error_message
            } as CommandResult<ResultData>;
        }
    },

    /**
     * Get all registered command IDs.
     *
     * @returns Array of command IDs
     *
     * @example
     * ```ts
     * const all_commands = executor.get_all_command_ids();
     * console.log('Available commands:', all_commands);
     * ```
     */
    get_all_command_ids(): string[] {
        return Array.from(commands.keys());
    },

    /**
     * Get all registered commands.
     *
     * @returns Array of commands
     *
     * @example
     * ```ts
     * const all_commands = executor.get_all_commands();
     * for (const command of all_commands) {
     *   console.log(command.metadata.name);
     * }
     * ```
     */
    get_all_commands(): Command<CommandPayload, CommandPayload>[] {
        return Array.from(commands.values());
    },

    /**
     * Clear all registered commands.
     *
     * Useful for testing.
     *
     * @example
     * ```ts
     * executor.clear();
     * ```
     */
    clear(): void {
        commands.clear();
    }
}
