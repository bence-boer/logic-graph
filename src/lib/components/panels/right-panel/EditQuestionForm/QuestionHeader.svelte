<script lang="ts">
    import { X } from '@lucide/svelte';
    import type { LogicNode } from '$lib/types/graph';
    import { QuestionState } from '$lib/types/graph';

    interface Props {
        node: LogicNode;
        onclose: () => void;
    }

    let { node, onclose }: Props = $props();

    let state_label = $derived(
        node.question_state === QuestionState.ACTIVE ? 'Active' : 'Resolved'
    );

    let badge_classes = $derived(
        node.question_state === QuestionState.ACTIVE
            ? 'bg-amber-500/20 text-white border-amber-500/30'
            : 'bg-neutral-500/20 text-white border-neutral-500/30'
    );
</script>

<div class="flex items-center justify-between border-b border-(--border-default) p-3">
    <div class="flex items-center gap-2.5">
        <h3 class="m-0 text-lg font-semibold text-(--text-primary)">Edit Question</h3>
        <span
            class="rounded-md border px-2 py-0.5 text-xs font-medium {badge_classes}"
            title="Question State"
        >
            {state_label}
        </span>
    </div>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
        onclick={onclose}
        aria-label="Close"
        title="Close"
    >
        <X size={18} />
    </button>
</div>
