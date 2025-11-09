<script lang="ts">
    import {
        search_store,
        SearchFilterType,
        CONNECTION_TYPE_FILTER_VALUE
    } from '$lib/stores/search.svelte';
    import { graph_store } from '$lib/stores/graph.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { ConnectionType } from '$lib/types/graph';
    import type { LogicNode, LogicConnection } from '$lib/types/graph';
    import {
        X,
        Circle,
        Link2,
        ArrowRight,
        ArrowLeftRight,
        ListFilter,
        CircleDot
    } from '@lucide/svelte';

    let search_results = $derived.by(() => {
        const query = search_store.query.toLowerCase().trim();
        if (!query) return { nodes: [], connections: [] };

        const nodes = graph_store.nodes.filter((node) => {
            if (search_store.filter_type === SearchFilterType.CONNECTIONS) return false;
            const matches_query =
                node.name.toLowerCase().includes(query) ||
                node.description.toLowerCase().includes(query) ||
                node.id.toLowerCase().includes(query);
            return matches_query;
        });

        const connections = graph_store.connections.filter((conn) => {
            if (search_store.filter_type === SearchFilterType.NODES) return false;
            if (
                search_store.connection_type_filter !== CONNECTION_TYPE_FILTER_VALUE.ALL &&
                conn.type !== search_store.connection_type_filter
            ) {
                return false;
            }
            const matches_query = conn.id.toLowerCase().includes(query);
            return matches_query;
        });

        return { nodes, connections };
    });

    let has_results = $derived(
        search_results.nodes.length > 0 || search_results.connections.length > 0
    );

    function handle_select_node(node: LogicNode) {
        selection_store.select_node(node.id);
    }

    function handle_select_connection(conn: LogicConnection) {
        selection_store.select_connection(conn.id);
    }

    function handle_clear() {
        search_store.clear();
    }
</script>

<div
    class="fixed top-20 right-4 z-900 flex max-h-[calc(100vh-100px)] w-80 animate-[slide-in_0.3s_ease] flex-col rounded-xl border border-(--border-default) bg-(--bg-elevated) shadow-(--shadow-lg) backdrop-blur-md"
>
    <div class="border-b border-(--border-default) p-6">
        <h3 class="m-0 text-base font-semibold text-(--text-primary)">Search & Filter</h3>
    </div>

    <div
        class="flex flex-1 flex-col gap-4 overflow-y-auto p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-(--border-default) [&::-webkit-scrollbar-thumb:hover]:bg-(--border-hover) [&::-webkit-scrollbar-track]:bg-transparent"
    >
        <div class="relative">
            <input
                type="text"
                class="w-full rounded-md border border-(--border-default) bg-(--bg-secondary) px-4 py-2 pr-10 text-sm text-(--text-primary) transition-all duration-200 focus:border-(--accent-primary) focus:bg-(--bg-primary) focus:outline-none"
                placeholder="Search nodes and connections..."
                bind:value={search_store.query}
            />
            {#if search_store.query}
                <button
                    class="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-sm text-(--text-secondary) transition-all duration-200 hover:bg-(--bg-secondary) hover:text-(--text-primary)"
                    onclick={handle_clear}
                    aria-label="Clear search"
                    title="Clear search"
                >
                    <X size={14} />
                </button>
            {/if}
        </div>

        <div class="flex flex-col gap-2">
            <div class="flex flex-col gap-1">
                <span class="text-xs font-medium tracking-wider text-(--text-secondary) uppercase"
                    >Show:</span
                >
                <div class="flex gap-1">
                    <button
                        class="flex flex-1 cursor-pointer items-center justify-center rounded-md border p-2 transition-all duration-200 active:scale-98 {search_store.filter_type ===
                        SearchFilterType.ALL
                            ? 'border-(--accent-primary) bg-(--accent-primary) text-white hover:border-[#6d28d9] hover:bg-[#6d28d9]'
                            : 'border-transparent bg-transparent text-(--text-secondary) hover:border-(--border-hover) hover:bg-(--bg-secondary) hover:text-(--text-primary)'}"
                        onclick={() => (search_store.filter_type = SearchFilterType.ALL)}
                        title="Show All"
                        aria-label="Show All"
                    >
                        <ListFilter size={18} />
                    </button>
                    <button
                        class="flex flex-1 cursor-pointer items-center justify-center rounded-md border p-2 transition-all duration-200 active:scale-98 {search_store.filter_type ===
                        SearchFilterType.NODES
                            ? 'border-(--accent-primary) bg-(--accent-primary) text-white hover:border-[#6d28d9] hover:bg-[#6d28d9]'
                            : 'border-transparent bg-transparent text-(--text-secondary) hover:border-(--border-hover) hover:bg-(--bg-secondary) hover:text-(--text-primary)'}"
                        onclick={() => (search_store.filter_type = SearchFilterType.NODES)}
                        title="Show Nodes Only"
                        aria-label="Show Nodes Only"
                    >
                        <CircleDot size={18} />
                    </button>
                    <button
                        class="flex flex-1 cursor-pointer items-center justify-center rounded-md border p-2 transition-all duration-200 active:scale-98 {search_store.filter_type ===
                        SearchFilterType.CONNECTIONS
                            ? 'border-(--accent-primary) bg-(--accent-primary) text-white hover:border-[#6d28d9] hover:bg-[#6d28d9]'
                            : 'border-transparent bg-transparent text-(--text-secondary) hover:border-(--border-hover) hover:bg-(--bg-secondary) hover:text-(--text-primary)'}"
                        onclick={() => (search_store.filter_type = SearchFilterType.CONNECTIONS)}
                        title="Show Connections Only"
                        aria-label="Show Connections Only"
                    >
                        <Link2 size={18} />
                    </button>
                </div>
            </div>

            {#if search_store.filter_type !== SearchFilterType.NODES}
                <div class="flex flex-col gap-1">
                    <span
                        class="text-xs font-medium tracking-wider text-(--text-secondary) uppercase"
                        >Type:</span
                    >
                    <div class="flex gap-1">
                        <button
                            class="flex flex-1 cursor-pointer items-center justify-center rounded-md border p-2 transition-all duration-200 active:scale-98 {search_store.connection_type_filter ===
                            CONNECTION_TYPE_FILTER_VALUE.ALL
                                ? 'border-(--accent-primary) bg-(--accent-primary) text-white hover:border-[#6d28d9] hover:bg-[#6d28d9]'
                                : 'border-transparent bg-transparent text-(--text-secondary) hover:border-(--border-hover) hover:bg-(--bg-secondary) hover:text-(--text-primary)'}"
                            onclick={() =>
                                (search_store.connection_type_filter =
                                    CONNECTION_TYPE_FILTER_VALUE.ALL)}
                            title="All Connection Types"
                            aria-label="All Connection Types"
                        >
                            <ListFilter size={18} />
                        </button>
                        <button
                            class="flex flex-1 cursor-pointer items-center justify-center rounded-md border p-2 transition-all duration-200 active:scale-98 {search_store.connection_type_filter ===
                            CONNECTION_TYPE_FILTER_VALUE.IMPLICATION
                                ? 'border-(--accent-primary) bg-(--accent-primary) text-white hover:border-[#6d28d9] hover:bg-[#6d28d9]'
                                : 'border-transparent bg-transparent text-(--text-secondary) hover:border-(--border-hover) hover:bg-(--bg-secondary) hover:text-(--text-primary)'}"
                            onclick={() =>
                                (search_store.connection_type_filter =
                                    CONNECTION_TYPE_FILTER_VALUE.IMPLICATION)}
                            title="Implications Only"
                            aria-label="Implications Only"
                        >
                            <ArrowRight size={18} />
                        </button>
                        <button
                            class="flex flex-1 cursor-pointer items-center justify-center rounded-md border p-2 transition-all duration-200 active:scale-98 {search_store.connection_type_filter ===
                            CONNECTION_TYPE_FILTER_VALUE.CONTRADICTION
                                ? 'border-(--accent-primary) bg-(--accent-primary) text-white hover:border-[#6d28d9] hover:bg-[#6d28d9]'
                                : 'border-transparent bg-transparent text-(--text-secondary) hover:border-(--border-hover) hover:bg-(--bg-secondary) hover:text-(--text-primary)'}"
                            onclick={() =>
                                (search_store.connection_type_filter =
                                    CONNECTION_TYPE_FILTER_VALUE.CONTRADICTION)}
                            title="Contradictions Only"
                            aria-label="Contradictions Only"
                        >
                            <ArrowLeftRight size={18} />
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        {#if search_store.query}
            <div class="flex flex-col gap-4">
                {#if has_results}
                    {#if search_results.nodes.length > 0}
                        <div class="flex flex-col gap-2">
                            <h4 class="m-0 text-sm font-semibold text-(--text-primary)">
                                Nodes ({search_results.nodes.length})
                            </h4>
                            <div class="flex flex-col gap-1">
                                {#each search_results.nodes as node}
                                    <button
                                        class="flex w-full cursor-pointer items-start gap-2 rounded-md border border-(--border-default) bg-(--bg-secondary) p-2 text-left transition-all duration-200 hover:border-(--accent-primary) hover:bg-(--bg-primary)"
                                        onclick={() => handle_select_node(node)}
                                    >
                                        <span
                                            class="shrink-0 text-base leading-none text-(--node-default)"
                                            >●</span
                                        >
                                        <div class="min-w-0 flex-1">
                                            <div
                                                class="mb-0.5 text-sm font-medium text-(--text-primary)"
                                            >
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
                                {/each}
                            </div>
                        </div>
                    {/if}

                    {#if search_results.connections.length > 0}
                        <div class="flex flex-col gap-2">
                            <h4 class="m-0 text-sm font-semibold text-(--text-primary)">
                                Connections ({search_results.connections.length})
                            </h4>
                            <div class="flex flex-col gap-1">
                                {#each search_results.connections as conn}
                                    <button
                                        class="flex w-full cursor-pointer items-start gap-2 rounded-md border border-(--border-default) bg-(--bg-secondary) p-2 text-left transition-all duration-200 hover:border-(--accent-primary) hover:bg-(--bg-primary)"
                                        onclick={() => handle_select_connection(conn)}
                                    >
                                        <span
                                            class="shrink-0 text-xl leading-none {conn.type ===
                                            ConnectionType.IMPLICATION
                                                ? 'text-(--link-implication)'
                                                : 'text-(--link-contradiction)'}"
                                        >
                                            {conn.type === ConnectionType.IMPLICATION ? '→' : '⟷'}
                                        </span>
                                        <div class="min-w-0 flex-1">
                                            <div
                                                class="mb-0.5 text-sm font-medium text-(--text-primary)"
                                            >
                                                {conn.sources.length} source(s) → {conn.targets
                                                    .length} target(s)
                                            </div>
                                            <div
                                                class="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-(--text-tertiary)"
                                            >
                                                {conn.id}
                                            </div>
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/if}
                {:else}
                    <div class="p-6 text-center text-sm text-(--text-tertiary)">
                        <p>No results found for "{search_store.query}"</p>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    @keyframes slide-in {
        from {
            opacity: 0;
            transform: translateX(20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        div:first-child {
            width: 100%;
            max-width: 320px;
            right: 50%;
            transform: translateX(50%);
        }
    }
</style>
