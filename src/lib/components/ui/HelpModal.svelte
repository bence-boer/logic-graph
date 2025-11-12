<script lang="ts">
    import { keyboard_interactions } from '$lib/interactions/definitions/keyboard';
    import {
        KeyModifier,
        EventMatcherType,
        type InteractionDefinition
    } from '$lib/interactions/types';
    import Button from '$lib/components/ui/Button.svelte';
    import { X } from '@lucide/svelte';

    interface Props {
        is_open: boolean;
        onclose: () => void;
    }

    let { is_open = $bindable(false), onclose }: Props = $props();

    /**
     * Get keyboard shortcut display string from interaction definition.
     *
     * @param interaction - Interaction definition
     * @returns Keyboard shortcut display string (e.g., "Ctrl+S", "A", "Ctrl+Shift+Z")
     */
    function get_shortcut_display(interaction: InteractionDefinition): string {
        const matcher = interaction.matcher;
        const parts: string[] = [];

        // Add modifiers if present
        if (matcher.type === EventMatcherType.KEY_COMBO && matcher.modifiers) {
            for (const modifier of matcher.modifiers) {
                switch (modifier) {
                    case KeyModifier.CTRL:
                        parts.push('Ctrl');
                        break;
                    case KeyModifier.ALT:
                        parts.push('Alt');
                        break;
                    case KeyModifier.SHIFT:
                        parts.push('Shift');
                        break;
                    case KeyModifier.META:
                        parts.push('Cmd');
                        break;
                }
            }
        }

        // Add key
        if (matcher.key) {
            parts.push(matcher.key);
        }

        return parts.join('+');
    }

    function handle_close() {
        is_open = false;
        onclose?.();
    }

    function handle_backdrop_click(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            handle_close();
        }
    }
</script>

{#if is_open}
    <div
        class="fixed top-0 right-0 bottom-0 left-0 z-1000 flex animate-[fade-in_0.2s_ease] items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onclick={handle_backdrop_click}
        onkeydown={(event) => event.key === 'Escape' && handle_close()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        tabindex="-1"
    >
        <div
            class="flex max-h-[80vh] w-[90%] max-w-[600px] animate-[slide-up_0.3s_ease] flex-col rounded-xl border border-neutral-700 bg-neutral-800/80 shadow-[0_10px_15px_rgba(0,0,0,0.5)] max-md:max-h-[90vh] max-md:w-full"
        >
            <div class="flex items-center justify-between border-b border-neutral-700 p-6">
                <h2 id="help-modal-title" class="m-0 text-xl font-semibold text-white">
                    Keyboard Shortcuts
                </h2>
                <button
                    class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-white transition-all duration-200 hover:border-neutral-600 hover:bg-neutral-800 active:scale-98"
                    onclick={handle_close}
                    aria-label="Close"
                    title="Close"
                >
                    <X size={18} />
                </button>
            </div>

            <div class="flex-1 overflow-y-auto p-6">
                <div class="flex flex-col gap-2">
                    {#each keyboard_interactions as interaction (interaction.id)}
                        <div
                            class="grid grid-cols-[180px_1fr] items-center gap-6 rounded-md bg-neutral-800 px-4 py-2"
                        >
                            <div
                                class="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-center font-['Monaco','Courier_New',monospace] text-sm font-semibold text-accent-600"
                            >
                                {get_shortcut_display(interaction)}
                            </div>
                            <div class="text-sm text-neutral-400">
                                {interaction.description}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <div class="flex justify-end border-t border-neutral-700 p-6">
                <Button onclick={handle_close}>Close</Button>
            </div>
        </div>
    </div>
{/if}

<style>
    @keyframes fade-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
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

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .w-\[90\%\] {
            width: 95%;
        }

        .max-h-\[80vh\] {
            max-height: 90vh;
        }

        .grid-cols-\[180px_1fr\] {
            grid-template-columns: 140px 1fr;
        }

        .gap-6 {
            gap: 0.5rem;
        }

        .text-sm {
            font-size: 0.75rem;
        }
    }
</style>
