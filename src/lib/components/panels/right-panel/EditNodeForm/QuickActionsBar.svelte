<script lang="ts">
    import { Pin, PinOff, Trash2 } from '@lucide/svelte';
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
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-tertiary) active:scale-98"
        onclick={onpin_toggle}
        title={is_pinned ? 'Unpin Statement' : 'Pin Statement'}
        aria-label={is_pinned ? 'Unpin Statement' : 'Pin Statement'}
    >
        {#if is_pinned}
            <PinOff size={18} />
        {:else}
            <Pin size={18} />
        {/if}
    </button>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--accent-secondary) transition-all duration-200 hover:border-(--accent-secondary) hover:bg-[rgba(239,68,68,0.1)] active:scale-98"
        onclick={ondelete}
        title="Delete Statement"
        aria-label="Delete Statement"
    >
        <Trash2 size={18} />
    </button>
</div>
