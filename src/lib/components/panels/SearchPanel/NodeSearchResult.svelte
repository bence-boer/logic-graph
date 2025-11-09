<script lang="ts">
    import type { LogicNode } from '$lib/types/graph';

    interface Props {
        node: LogicNode;
        onselect: (node: LogicNode) => void;
    }

    let { node, onselect }: Props = $props();
</script>

<button
    class="flex w-full cursor-pointer items-start gap-2 rounded-md border border-(--border-default) bg-(--bg-secondary) p-2 text-left transition-all duration-200 hover:border-(--accent-primary) hover:bg-(--bg-primary)"
    onclick={() => onselect(node)}
>
    <span class="shrink-0 text-base leading-none text-(--node-default)">●</span>
    <div class="min-w-0 flex-1">
        <div class="mb-0.5 text-sm font-medium text-(--text-primary)">
            {node.name}
        </div>
        {#if node.description}
            <div
                class="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-(--text-tertiary)"
            >
                {node.description}
            </div>
        {/if}
    </div>
</button>
