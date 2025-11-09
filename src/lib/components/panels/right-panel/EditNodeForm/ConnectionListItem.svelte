<script lang="ts">
    import { Trash2 } from '@lucide/svelte';
    import type { LogicNode } from '$lib/types/graph';

    interface Props {
        node: LogicNode;
        symbol: string;
        symbol_color: string;
        onclick: () => void;
        ondelete: () => void;
    }

    let { node, symbol, symbol_color, onclick, ondelete }: Props = $props();
</script>

<div
    class="flex items-center gap-2 rounded-md bg-(--bg-secondary) transition-colors duration-200 hover:bg-(--bg-tertiary)"
>
    <button class="flex flex-1 cursor-pointer items-center gap-2 px-3 py-2 text-left" {onclick}>
        <span class="text-lg leading-none {symbol_color}">{symbol}</span>
        <span class="text-sm text-(--text-primary)">{node.name}</span>
    </button>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-tertiary) transition-all duration-200 hover:text-(--accent-secondary) active:scale-98"
        onclick={ondelete}
        title="Delete connection"
        aria-label="Delete connection"
    >
        <Trash2 size={14} />
    </button>
</div>
