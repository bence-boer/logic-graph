<script lang="ts">
    interface Props {
        onclick?: () => void;
        variant?: 'primary' | 'secondary' | 'danger';
        size?: 'sm' | 'md' | 'lg';
        disabled?: boolean;
        children: import('svelte').Snippet;
    }

    let {
        onclick,
        variant = 'secondary',
        size = 'md',
        disabled = false,
        children
    }: Props = $props();
</script>

<button class="btn {variant} {size}" {onclick} {disabled}>
    {@render children()}
</button>

<style>
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-xs);
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--border-default);
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        background: var(--bg-secondary);
        color: var(--text-primary);
    }

    .btn:hover:not(:disabled) {
        border-color: var(--border-hover);
        background: var(--bg-elevated);
    }

    .btn:active:not(:disabled) {
        transform: scale(0.98);
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn.primary {
        background: var(--accent-primary);
        border-color: var(--accent-primary);
        color: white;
    }

    .btn.primary:hover:not(:disabled) {
        background: #6d28d9;
        border-color: #6d28d9;
    }

    .btn.danger {
        background: transparent;
        border-color: var(--accent-secondary);
        color: var(--accent-secondary);
    }

    .btn.danger:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.1);
    }

    .btn.sm {
        padding: var(--spacing-xs) var(--spacing-sm);
        font-size: 0.75rem;
    }

    .btn.lg {
        padding: var(--spacing-md) var(--spacing-lg);
        font-size: 1rem;
    }
</style>
