<script lang="ts">
    import { command_executor } from '$lib/commands/executor';
    import type { NotificationAction } from '$lib/stores/notification.svelte';
    import { notification_store } from '$lib/stores/notification.svelte';

    function handle_close(id: string) {
        notification_store.remove(id);
    }

    async function handle_action(action: NotificationAction<unknown>, notification_id: string) {
        // Execute the action's command
        await command_executor.execute(action.command, action.payload || {});
        // Close the notification after action
        notification_store.remove(notification_id);
    }

    function get_icon(type: string) {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
            default:
                return 'ℹ';
        }
    }

    const border_classes = {
        success: 'border-l-4 border-l-emerald-500',
        error: 'border-l-4 border-l-red-500',
        warning: 'border-l-4 border-l-accent-500',
        info: 'border-l-4 border-l-accent-600'
    };

    const icon_color_classes = {
        success: 'text-emerald-500',
        error: 'text-red-500',
        warning: 'text-accent-500',
        info: 'text-accent-600'
    };

    const action_button_classes = {
        primary: 'bg-accent-600 hover:bg-accent-700 text-white',
        secondary: 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200',
        danger: 'bg-red-600 hover:bg-red-700 text-white'
    };
</script>

<div class="notification-container">
    {#each notification_store.notifications as notification (notification.id)}
        <div
            class="notification {border_classes[notification.type]}"
            role="alert"
            aria-live="polite"
        >
            <!-- Icon -->
            <span class="notification-icon {icon_color_classes[notification.type]}">
                {get_icon(notification.type)}
            </span>

            <!-- Content -->
            <div class="notification-content">
                <span class="notification-message">{notification.message}</span>

                <!-- Action buttons -->
                {#if notification.actions && notification.actions.length > 0}
                    <div class="notification-actions">
                        {#each notification.actions as action, index (index)}
                            <button
                                class="action-button {action_button_classes[
                                    action.variant || 'secondary'
                                ]}"
                                onclick={() => handle_action(action, notification.id)}
                            >
                                {action.label}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Close button -->
            <button
                class="close-button"
                onclick={() => handle_close(notification.id)}
                aria-label="Close notification"
            >
                ✕
            </button>
        </div>
    {/each}
</div>

<style>
    .notification-container {
        pointer-events: none;
        position: fixed;
        right: 1.5rem;
        bottom: 1.5rem;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 400px;
    }

    .notification {
        pointer-events: auto;
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        min-width: 300px;
        padding: 1rem 1.5rem;
        background: rgba(38, 38, 38, 0.95);
        border: 1px solid rgb(64, 64, 64);
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(12px);
        animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .notification-icon {
        flex-shrink: 0;
        font-size: 1.25rem;
        line-height: 1;
        margin-top: 0.125rem;
    }

    .notification-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .notification-message {
        font-size: 0.875rem;
        line-height: 1.4;
        color: white;
    }

    .notification-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .action-button {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 500;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .action-button:active {
        transform: scale(0.95);
    }

    .close-button {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.5rem;
        height: 1.5rem;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 0.25rem;
        color: rgb(163, 163, 163);
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .close-button:hover {
        background: rgba(64, 64, 64, 0.8);
        color: white;
    }

    @keyframes slide-in {
        from {
            transform: translateX(calc(100% + 2rem));
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    /* Fade out animation when removed */
    :global(.notification.removing) {
        animation: slide-out 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
    }

    @keyframes slide-out {
        to {
            transform: translateX(calc(100% + 2rem));
            opacity: 0;
        }
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .notification-container {
            left: 1rem;
            right: 1rem;
            bottom: 1rem;
            max-width: none;
        }

        .notification {
            min-width: 0;
        }

        @keyframes slide-in {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        @keyframes slide-out {
            to {
                transform: translateY(100%);
                opacity: 0;
            }
        }
    }
</style>
