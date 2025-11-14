<script lang="ts">
    import { X } from '@lucide/svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { graph_store } from '$lib/stores/graph.svelte';
    import { notification_store } from '$lib/stores/notification.svelte';

    interface Props {
        is_open: boolean;
        onclose: () => void;
    }

    let { is_open = $bindable(false), onclose }: Props = $props();

    type TabType = 'statement' | 'question' | 'connection';
    let active_tab = $state<TabType>('statement');

    function handle_close() {
        is_open = false;
        onclose?.();
    }

    function handle_backdrop_click(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            handle_close();
        }
    }

    function handle_create_statement() {
        handle_close();
        ui_store.open_create_node_form();
    }

    function handle_create_question() {
        handle_close();
        ui_store.open_create_question_form();
    }

    function handle_create_connection() {
        if (graph_store.nodes.length < 2) {
            notification_store.error('You need at least 2 statements to create a connection');
            return;
        }
        handle_close();
        ui_store.open_create_connection_form();
    }
</script>

{#if is_open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
        class="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onclick={handle_backdrop_click}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-modal-title"
        tabindex="-1"
    >
        <div
            class="relative w-full max-w-md rounded-lg border border-(--border-default) bg-(--bg-elevated) p-6 shadow-(--shadow-lg)"
        >
            <button
                class="absolute top-4 right-4 flex cursor-pointer items-center justify-center rounded-md p-1.5 text-(--text-tertiary) transition-all duration-200 hover:bg-(--bg-secondary) hover:text-(--text-primary)"
                onclick={handle_close}
                aria-label="Close"
            >
                <X size={20} />
            </button>

            <h2 id="create-modal-title" class="mb-6 text-xl font-semibold text-(--text-primary)">
                Create New
            </h2>

            <!-- Tabs -->
            <div
                class="mb-6 flex gap-2 rounded-lg border border-(--border-default) bg-(--bg-secondary) p-1"
            >
                <button
                    class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 {active_tab ===
                    'statement'
                        ? 'bg-(--bg-elevated) text-(--text-primary) shadow-sm'
                        : 'text-(--text-secondary) hover:text-(--text-primary)'}"
                    onclick={() => (active_tab = 'statement')}
                >
                    Statement
                </button>
                <button
                    class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 {active_tab ===
                    'question'
                        ? 'bg-(--bg-elevated) text-(--text-primary) shadow-sm'
                        : 'text-(--text-secondary) hover:text-(--text-primary)'}"
                    onclick={() => (active_tab = 'question')}
                >
                    Question
                </button>
                <button
                    class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 {active_tab ===
                    'connection'
                        ? 'bg-(--bg-elevated) text-(--text-primary) shadow-sm'
                        : 'text-(--text-secondary) hover:text-(--text-primary)'}"
                    onclick={() => (active_tab = 'connection')}
                >
                    Connection
                </button>
            </div>

            <!-- Content -->
            <div class="mb-6">
                {#if active_tab === 'statement'}
                    <div class="space-y-3">
                        <p class="text-sm text-(--text-secondary)">
                            Create a new statement node in your logic graph. Statements are the
                            fundamental building blocks of logical reasoning.
                        </p>
                        <ul class="space-y-1 text-sm text-(--text-tertiary)">
                            <li>• Can be premises or conclusions</li>
                            <li>• Connect to show logical relationships</li>
                            <li>• Support detailed explanations</li>
                        </ul>
                    </div>
                {:else if active_tab === 'question'}
                    <div class="space-y-3">
                        <p class="text-sm text-(--text-secondary)">
                            Create a question node to explore logical inquiries. Questions help
                            identify gaps and guide reasoning.
                        </p>
                        <ul class="space-y-1 text-sm text-(--text-tertiary)">
                            <li>• Mark questions as answered or unanswered</li>
                            <li>• Link to statements that answer them</li>
                            <li>• Track your reasoning process</li>
                        </ul>
                    </div>
                {:else}
                    <div class="space-y-3">
                        <p class="text-sm text-(--text-secondary)">
                            Create a connection between statements to show logical relationships.
                            Connections represent how ideas flow and support each other.
                        </p>
                        <ul class="space-y-1 text-sm text-(--text-tertiary)">
                            <li>• Choose from multiple connection types</li>
                            <li>• Add labels for clarity</li>
                            <li>• Build complex argument structures</li>
                        </ul>
                    </div>
                {/if}
            </div>

            <!-- Action Button -->
            <Button
                variant="primary"
                size="md"
                class="w-full"
                on_click={() => {
                    if (active_tab === 'statement') handle_create_statement();
                    else if (active_tab === 'question') handle_create_question();
                    else handle_create_connection();
                }}
            >
                Create {active_tab === 'statement'
                    ? 'Statement'
                    : active_tab === 'question'
                      ? 'Question'
                      : 'Connection'}
            </Button>
        </div>
    </div>
{/if}
