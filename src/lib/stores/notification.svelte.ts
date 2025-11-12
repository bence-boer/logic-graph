/**
 * Store for managing rich notifications with actions.
 *
 * Provides enhanced notification system with:
 * - Command-specific notification presets
 * - Action buttons (undo, retry, etc.)
 * - Notification grouping
 * - Animation support
 */

import type { CommandPayload } from '$lib/commands/types';

/**
 * Notification type.
 */
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

/**
 * Action button in a notification.
 */
export interface NotificationAction<ActionPayload extends CommandPayload = CommandPayload> {
    /** Action button label */
    label: string;
    /** Command to execute when clicked */
    command: string;
    /** Payload for the command */
    payload?: ActionPayload;
    /** Button variant (style) */
    variant?: 'primary' | 'secondary' | 'danger';
}

/**
 * A notification message.
 */
export interface Notification {
    /** Unique notification ID */
    id: string;
    /** Notification message */
    message: string;
    /** Notification type */
    type: NotificationType;
    /** Auto-dismiss duration (ms), 0 for no auto-dismiss */
    duration?: number;
    /** Optional action buttons */
    actions?: NotificationAction[];
    /** Group key for grouping similar notifications */
    group_key?: string;
    /** Timestamp */
    timestamp: number;
}

/**
 * Preset configuration for command notifications.
 */
export interface NotificationPreset<ResultData extends CommandPayload = CommandPayload> {
    /** Message template (static string or function) */
    message_template: string | ((data: ResultData) => string);
    /** Notification type */
    type: NotificationType;
    /** Auto-dismiss duration (ms) */
    duration?: number;
    /** Generate action buttons */
    actions?: (data: ResultData) => NotificationAction[];
}

/**
 * Notification presets by command ID.
 *
 * Maps command IDs to notification configurations for success cases.
 */
export const NOTIFICATION_PRESETS: Record<string, NotificationPreset> = {
    // Graph mutation commands
    'graph.node.create': {
        message_template: 'Node created',
        type: 'success',
        duration: 3000
    },
    'graph.node.update': {
        message_template: 'Node updated',
        type: 'success',
        duration: 2000
    },
    'graph.node.delete': {
        message_template: (data: CommandPayload) => {
            const count =
                typeof data.node_ids === 'object' && Array.isArray(data.node_ids)
                    ? data.node_ids.length
                    : 1;
            return count > 1 ? `${count} nodes deleted` : 'Node deleted';
        },
        type: 'success',
        duration: 4000,
        actions: (data: CommandPayload) => [
            {
                label: 'Undo',
                command: 'history.undo',
                variant: 'secondary'
            }
        ]
    },
    'graph.node.pin': {
        message_template: 'Node pinned',
        type: 'info',
        duration: 2000
    },
    'graph.node.unpin': {
        message_template: 'Node unpinned',
        type: 'info',
        duration: 2000
    },
    'graph.connection.create': {
        message_template: 'Connection created',
        type: 'success',
        duration: 2000
    },
    'graph.connection.delete': {
        message_template: 'Connection removed',
        type: 'success',
        duration: 3000,
        actions: () => [
            {
                label: 'Undo',
                command: 'history.undo',
                variant: 'secondary'
            }
        ]
    },
    'graph.answer.link': {
        message_template: 'Answer linked to question',
        type: 'success',
        duration: 3000
    },
    'graph.answer.unlink': {
        message_template: 'Answer unlinked from question',
        type: 'success',
        duration: 3000
    },

    // Navigation commands
    'nav.recenter': {
        message_template: 'View centered',
        type: 'info',
        duration: 1500
    },
    'nav.fit_to_screen': {
        message_template: 'View fitted to screen',
        type: 'info',
        duration: 1500
    },

    // Selection commands
    'selection.select_all': {
        message_template: (data: CommandPayload) => {
            const count = typeof data.count === 'number' ? data.count : 0;
            return `${count} ${count === 1 ? 'node' : 'nodes'} selected`;
        },
        type: 'info',
        duration: 2000
    },
    'selection.clear': {
        message_template: 'Selection cleared',
        type: 'info',
        duration: 1500
    },

    // History commands
    'history.undo': {
        message_template: 'Action undone',
        type: 'info',
        duration: 2000,
        actions: () => [
            {
                label: 'Redo',
                command: 'history.redo',
                variant: 'secondary'
            }
        ]
    },
    'history.redo': {
        message_template: 'Action redone',
        type: 'info',
        duration: 2000,
        actions: () => [
            {
                label: 'Undo',
                command: 'history.undo',
                variant: 'secondary'
            }
        ]
    },

    // File operations
    'file.import': {
        message_template: (data: CommandPayload) => {
            const count = typeof data.node_count === 'number' ? data.node_count : 0;
            return `Imported ${count} ${count === 1 ? 'node' : 'nodes'}`;
        },
        type: 'success',
        duration: 3000
    },
    'file.export': {
        message_template: 'Graph exported successfully',
        type: 'success',
        duration: 3000
    },
    'file.new': {
        message_template: 'New graph created',
        type: 'success',
        duration: 2000
    }
};

/**
 * Error message templates by command ID.
 */
export const ERROR_PRESETS: Record<string, string> = {
    'graph.node.create': 'Failed to create node',
    'graph.node.update': 'Failed to update node',
    'graph.node.delete': 'Failed to delete node',
    'graph.connection.create': 'Failed to create connection',
    'graph.connection.delete': 'Failed to remove connection',
    'file.import': 'Failed to import graph',
    'file.export': 'Failed to export graph',
    'history.undo': 'Nothing to undo',
    'history.redo': 'Nothing to redo'
};

/**
 * Notification store.
 */
export const notification_store = (() => {
    let _notifications = $state<Notification[]>([]);
    let _id_counter = 0;
    const _grouped_notifications = $state<Record<string, Notification[]>>({});

    return {
        get notifications() {
            return _notifications;
        },

        get grouped_notifications() {
            return _grouped_notifications;
        },

        /**
         * Show a notification.
         *
         * @param message - Notification message
         * @param type - Notification type
         * @param options - Additional options
         * @returns Notification ID
         *
         * @example
         * ```ts
         * notification_store.show('Node created', 'success', {
         *   duration: 3000,
         *   actions: [{ label: 'Undo', command: 'history.undo' }]
         * });
         * ```
         */
        show(
            message: string,
            type: NotificationType = 'info',
            options: {
                duration?: number;
                actions?: NotificationAction[];
                group_key?: string;
            } = {}
        ): string {
            const id = `notification-${++_id_counter}`;
            const notification: Notification = {
                id,
                message,
                type,
                duration: options.duration ?? 3000,
                actions: options.actions,
                group_key: options.group_key,
                timestamp: Date.now()
            };

            // Add to main list
            _notifications = [..._notifications, notification];

            // Add to group if group_key provided
            if (options.group_key) {
                const group = _grouped_notifications[options.group_key] || [];
                _grouped_notifications[options.group_key] = [...group, notification];
            }

            // Auto-dismiss if duration > 0
            if (notification.duration && notification.duration > 0) {
                setTimeout(() => {
                    this.remove(id);
                }, notification.duration);
            }

            return id;
        },

        /**
         * Show success notification.
         *
         * @param message - Success message
         * @param options - Additional options
         * @returns Notification ID
         */
        success(
            message: string,
            options?: { duration?: number; actions?: NotificationAction[] }
        ): string {
            return this.show(message, 'success', options);
        },

        /**
         * Show error notification.
         *
         * @param message - Error message
         * @param options - Additional options
         * @returns Notification ID
         */
        error(
            message: string,
            options?: { duration?: number; actions?: NotificationAction[] }
        ): string {
            return this.show(message, 'error', { duration: 5000, ...options });
        },

        /**
         * Show warning notification.
         *
         * @param message - Warning message
         * @param options - Additional options
         * @returns Notification ID
         */
        warning(
            message: string,
            options?: { duration?: number; actions?: NotificationAction[] }
        ): string {
            return this.show(message, 'warning', { duration: 4000, ...options });
        },

        /**
         * Show info notification.
         *
         * @param message - Info message
         * @param options - Additional options
         * @returns Notification ID
         */
        info(
            message: string,
            options?: { duration?: number; actions?: NotificationAction[] }
        ): string {
            return this.show(message, 'info', options);
        },

        /**
         * Show notification for a successful command.
         *
         * Uses preset configuration if available.
         *
         * @param command_id - Command identifier
         * @param result_data - Command result data
         * @returns Notification ID or undefined if no preset
         *
         * @example
         * ```ts
         * notification_store.success_for_command('graph.node.create', { node_id: '123' });
         * ```
         */
        success_for_command<ResultData extends CommandPayload = CommandPayload>(
            command_id: string,
            result_data?: ResultData
        ): string | undefined {
            const preset = NOTIFICATION_PRESETS[command_id];
            if (!preset) {
                return undefined;
            }

            const message =
                typeof preset.message_template === 'function'
                    ? preset.message_template(result_data || ({} as ResultData))
                    : preset.message_template;

            const actions = preset.actions
                ? preset.actions(result_data || ({} as ResultData))
                : undefined;

            return this.show(message, preset.type, {
                duration: preset.duration,
                actions,
                group_key: command_id
            });
        },

        /**
         * Show notification for a failed command.
         *
         * Uses preset error message if available, otherwise uses provided error.
         *
         * @param command_id - Command identifier
         * @param error - Error message
         * @param options - Additional options
         * @returns Notification ID
         *
         * @example
         * ```ts
         * notification_store.error_for_command('graph.node.create', 'Invalid statement');
         * ```
         */
        error_for_command(
            command_id: string,
            error: string,
            options?: { actions?: NotificationAction[] }
        ): string {
            const preset_message = ERROR_PRESETS[command_id];
            const message = preset_message ? `${preset_message}: ${error}` : error;

            return this.error(message, options);
        },

        /**
         * Remove a notification.
         *
         * @param id - Notification ID
         *
         * @example
         * ```ts
         * notification_store.remove('notification-1');
         * ```
         */
        remove(id: string): void {
            // Remove from main list
            const notification = _notifications.find((n) => n.id === id);
            _notifications = _notifications.filter((n) => n.id !== id);

            // Remove from group
            if (notification?.group_key) {
                const group = _grouped_notifications[notification.group_key];
                if (group) {
                    const updated_group = group.filter((n) => n.id !== id);
                    if (updated_group.length === 0) {
                        delete _grouped_notifications[notification.group_key];
                    } else {
                        _grouped_notifications[notification.group_key] = updated_group;
                    }
                }
            }
        },

        /**
         * Remove all notifications in a group.
         *
         * @param group_key - Group key
         *
         * @example
         * ```ts
         * notification_store.remove_group('graph.node.delete');
         * ```
         */
        remove_group(group_key: string): void {
            const group = _grouped_notifications[group_key];
            if (group) {
                for (const notification of group) {
                    _notifications = _notifications.filter((n) => n.id !== notification.id);
                }
                delete _grouped_notifications[group_key];
            }
        },

        /**
         * Clear all notifications.
         *
         * @example
         * ```ts
         * notification_store.clear();
         * ```
         */
        clear(): void {
            _notifications = [];
            for (const key in _grouped_notifications) {
                delete _grouped_notifications[key];
            }
        },

        /**
         * Get notification count.
         *
         * @returns Total number of active notifications
         */
        get count(): number {
            return _notifications.length;
        },

        /**
         * Get notification count by type.
         *
         * @param type - Notification type
         * @returns Count of notifications of the specified type
         */
        count_by_type(type: NotificationType): number {
            return _notifications.filter((n) => n.type === type).length;
        }
    };
})();
