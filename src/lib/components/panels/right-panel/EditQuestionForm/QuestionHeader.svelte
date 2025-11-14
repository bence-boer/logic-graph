<script lang="ts">
    import { X } from '@lucide/svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import type { LogicNode } from '$lib/types/graph';
    import { is_question_resolved } from '$lib/utils/graph-helpers';

    interface Props {
        node: LogicNode;
        onclose: () => void;
    }

    let { node, onclose }: Props = $props();

    let is_resolved = $derived(is_question_resolved(node));
    let state_label = $derived(is_resolved ? 'Resolved' : 'Active');
    let badge_classes = $derived(
        is_resolved
            ? 'bg-neutral-500/20 text-white border-neutral-500/30'
            : 'bg-amber-500/20 text-white border-amber-500/30'
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
    <Button size="sm" icon on_click={onclose}>
        <X size={14} />
    </Button>
</div>
