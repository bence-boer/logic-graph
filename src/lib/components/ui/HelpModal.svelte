<script lang="ts">
    import { keyboard_shortcuts, get_shortcut_display } from '$lib/utils/keyboard';
    import Button from '$lib/components/ui/Button.svelte';

    interface Props {
        is_open: boolean;
        onclose: () => void;
    }

    let { is_open = $bindable(false), onclose }: Props = $props();

    function handle_close() {
        is_open = false;
        onclose?.();
    }

    function handle_backdrop_click(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            handle_close();
        }
    }
</script>

{#if is_open}
    <div
        class="modal-backdrop"
        onclick={handle_backdrop_click}
        onkeydown={(e) => e.key === 'Escape' && handle_close()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        tabindex="-1"
    >
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="help-modal-title" class="modal-title">Keyboard Shortcuts</h2>
                <button class="close-btn" onclick={handle_close} aria-label="Close">✕</button>
            </div>

            <div class="modal-body">
                <div class="shortcuts-grid">
                    {#each keyboard_shortcuts as shortcut}
                        <div class="shortcut-row">
                            <div class="shortcut-keys">
                                {get_shortcut_display(shortcut)}
                            </div>
                            <div class="shortcut-description">
                                {shortcut.description}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <div class="modal-footer">
                <Button onclick={handle_close}>Close</Button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(var(--blur-sm));
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fade-in 0.2s ease;
    }

    @keyframes fade-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .modal-content {
        background: var(--bg-elevated);
        border: 1px solid var(--border-default);
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        animation: slide-up 0.3s ease;
    }

    @keyframes slide-up {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--border-default);
    }

    .modal-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    .close-btn {
        width: 32px;
        height: 32px;
        background: transparent;
        border: 1px solid var(--border-default);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .close-btn:hover {
        background: var(--bg-secondary);
        border-color: var(--border-hover);
    }

    .modal-body {
        flex: 1;
        padding: var(--spacing-lg);
        overflow-y: auto;
    }

    .shortcuts-grid {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
    }

    .shortcut-row {
        display: grid;
        grid-template-columns: 180px 1fr;
        gap: var(--spacing-lg);
        align-items: center;
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: 6px;
    }

    .shortcut-keys {
        font-family: 'Monaco', 'Courier New', monospace;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--accent-primary);
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--bg-primary);
        border: 1px solid var(--border-default);
        border-radius: 4px;
        text-align: center;
    }

    .shortcut-description {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        padding: var(--spacing-lg);
        border-top: 1px solid var(--border-default);
    }

    /* Scrollbar styling */
    .modal-body::-webkit-scrollbar {
        width: 6px;
    }

    .modal-body::-webkit-scrollbar-track {
        background: transparent;
    }

    .modal-body::-webkit-scrollbar-thumb {
        background: var(--border-default);
        border-radius: 3px;
    }

    .modal-body::-webkit-scrollbar-thumb:hover {
        background: var(--border-hover);
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .modal-content {
            width: 95%;
            max-height: 90vh;
        }

        .shortcut-row {
            grid-template-columns: 140px 1fr;
            gap: var(--spacing-sm);
        }

        .shortcut-keys {
            font-size: 0.75rem;
        }

        .shortcut-description {
            font-size: 0.75rem;
        }
    }
</style>
