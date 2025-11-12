<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import type { LogicNode } from '$lib/types/graph';
    import { get_question_ids_for_statement } from '$lib/utils/answer-management';
    import { ArrowRight, HelpCircle } from '@lucide/svelte';

    interface Props {
        node: LogicNode;
    }

    let { node }: Props = $props();

    let question_ids = $derived(get_question_ids_for_statement(node.id, graph_store.connections));

    let question_nodes = $derived(
        question_ids
            .map((id) => graph_store.nodes.find((n) => n.id === id))
            .filter((n): n is LogicNode => n !== undefined)
    );

    function navigate_to_question(question_id: string) {
        ui_store.open_edit_question_form(question_id);
    }
</script>

<div class="flex flex-col gap-3">
    <h4 class="m-0 text-sm font-semibold text-(--text-secondary)">
        Answers Questions ({question_nodes.length})
    </h4>

    {#if question_nodes.length > 0}
        <div class="flex flex-col gap-2">
            {#each question_nodes as question_node (question_node.id)}
                <button
                    class="flex cursor-pointer items-start gap-2 rounded-md border border-(--border-default) bg-(--bg-secondary) p-2.5 text-left transition-colors hover:border-(--border-hover) hover:bg-(--bg-tertiary)"
                    onclick={() => navigate_to_question(question_node.id)}
                    type="button"
                >
                    <HelpCircle size={14} class="mt-0.5 shrink-0 text-amber-500" />
                    <p class="m-0 flex-1 text-sm wrap-break-word text-(--text-secondary)">
                        {question_node.statement}
                    </p>
                    <ArrowRight size={14} class="mt-0.5 shrink-0 text-(--text-tertiary)" />
                </button>
            {/each}
        </div>
    {:else}
        <div class="rounded-md border border-(--border-default) bg-(--bg-secondary) p-3">
            <p class="m-0 text-sm text-(--text-tertiary)">
                This statement doesn't answer any questions yet.
            </p>
        </div>
    {/if}
</div>
