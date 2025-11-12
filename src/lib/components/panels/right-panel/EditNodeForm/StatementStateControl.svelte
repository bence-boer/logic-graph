<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';
    import type { LogicNode } from '$lib/types/graph';
    import { StatementState } from '$lib/types/graph';

    interface Props {
        node: LogicNode;
    }

    let { node }: Props = $props();

    let current_state = $derived(node.statement_state || StatementState.DEBATED);

    function set_state(state: StatementState) {
        graph_store.set_statement_state(node.id, state);
    }

    let debated_classes = $derived(
        current_state === StatementState.DEBATED
            ? 'bg-neutral-500/20 border-neutral-500 text-neutral-300 font-semibold'
            : 'bg-transparent border-neutral-700 text-neutral-400 hover:border-neutral-600'
    );

    let settled_classes = $derived(
        current_state === StatementState.SETTLED
            ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-semibold'
            : 'bg-transparent border-neutral-700 text-neutral-400 hover:border-neutral-600'
    );
</script>

<FormField label="Axiom State">
    <div
        class="mb-2 rounded-md border border-(--border-default) bg-(--bg-secondary) p-2.5 text-xs text-(--text-tertiary)"
    >
        This is an axiom (no supporting reasons)
    </div>

    <div class="flex gap-2">
        <button
            class="flex-1 rounded-md border px-4 py-2 text-sm transition-all duration-200 {debated_classes}"
            onclick={() => set_state(StatementState.DEBATED)}
            type="button"
        >
            Debated
        </button>
        <button
            class="flex-1 rounded-md border px-4 py-2 text-sm transition-all duration-200 {settled_classes}"
            onclick={() => set_state(StatementState.SETTLED)}
            type="button"
        >
            Settled
        </button>
    </div>

    <p class="mt-1.5 text-xs text-(--text-tertiary)">
        {#if current_state === StatementState.SETTLED}
            This statement is accepted as foundational
        {:else}
            This statement is still under discussion
        {/if}
    </p>
</FormField>
