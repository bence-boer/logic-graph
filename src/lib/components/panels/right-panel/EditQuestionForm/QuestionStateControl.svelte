<script lang="ts">
    import { command_executor } from '$lib/commands';
    import { toggle_question_state_command } from '$lib/commands/graph/toggle-question-state';
    import FormField from '$lib/components/ui/FormField.svelte';
    import type { LogicNode } from '$lib/types/graph';
    import { QuestionState } from '$lib/types/graph';

    interface Props {
        node: LogicNode;
    }

    let { node }: Props = $props();

    let current_state = $derived(node.question_state || QuestionState.ACTIVE);

    async function set_state(state: QuestionState) {
        // Use command to ensure manual_state_override is set
        await command_executor.execute(toggle_question_state_command.id, {
            question_id: node.id,
            target_state: state
        });
    }

    let active_classes = $derived(
        current_state === QuestionState.ACTIVE
            ? 'bg-amber-500/20 border-amber-500 text-white font-semibold'
            : 'bg-transparent border-neutral-700 text-neutral-400 hover:border-neutral-600'
    );

    let resolved_classes = $derived(
        current_state === QuestionState.RESOLVED
            ? 'bg-neutral-500/20 border-neutral-500 text-white font-semibold'
            : 'bg-transparent border-neutral-700 text-neutral-400 hover:border-neutral-600'
    );
</script>

<FormField label="Question State">
    <div class="flex gap-2">
        <button
            class="flex-1 rounded-md border px-4 py-2 text-sm transition-all duration-200 {active_classes}"
            onclick={() => set_state(QuestionState.ACTIVE)}
            type="button"
        >
            Active
        </button>
        <button
            class="flex-1 rounded-md border px-4 py-2 text-sm transition-all duration-200 {resolved_classes}"
            onclick={() => set_state(QuestionState.RESOLVED)}
            type="button"
        >
            Resolved
        </button>
    </div>
    <p class="mt-1.5 text-xs text-(--text-tertiary)">
        {#if current_state === QuestionState.ACTIVE}
            This question is still under investigation
        {:else}
            This question has been answered
        {/if}
    </p>
</FormField>
