<script lang="ts">
    import { toast_store } from '$lib/stores/toast.svelte';

    function handle_close(id: string) {
        toast_store.remove(id);
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
</script>

<div class="toast-container">
    {#each toast_store.toasts as toast (toast.id)}
        <div class="toast toast-{toast.type}" role="alert">
            <span class="toast-icon">{get_icon(toast.type)}</span>
            <span class="toast-message">{toast.message}</span>
            <button
                class="toast-close"
                onclick={() => handle_close(toast.id)}
                aria-label="Close notification"
            >
                ✕
            </button>
        </div>
    {/each}
</div>

<style>
    .toast-container {
        position: fixed;
        bottom: var(--spacing-lg);
        right: var(--spacing-lg);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        pointer-events: none;
    }

    .toast {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--bg-elevated);
        backdrop-filter: blur(var(--blur-md));
        border: 1px solid var(--border-default);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        min-width: 300px;
        max-width: 400px;
        pointer-events: auto;
        animation: slide-in 0.3s ease;
    }

    @keyframes slide-in {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .toast-success {
        border-left: 4px solid var(--accent-tertiary);
    }

    .toast-error {
        border-left: 4px solid var(--accent-secondary);
    }

    .toast-warning {
        border-left: 4px solid #f59e0b;
    }

    .toast-info {
        border-left: 4px solid var(--accent-primary);
    }

    .toast-icon {
        font-size: 1.25rem;
        line-height: 1;
        flex-shrink: 0;
    }

    .toast-success .toast-icon {
        color: var(--accent-tertiary);
    }

    .toast-error .toast-icon {
        color: var(--accent-secondary);
    }

    .toast-warning .toast-icon {
        color: #f59e0b;
    }

    .toast-info .toast-icon {
        color: var(--accent-primary);
    }

    .toast-message {
        flex: 1;
        font-size: 0.875rem;
        color: var(--text-primary);
        line-height: 1.4;
    }

    .toast-close {
        width: 24px;
        height: 24px;
        background: transparent;
        border: none;
        color: var(--text-secondary);
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        flex-shrink: 0;
        transition: all 0.2s ease;
    }

    .toast-close:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .toast-container {
            left: var(--spacing-md);
            right: var(--spacing-md);
            bottom: var(--spacing-md);
        }

        .toast {
            min-width: auto;
            max-width: 100%;
        }
    }
</style>
