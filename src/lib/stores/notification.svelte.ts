/**
 * Store for managing rich notifications with actions.
 *
 * Provides enhanced notification system with:
 * - Command-specific notification presets
 * - Action buttons (undo, retry, etc.)
 * - Notification grouping
 * - Animation support
 */


export enum ToastType {
    INFO = 'info',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error'
}

export enum ToastVariant {
    PRIMARY = 'primary',
    SECONDARY = 'secondary',
    DANGER = 'danger'
}

/**
 * Action button in a notification.
 */
export interface NotificationAction<ActionPayload> {
    /** Action button label */
    label: string;
    /** Command to execute when clicked */
    command: string;
    /** Payload for the command */
    payload?: ActionPayload;
    /** Button variant (style) */
    variant?: ToastVariant;
}

/**
 * Helper: map a tuple of payload types to a tuple of action shapes where each
 * action's `payload` has the corresponding tuple element type. This preserves
 * per-index payload inference when callers provide a tuple literal.
 */
export type NotificationActions<Payloads extends readonly unknown[]> = {
    [Key in keyof Payloads]: NotificationAction<Payloads[Key]>;
};


/**
 * Actions may be provided as a precise tuple (to preserve per-index payload
 * types) or as a plain array of action items (in which case payloads will be
 * the union of the tuple members). This type accepts both forms.
 */
export type ToastActions<Payloads extends readonly unknown[]> =
    | NotificationActions<Payloads>
    | Array<NotificationActions<Payloads>[number]>;

type x = ToastActions<[{ id: string }, { count: number }]>;

export type ToastEffectPayload<Payloads extends readonly unknown[] = readonly unknown[]> = Pick<
    Notification<Payloads>,
    'message' | 'type' | 'duration' | 'actions'
>;



/**
 * A notification message.
 */
export interface Notification<Payloads extends readonly unknown[] = readonly unknown[]> {
    /** Unique notification ID */
    id: string;
    /** Notification message */
    message: string;
    /** Notification type */
    type: ToastType;
    /** Auto-dismiss duration (ms), 0 for no auto-dismiss */
    duration?: number;
    /** Optional action buttons */
    actions?: ToastActions<Payloads>;
    /** Group key for grouping similar notifications */
    group_key?: string;
    /** Timestamp */
    timestamp: number;
}

/**
 * Preset configuration for command notifications.
 */
export interface NotificationPreset<ResultData, Payloads extends readonly unknown[] = readonly unknown[]> {
    /** Message template (static string or function) */
    message_template: string | ((data: ResultData) => string);
    /** Notification type */
    type: ToastType;
    /** Auto-dismiss duration (ms) */
    duration?: number;
    /** Generate action buttons */
    actions?: (data: ResultData) => NotificationAction<Payloads>[];
}

export type NodeDeleteData = {
    node_ids: string[] | string;
};

export type SelectAllData = {
    count: number;
};

export type FileImportData = {
    node_count: number;
};

/**
 * Notification presets by command ID.
 *
 * Maps command IDs to notification configurations for success cases.
 */
export const NOTIFICATION_PRESETS = {
    // Graph mutation commands
    'graph.node.create': {
        message_template: 'Node created',
        type: ToastType.SUCCESS,
        duration: 3000
    },
    'graph.node.update': {
        message_template: 'Node updated',
        type: ToastType.SUCCESS,
        duration: 2000
    },
    'graph.node.delete': {
        message_template: (data: NodeDeleteData) => {
            const count =
                typeof data.node_ids === 'object' && Array.isArray(data.node_ids)
                    ? data.node_ids.length
                    : 1;
            return count > 1 ? `${count} nodes deleted` : 'Node deleted';
        },
        type: ToastType.SUCCESS,
        duration: 4000,
        actions: () => [
            {
                label: 'Undo',
                command: 'history.undo',
                variant: ToastVariant.SECONDARY
            }
        ]
    },
    'graph.node.pin': {
        message_template: 'Node pinned',
        type: ToastType.INFO,
        duration: 2000
    },
    'graph.node.unpin': {
        message_template: 'Node unpinned',
        type: ToastType.INFO,
        duration: 2000
    },
    'graph.connection.create': {
        message_template: 'Connection created',
        type: ToastType.SUCCESS,
        duration: 2000
    },
    'graph.connection.delete': {
        message_template: 'Connection removed',
        type: ToastType.SUCCESS,
        duration: 3000,
        actions: () => [
            {
                label: 'Undo',
                command: 'history.undo',
                variant: ToastVariant.SECONDARY
            }
        ]
    },
    'graph.answer.link': {
        message_template: 'Answer linked to question',
        type: ToastType.SUCCESS,
        duration: 3000
    },
    'graph.answer.unlink': {
        message_template: 'Answer unlinked from question',
        type: ToastType.SUCCESS,
        duration: 3000
    },

    // Navigation commands
    'nav.recenter': {
        message_template: 'View centered',
        type: ToastType.INFO,
        duration: 1500
    },
    'nav.fit_to_screen': {
        message_template: 'View fitted to screen',
        type: ToastType.INFO,
        duration: 1500
    },

    // Selection commands
    'selection.select_all': {
        message_template: (data: SelectAllData) => {
            const count = typeof data.count === 'number' ? data.count : 0;
            return `${count} ${count === 1 ? 'node' : 'nodes'} selected`;
        },
        type: ToastType.INFO,
        duration: 2000
    } as NotificationPreset<SelectAllData>,
    'selection.clear': {
        message_template: 'Selection cleared',
        type: ToastType.INFO,
        duration: 1500
    },

    // History commands
    'history.undo': {
        message_template: 'Action undone',
        type: ToastType.INFO,
        duration: 2000,
        actions: () => [
            {
                label: 'Redo',
                command: 'history.redo',
                variant: ToastVariant.SECONDARY
            }
        ]
    },
    'history.redo': {
        message_template: 'Action redone',
        type: ToastType.INFO,
        duration: 2000,
        actions: () => [
            {
                label: 'Undo',
                command: 'history.undo',
                variant: ToastVariant.SECONDARY
            }
        ]
    },

    // File operations
    'file.import': {
        message_template: (data) => {
            const count = typeof data.node_count === 'number' ? data.node_count : 0;
            return `Imported ${count} ${count === 1 ? 'node' : 'nodes'}`;
        },
        type: ToastType.SUCCESS,
        duration: 3000
    } as NotificationPreset<FileImportData>,
    'file.export': {
        message_template: 'Graph exported successfully',
        type: ToastType.SUCCESS,
        duration: 3000
    },
    'file.new': {
        message_template: 'New graph created',
        type: ToastType.SUCCESS,
        duration: 2000
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as const satisfies Record<string, NotificationPreset<any>>;

export type NotificationPresets = typeof NOTIFICATION_PRESETS;

export type NotificationPresetData = {
    [Key in keyof NotificationPresets]: NotificationPresets[Key] extends NotificationPreset<infer Data>
    ? Data
    : never;
};
export type NotificationPresetID = keyof typeof NOTIFICATION_PRESETS;

const does_preset_have_actions = <ResultData, Payloads>(
    preset: NotificationPreset<ResultData>
): preset is NotificationPreset<ResultData> & { actions: (data: ResultData) => NotificationAction<Payloads>[] } => {
    return Object.prototype.hasOwnProperty.call(preset, 'actions');
};

/**
 * Error message templates by command ID.
 */
export const ERROR_PRESETS = {
    'graph.node.create': 'Failed to create node',
    'graph.node.update': 'Failed to update node',
    'graph.node.delete': 'Failed to delete node',
    'graph.connection.create': 'Failed to create connection',
    'graph.connection.delete': 'Failed to remove connection',
    'file.import': 'Failed to import graph',
    'file.export': 'Failed to export graph',
    'history.undo': 'Nothing to undo',
    'history.redo': 'Nothing to redo'
} as const satisfies Partial<Record<NotificationPresetID, string>>;

export type ErrorPresetID = keyof typeof ERROR_PRESETS;

export type NotificationOptionData<Payload> = {
    duration?: number;
    actions?: NotificationAction<Payload>[]
}

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
         * notification_store.show('Node created', ToastType.SUCCESS, {
         *   duration: 3000,
         *   actions: [{ label: 'Undo', command: 'history.undo' }]
         * });
         * ```
         */
        show<NotificationActionData>(
            message: string,
            type: ToastType = ToastType.INFO,
            options: {
                duration?: number;
                actions?: NotificationAction<NotificationActionData>[];
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
        success<Payload>(
            message: string,
            options?: NotificationOptionData<Payload>
        ): string {
            return this.show(message, ToastType.SUCCESS, options);
        },

        /**
         * Show error notification.
         *
         * @param message - Error message
         * @param options - Additional options
         * @returns Notification ID
         */
        error<Payload>(
            message: string,
            options?: NotificationOptionData<Payload>
        ): string {
            return this.show(message, ToastType.ERROR, { duration: 5000, ...options });
        },

        /**
         * Show warning notification.
         *
         * @param message - Warning message
         * @param options - Additional options
         * @returns Notification ID
         */
        warning<Payload>(
            message: string,
            options?: NotificationOptionData<Payload>
        ): string {
            return this.show(message, ToastType.WARNING, { duration: 4000, ...options });
        },

        /**
         * Show info notification.
         *
         * @param message - Info message
         * @param options - Additional options
         * @returns Notification ID
         */
        info<Payload>(
            message: string,
            options?: NotificationOptionData<Payload>
        ): string {
            return this.show(message, ToastType.INFO, options);
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
        success_for_command<NotificationPreset extends NotificationPresetID>(
            command_id: NotificationPreset,
            result_data?: NotificationPresetData[NotificationPreset]
        ): string | undefined {
            const preset = NOTIFICATION_PRESETS[command_id];
            if (!preset) {
                return undefined;
            }

            const message =
                typeof preset.message_template === 'function'
                    ? preset.message_template(result_data || ({} as NotificationPresetData[NotificationPreset]))
                    : preset.message_template;

            const actions = does_preset_have_actions(preset)
                ? preset.actions(result_data || ({} as NotificationPresetData[NotificationPreset]))
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
            command_id: ErrorPresetID,
            error: string,
            options?: Pick<NotificationOptionData, 'actions'>
        ): string {
            const message = `${ERROR_PRESETS[command_id]}: ${error}`;

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
        count_by_type(type: ToastType): number {
            return _notifications.filter((n) => n.type === type).length;
        }
    };
})();
