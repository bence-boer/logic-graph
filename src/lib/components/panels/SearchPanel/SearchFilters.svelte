<script lang="ts">
    import { SearchFilterType, CONNECTION_TYPE_FILTER_VALUE } from '$lib/stores/search.svelte';
    import { ConnectionType } from '$lib/types/graph';
    import { ListFilter, CircleDot, Link2, ArrowRight, ArrowLeftRight } from '@lucide/svelte';

    interface Props {
        filter_type: SearchFilterType;
        connection_type_filter: ConnectionType | typeof CONNECTION_TYPE_FILTER_VALUE.ALL;
        on_filter_change: (filter: SearchFilterType) => void;
        on_connection_type_change: (
            type: ConnectionType | typeof CONNECTION_TYPE_FILTER_VALUE.ALL
        ) => void;
    }

    let {
        filter_type,
        connection_type_filter,
        on_filter_change,
        on_connection_type_change
    }: Props = $props();
</script>

<div class="flex flex-col gap-2">
    <div class="flex flex-col gap-1">
        <span class="text-xs font-medium tracking-wider text-(--text-secondary) uppercase"
            >Show:</span
        >
        <div class="flex gap-1">
            <button
                class="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border px-2 py-1.5 transition-all duration-200 active:scale-98 {filter_type ===
                SearchFilterType.ALL
                    ? 'border-(--accent-primary) bg-(--accent-primary) text-white hover:border-accent-700 hover:bg-accent-700'
                    : 'border-transparent bg-transparent text-(--text-secondary) hover:border-(--border-hover) hover:bg-(--bg-secondary) hover:text-(--text-primary)'}"
                onclick={() => on_filter_change(SearchFilterType.ALL)}
                type="button"
                title="Show All"
                aria-label="Show All"
            >
                <ListFilter size={14} />
                <span class="text-xs font-medium">All</span>
            </button>
            <button
                class="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border px-2 py-1.5 transition-all duration-200 active:scale-98 {filter_type ===
                SearchFilterType.NODES
                    ? 'border-(--accent-primary) bg-(--accent-primary) text-white hover:border-accent-700 hover:bg-accent-700'
                    : 'border-transparent bg-transparent text-(--text-secondary) hover:border-(--border-hover) hover:bg-(--bg-secondary) hover:text-(--text-primary)'}"
                onclick={() => on_filter_change(SearchFilterType.NODES)}
                type="button"
                title="Show Nodes Only"
                aria-label="Show Nodes Only"
            >
                <CircleDot size={14} />
                <span class="text-xs font-medium">Nodes</span>
            </button>
            <button
                class="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border px-2 py-1.5 transition-all duration-200 active:scale-98 {filter_type ===
                SearchFilterType.CONNECTIONS
                    ? 'border-(--accent-primary) bg-(--accent-primary) text-white hover:border-accent-700 hover:bg-accent-700'
                    : 'border-transparent bg-transparent text-(--text-secondary) hover:border-(--border-hover) hover:bg-(--bg-secondary) hover:text-(--text-primary)'}"
                onclick={() => on_filter_change(SearchFilterType.CONNECTIONS)}
                type="button"
                title="Show Connections Only"
                aria-label="Show Connections Only"
            >
                <Link2 size={14} />
                <span class="text-xs font-medium">Links</span>
            </button>
        </div>
    </div>

    {#if filter_type !== SearchFilterType.NODES}
        <div class="flex flex-col gap-1">
            <span class="text-xs font-medium tracking-wider text-(--text-secondary) uppercase"
                >Type:</span
            >
            <div class="flex gap-1">
                <button
                    class="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border px-2 py-1.5 transition-all duration-200 active:scale-98 {connection_type_filter ===
                    CONNECTION_TYPE_FILTER_VALUE.ALL
                        ? 'border-(--accent-primary) bg-(--accent-primary) text-white hover:border-accent-700 hover:bg-accent-700'
                        : 'border-transparent bg-transparent text-(--text-secondary) hover:border-(--border-hover) hover:bg-(--bg-secondary) hover:text-(--text-primary)'}"
                    onclick={() => on_connection_type_change(CONNECTION_TYPE_FILTER_VALUE.ALL)}
                    type="button"
                    title="All Connection Types"
                    aria-label="All Connection Types"
                >
                    <ListFilter size={14} />
                    <span class="text-xs font-medium">All</span>
                </button>
                <button
                    class="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border px-2 py-1.5 transition-all duration-200 active:scale-98 {connection_type_filter ===
                    CONNECTION_TYPE_FILTER_VALUE.IMPLICATION
                        ? 'border-(--accent-primary) bg-(--accent-primary) text-white hover:border-accent-700 hover:bg-accent-700'
                        : 'border-transparent bg-transparent text-(--text-secondary) hover:border-(--border-hover) hover:bg-(--bg-secondary) hover:text-(--text-primary)'}"
                    onclick={() =>
                        on_connection_type_change(CONNECTION_TYPE_FILTER_VALUE.IMPLICATION)}
                    type="button"
                    title="Implications Only"
                    aria-label="Implications Only"
                >
                    <ArrowRight size={14} />
                    <span class="text-xs font-medium">Implies</span>
                </button>
                <button
                    class="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border px-2 py-1.5 transition-all duration-200 active:scale-98 {connection_type_filter ===
                    CONNECTION_TYPE_FILTER_VALUE.CONTRADICTION
                        ? 'border-(--accent-primary) bg-(--accent-primary) text-white hover:border-accent-700 hover:bg-accent-700'
                        : 'border-transparent bg-transparent text-(--text-secondary) hover:border-(--border-hover) hover:bg-(--bg-secondary) hover:text-(--text-primary)'}"
                    onclick={() =>
                        on_connection_type_change(CONNECTION_TYPE_FILTER_VALUE.CONTRADICTION)}
                    type="button"
                    title="Contradictions Only"
                    aria-label="Contradictions Only"
                >
                    <ArrowLeftRight size={14} />
                    <span class="text-xs font-medium">Conflicts</span>
                </button>
            </div>
        </div>
    {/if}
</div>
