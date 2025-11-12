<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { notification_store } from '$lib/stores/notification.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Select from '$lib/components/ui/Select.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import type { LogicNode } from '$lib/types/graph';
    import { NodeType, ConnectionType } from '$lib/types/graph';
    import { is_statement_node } from '$lib/utils/node-classification';
    import { can_link_as_answer } from '$lib/utils/answer-management';
    import { CheckCircle2, X, Link, Plus } from '@lucide/svelte';

    interface Props {
        node: LogicNode;
    }

    let { node }: Props = $props();

    // Get current answer
    let current_answer_id = $derived(node.answered_by);
    let current_answer_node = $derived(
        current_answer_id ? graph_store.nodes.find((n) => n.id === current_answer_id) : undefined
    );

    // Get available statements (excluding current answer)
    let available_statements = $derived(
        graph_store.nodes.filter(
            (n) => is_statement_node(n) && n.id !== current_answer_id && can_link_as_answer(node, n)
        )
    );

    // UI state
    let is_linking = $state(false);
    let is_creating = $state(false);
    let selected_statement_id = $state('');
    let new_statement_text = $state('');
    let show_replace_confirmation = $state(false);
    let pending_answer_id = $state<string | null>(null);

    function start_linking() {
        is_linking = true;
        selected_statement_id = '';
    }

    function cancel_linking() {
        is_linking = false;
        selected_statement_id = '';
    }

    function handle_link_answer() {
        if (!selected_statement_id) return;

        if (current_answer_id) {
            // Show confirmation dialog
            pending_answer_id = selected_statement_id;
            show_replace_confirmation = true;
        } else {
            // No existing answer, link directly
            link_answer(selected_statement_id);
        }
    }

    function link_answer(answer_id: string) {
        // Ensure an ANSWER connection exists (question -> statement)
        const existing = graph_store.connections.find(
            (c) =>
                c.type === ConnectionType.ANSWER &&
                c.sources.includes(node.id) &&
                c.targets.includes(answer_id)
        );

        if (!existing) {
            graph_store.add_connection({
                type: ConnectionType.ANSWER,
                sources: [node.id],
                targets: [answer_id]
            });
        }

        // Mark as accepted answer
        graph_store.set_answer(node.id, answer_id);
        notification_store.success('Answer accepted');
        cancel_linking();
        show_replace_confirmation = false;
        pending_answer_id = null;
    }

    function confirm_replace() {
        if (pending_answer_id) {
            link_answer(pending_answer_id);
        }
    }

    function cancel_replace() {
        show_replace_confirmation = false;
        pending_answer_id = null;
    }

    function unlink_answer() {
        graph_store.set_answer(node.id, null);
        notification_store.success('Accepted answer cleared');
    }

    function start_creating() {
        is_creating = true;
        new_statement_text = '';
    }

    function cancel_creating() {
        is_creating = false;
        new_statement_text = '';
    }

    function handle_quick_answer() {
        if (!new_statement_text.trim()) {
            notification_store.error('Statement cannot be empty');
            return;
        }

        // Create new statement node
        const new_node = graph_store.add_node({
            statement: new_statement_text.trim(),
            type: NodeType.STATEMENT
        });

        // Create ANSWER connection (question -> statement)
        graph_store.add_connection({
            type: ConnectionType.ANSWER,
            sources: [node.id],
            targets: [new_node.id]
        });

        // Mark as accepted answer
        graph_store.set_answer(node.id, new_node.id);
        notification_store.success('Answer created and accepted');

        cancel_creating();
    }

    function navigate_to_answer() {
        if (current_answer_id) {
            ui_store.open_edit_node_form(current_answer_id);
        }
    }

    // Get pending node for confirmation dialog
    let pending_answer_node = $derived(
        pending_answer_id ? graph_store.nodes.find((n) => n.id === pending_answer_id) : undefined
    );
</script>

<div class="flex flex-col gap-3">
    <h4 class="m-0 text-sm font-semibold text-(--text-secondary)">Accepted Answer</h4>

    {#if current_answer_node}
        <!-- Current accepted answer display -->
        <div
            class="flex items-start gap-2 rounded-md border border-green-500/30 bg-green-500/10 p-3"
        >
            <CheckCircle2 size={16} class="mt-0.5 shrink-0 text-green-500" />
            <button
                class="flex-1 cursor-pointer overflow-hidden text-left"
                onclick={navigate_to_answer}
                type="button"
            >
                <p class="m-0 text-sm wrap-break-word text-(--text-primary)">
                    {current_answer_node.statement}
                </p>
                {#if current_answer_node.details}
                    <p class="m-0 mt-1 text-xs text-(--text-tertiary)">
                        {current_answer_node.details}
                    </p>
                {/if}
            </button>
            <button
                class="shrink-0 rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
                onclick={unlink_answer}
                title="Clear accepted answer"
                type="button"
            >
                <X size={14} />
            </button>
        </div>
    {:else}
        <!-- No accepted answer yet -->
        <div class="rounded-md border border-(--border-default) bg-(--bg-secondary) p-3">
            <p class="m-0 text-sm text-(--text-tertiary)">No accepted answer yet</p>
        </div>
    {/if}

    <!-- Quick Answer Form -->
    {#if is_creating}
        <div class="flex flex-col gap-2 rounded-md border border-(--border-default) p-3">
            <Input
                bind:value={new_statement_text}
                placeholder="Enter statement to create as answer"
                maxlength={100}
            />
            <div class="flex gap-2">
                <Button onclick={handle_quick_answer} variant="primary" size="sm">
                    Create & Link
                </Button>
                <Button onclick={cancel_creating} variant="secondary" size="sm">Cancel</Button>
            </div>
        </div>
    {:else if is_linking}
        <!-- Link existing statement form -->
        <div class="flex flex-col gap-2 rounded-md border border-(--border-default) p-3">
            <Select
                bind:value={selected_statement_id}
                options={available_statements.map((n) => ({ value: n.id, label: n.statement }))}
                placeholder="Select a statement"
            />
            <div class="flex gap-2">
                <Button
                    onclick={handle_link_answer}
                    variant="primary"
                    size="sm"
                    disabled={!selected_statement_id}
                >
                    Link Answer
                </Button>
                <Button onclick={cancel_linking} variant="secondary" size="sm">Cancel</Button>
            </div>
        </div>
    {:else}
        <!-- Action buttons -->
        <div class="flex gap-2">
            <Button onclick={start_linking} variant="secondary" size="sm">
                <Link size={14} />
                Link Statement
            </Button>
            <Button onclick={start_creating} variant="secondary" size="sm">
                <Plus size={14} />
                Create Statement
            </Button>
        </div>
    {/if}
</div>

<!-- Replace confirmation modal -->
{#if show_replace_confirmation && pending_answer_node && current_answer_node}
    <div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div
            class="w-full max-w-md rounded-lg border border-(--border-default) bg-(--bg-elevated) p-6 shadow-lg"
        >
            <h3 class="mb-4 text-lg font-semibold text-(--text-primary)">
                Replace accepted answer?
            </h3>

            <div class="mb-4 space-y-3">
                <div>
                    <p class="mb-1 text-xs font-medium text-(--text-tertiary)">
                        Current accepted answer:
                    </p>
                    <p class="text-sm text-(--text-secondary)">{current_answer_node.statement}</p>
                </div>

                <div>
                    <p class="mb-1 text-xs font-medium text-(--text-tertiary)">
                        New accepted answer:
                    </p>
                    <p class="text-sm text-(--text-secondary)">{pending_answer_node.statement}</p>
                </div>
            </div>

            <p class="mb-6 text-sm text-(--text-tertiary)">
                The current accepted answer will be cleared. Both statements will remain linked to
                the question.
            </p>

            <div class="flex justify-end gap-2">
                <Button onclick={cancel_replace} variant="secondary" size="sm">Cancel</Button>
                <Button onclick={confirm_replace} variant="primary" size="sm">
                    Accept This Answer
                </Button>
            </div>
        </div>
    </div>
{/if}
