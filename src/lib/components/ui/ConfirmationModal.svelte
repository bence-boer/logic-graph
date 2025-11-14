<script lang="ts">
    import { AlertTriangle } from '@lucide/svelte';
    import Button from './Button.svelte';

    interface Props {
        is_open: boolean;
        title: string;
        message: string;
        details?: string;
        confirm_text?: string;
        cancel_text?: string;
        variant?: 'danger' | 'warning' | 'info';
        onconfirm: () => void;
        oncancel: () => void;
    }

    let {
        is_open = $bindable(false),
        title,
        message,
        details,
        confirm_text = 'Confirm',
        cancel_text = 'Cancel',
        variant = 'danger',
        onconfirm,
        oncancel
    }: Props = $props();

    function handle_confirm() {
        onconfirm();
    }

    function handle_cancel() {
        oncancel();
    }

    function handle_backdrop_click(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            handle_cancel();
        }
    }
</script>

{#if is_open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
        class="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onclick={handle_backdrop_click}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        tabindex="-1"
    >
        <div
            class="w-full max-w-md rounded-lg border border-(--border-default) bg-(--bg-elevated) p-6 shadow-(--shadow-lg)"
        >
            <div class="mb-4 flex items-start gap-3">
                {#if variant === 'danger'}
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10"
                    >
                        <AlertTriangle size={20} class="text-red-500" />
                    </div>
                {:else if variant === 'warning'}
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-500/10"
                    >
                        <AlertTriangle size={20} class="text-yellow-500" />
                    </div>
                {:else}
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10"
                    >
                        <AlertTriangle size={20} class="text-blue-500" />
                    </div>
                {/if}

                <div class="flex-1">
                    <h3
                        id="confirmation-modal-title"
                        class="mb-2 text-lg font-semibold text-(--text-primary)"
                    >
                        {title}
                    </h3>
                    <p class="text-sm text-(--text-secondary)">
                        {message}
                    </p>
                    {#if details}
                        <p class="mt-2 text-sm text-(--text-tertiary)">
                            {details}
                        </p>
                    {/if}
                </div>
            </div>

            <div class="flex justify-end gap-2">
                <Button on_click={handle_cancel} variant="secondary" size="sm">
                    {cancel_text}
                </Button>
                <Button
                    on_click={handle_confirm}
                    variant={variant === 'danger' ? 'danger' : 'primary'}
                    size="sm"
                >
                    {confirm_text}
                </Button>
            </div>
        </div>
    </div>
{/if}
