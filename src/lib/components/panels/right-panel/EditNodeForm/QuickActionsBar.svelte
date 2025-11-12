<script lang="ts">
    import { Pin, PinOff, Trash2 } from '@lucide/svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import type { LogicNode } from '$lib/types/graph';

    interface Props {
        node: LogicNode;
        onpin_toggle: () => void;
        ondelete: () => void;
    }

    let { node, onpin_toggle, ondelete }: Props = $props();

    let is_pinned = $derived(node.fx !== null && node.fx !== undefined);
</script>

<div
    class="flex items-center gap-2 rounded-md border border-(--border-default) bg-(--bg-secondary) px-3 py-2"
>
    <span class="flex-1 text-sm font-medium text-(--text-secondary)">Quick Actions</span>
    <Button size="sm" icon onclick={onpin_toggle}>
        {#if is_pinned}
            <PinOff size={14} />
        {:else}
            <Pin size={14} />
        {/if}
    </Button>
    <Button variant="danger" size="sm" icon onclick={ondelete}>
        <Trash2 size={14} />
    </Button>
</div>
