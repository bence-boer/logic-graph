<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { notification_store } from '$lib/stores/notification.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import type { LogicNode, LogicConnection } from '$lib/types/graph';
    import { ConnectionType } from '$lib/types/graph';
    import { is_statement_node } from '$lib/utils/node-classification';
    import { can_link_as_answer } from '$lib/utils/answer-management';
    import { CheckCircle2, X, ArrowRight, Zap } from '@lucide/svelte';

    interface Props {
        node: LogicNode;
    }

    let { node }: Props = $props();

    // Get non-answer connections from this question to statement nodes
    let linked_statements = $derived(
        graph_store.connections
            .filter((conn) => {
                if (conn.type === ConnectionType.ANSWER) return false;
                return conn.sources.includes(node.id) || conn.targets.includes(node.id);
            })
            .map((conn) => {
                // Find the other node in the connection
                const other_node_id = conn.sources.includes(node.id)
                    ? conn.targets[0]
                    : conn.sources[0];
                const other_node = graph_store.nodes.find((n) => n.id === other_node_id);

                return {
                    connection: conn,
                    node: other_node,
                    is_statement: other_node ? is_statement_node(other_node) : false
                };
            })
            .filter((item) => item.node && item.is_statement)
    );

    let has_current_answer = $derived(!!node.answered_by);
    let show_replace_confirmation = $state(false);
    let pending_answer_id = $state<string | null>(null);

    function mark_as_answer(statement_id: string) {
        if (
            !can_link_as_answer(
                node,
                graph_store.nodes.find((n) => n.id === statement_id)
            )
        ) {
            notification_store.error('Cannot link this node as answer');
            return;
        }

        if (has_current_answer) {
            pending_answer_id = statement_id;
            show_replace_confirmation = true;
        } else {
            link_answer(statement_id);
        }
    }

    function link_answer(answer_id: string) {
        graph_store.set_answer(node.id, answer_id);
        notification_store.success('Marked as answer');
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

    function remove_connection(connection_id: string) {
        graph_store.remove_connection(connection_id);
        notification_store.success('Connection removed');
    }

    function navigate_to_node(node_id: string) {
        ui_store.open_edit_node_form(node_id);
    }

    function get_connection_color(connection_type: ConnectionType) {
        return connection_type === ConnectionType.CONTRADICTION
            ? 'text-(--link-contradiction)'
            : 'text-(--link-implication)';
    }

    let current_answer_node = $derived(
        node.answered_by ? graph_store.nodes.find((n) => n.id === node.answered_by) : undefined
    );
    let pending_answer_node = $derived(
        pending_answer_id ? graph_store.nodes.find((n) => n.id === pending_answer_id) : undefined
    );
</script>

<div class="flex flex-col gap-3">
    <h4 class="m-0 text-sm font-semibold text-(--text-secondary)">Linked Statements</h4>

    {#if linked_statements.length > 0}
        <div class="flex flex-col gap-2">
            {#each linked_statements as { connection, node: stmt_node }}
                {#if stmt_node}
                    <div
                        class="flex items-start gap-2 rounded-md border border-(--border-default) bg-(--bg-secondary) p-2.5"
                    >
                        {#if connection.type === ConnectionType.CONTRADICTION}
                            <Zap
                                size={14}
                                class="mt-0.5 shrink-0 {get_connection_color(connection.type)}"
                            />
                        {:else}
                            <ArrowRight
                                size={14}
                                class="mt-0.5 shrink-0 {get_connection_color(connection.type)}"
                            />
                        {/if}
                        <button
                            class="flex-1 cursor-pointer overflow-hidden text-left transition-colors hover:text-(--text-primary)"
                            onclick={() => navigate_to_node(stmt_node.id)}
                            type="button"
                        >
                            <p class="m-0 text-sm wrap-break-word text-(--text-secondary)">
                                {stmt_node.statement}
                            </p>
                        </button>
                        <div class="flex shrink-0 gap-1">
                            <button
                                class="rounded p-1.5 text-green-500 transition-colors hover:bg-green-500/10"
                                onclick={() => mark_as_answer(stmt_node.id)}
                                title="Mark as answer"
                                type="button"
                            >
                                <CheckCircle2 size={14} />
                            </button>
                            <button
                                class="rounded p-1.5 text-red-500 transition-colors hover:bg-red-500/10"
                                onclick={() => remove_connection(connection.id!)}
                                title="Remove connection"
                                type="button"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                {/if}
            {/each}
        </div>
    {:else}
        <div class="rounded-md border border-(--border-default) bg-(--bg-secondary) p-3">
            <p class="m-0 text-sm text-(--text-tertiary)">No linked statements</p>
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
                Replace existing answer?
            </h3>

            <div class="mb-4 space-y-3">
                <div>
                    <p class="mb-1 text-xs font-medium text-(--text-tertiary)">Current answer:</p>
                    <p class="text-sm text-(--text-secondary)">{current_answer_node.statement}</p>
                </div>

                <div>
                    <p class="mb-1 text-xs font-medium text-(--text-tertiary)">New answer:</p>
                    <p class="text-sm text-(--text-secondary)">{pending_answer_node.statement}</p>
                </div>
            </div>

            <p class="mb-6 text-sm text-(--text-tertiary)">
                The current answer will be unlinked. The statement will remain in the graph.
            </p>

            <div class="flex justify-end gap-2">
                <Button onclick={cancel_replace} variant="secondary" size="sm">
                    {#snippet children()}
                        Cancel
                    {/snippet}
                </Button>
                <Button onclick={confirm_replace} variant="primary" size="sm">
                    {#snippet children()}
                        Replace Answer
                    {/snippet}
                </Button>
            </div>
        </div>
    </div>
{/if}
