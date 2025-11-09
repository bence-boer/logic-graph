<script lang="ts">
    import {
        search_store,
        SearchFilterType,
        CONNECTION_TYPE_FILTER_VALUE
    } from '$lib/stores/search.svelte';
    import { graph_store } from '$lib/stores/graph.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import type { LogicNode, LogicConnection } from '$lib/types/graph';
    import { search_graph } from '$lib/utils/search';
    import { SearchInput, SearchFilters, SearchResults } from './SearchPanel';

    let search_results = $derived.by(() => {
        return search_graph(
            { nodes: graph_store.nodes, connections: graph_store.connections },
            {
                query: search_store.query,
                filter_type: search_store.filter_type,
                connection_type_filter: search_store.connection_type_filter
            }
        );
    });

    function handle_query_change(value: string) {
        search_store.query = value;
    }

    function handle_clear() {
        search_store.clear();
    }

    function handle_filter_change(filter: SearchFilterType) {
        search_store.filter_type = filter;
    }

    function handle_connection_type_change(
        type: (typeof CONNECTION_TYPE_FILTER_VALUE)[keyof typeof CONNECTION_TYPE_FILTER_VALUE]
    ) {
        search_store.connection_type_filter = type;
    }

    function handle_select_node(node: LogicNode) {
        selection_store.select_node(node.id);
    }

    function handle_select_connection(conn: LogicConnection) {
        selection_store.select_connection(conn.id);
    }

    function close_panel() {
        ui_store.toggle_search_panel();
    }
</script>

<!-- Mobile backdrop overlay -->
<button
    class="fixed inset-0 z-890 hidden bg-black/50 backdrop-blur-sm max-md:block"
    onclick={close_panel}
    aria-label="Close search panel"
></button>

<div
    class="fixed top-20 right-4 z-900 flex max-h-[calc(100vh-100px)] w-80 animate-[slide-in_0.3s_ease] flex-col rounded-xl border border-(--border-default) bg-(--bg-elevated) shadow-(--shadow-lg) backdrop-blur-md max-md:left-1/2 max-md:top-1/2 max-md:right-auto max-md:h-[90vh] max-md:max-h-[600px] max-md:w-[90vw] max-md:max-w-md max-md:-translate-x-1/2 max-md:-translate-y-1/2"
>
    <div class="border-b border-(--border-default) p-6">
        <div class="flex items-center justify-between">
            <h3 class="m-0 text-base font-semibold text-(--text-primary)">Search & Filter</h3>
            <!-- Mobile close button -->
            <button
                class="hidden h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-(--bg-secondary) text-(--text-primary) transition-all duration-200 hover:bg-(--border-hover) max-md:flex"
                onclick={close_panel}
                aria-label="Close search panel"
            >
                ✕
            </button>
        </div>
    </div>

    <div
        class="flex flex-1 flex-col gap-4 overflow-y-auto p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-(--border-default) [&::-webkit-scrollbar-thumb:hover]:bg-(--border-hover) [&::-webkit-scrollbar-track]:bg-transparent"
    >
        <SearchInput
            bind:value={search_store.query}
            onchange={handle_query_change}
            onclear={handle_clear}
        />

        <SearchFilters
            filter_type={search_store.filter_type}
            connection_type_filter={search_store.connection_type_filter}
            on_filter_change={handle_filter_change}
            on_connection_type_change={handle_connection_type_change}
        />

        <SearchResults
            nodes={search_results.nodes}
            connections={search_results.connections}
            query={search_store.query}
            on_select_node={handle_select_node}
            on_select_connection={handle_select_connection}
        />
    </div>
</div>
