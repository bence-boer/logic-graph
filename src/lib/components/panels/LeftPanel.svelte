<script lang="ts">
    import { ui_store } from '$lib/stores/ui.svelte';
    import { graph_store } from '$lib/stores/graph.svelte';
    import {
        search_store,
        SearchFilterType,
        CONNECTION_TYPE_FILTER_VALUE
    } from '$lib/stores/search.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import type { LogicNode, LogicConnection } from '$lib/types/graph';
    import { search_graph } from '$lib/utils/search';
    import { SearchInput, SearchFilters, SearchResults } from './SearchPanel';

    let is_open = $derived(ui_store.left_panel_open);

    // Editable project name
    let edit_name_value = $state(graph_store.metadata.statement);
    let original_name_value = $state(graph_store.metadata.statement);

    // Watch for external changes to metadata
    $effect(() => {
        const current_metadata = graph_store.metadata.statement;
        if (current_metadata !== original_name_value) {
            edit_name_value = current_metadata;
            original_name_value = current_metadata;
        }
    });

    // Search functionality
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

    function toggle_panel() {
        ui_store.toggle_left_panel();
    }

    function save_name() {
        const trimmed = edit_name_value.trim();
        if (trimmed && trimmed !== original_name_value) {
            graph_store.metadata = {
                ...graph_store.metadata,
                statement: trimmed
            };
            graph_store.update_modified();
            original_name_value = trimmed;
        } else if (!trimmed) {
            // If empty, restore original value
            edit_name_value = original_name_value;
        }
    }

    function cancel_editing() {
        edit_name_value = original_name_value;
    }

    function handle_name_keydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
            (event.target as HTMLInputElement).blur();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            cancel_editing();
            (event.target as HTMLInputElement).blur();
        }
    }

    function handle_name_focus() {
        // Store the current value as the original when focusing
        original_name_value = edit_name_value;
    }

    function handle_name_blur() {
        // Save on blur (unless Escape was pressed, which already restored)
        save_name();
    }

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
        if (conn.id) {
            selection_store.select_connection(conn.id);
        }
    }
</script>

{#if is_open}
    <!-- Mobile backdrop overlay -->
    <button
        class="fixed inset-0 z-890 hidden bg-black/50 backdrop-blur-sm max-md:block"
        onclick={toggle_panel}
        aria-label="Close panel"
    ></button>
{/if}

<div
    class="fixed top-0 bottom-0 left-0 z-900 flex w-80 border border-l-0 border-(--border-default) bg-(--bg-elevated) shadow-(--shadow-sm) backdrop-blur-md transition-transform duration-300 ease-in-out max-md:top-1/2 max-md:left-1/2 max-md:h-[90vh] max-md:max-h-[600px] max-md:w-[90vw] max-md:max-w-md max-md:-translate-x-1/2 max-md:-translate-y-1/2 max-md:rounded-xl max-md:border {is_open
        ? 'translate-x-0 max-md:scale-100 max-md:opacity-100'
        : '-translate-x-80 max-md:pointer-events-none max-md:scale-95 max-md:opacity-0'}"
>
    <button
        class="absolute top-1/2 -right-6 flex h-20 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-tr-lg rounded-br-lg border border-l-0 border-(--border-default) bg-(--bg-elevated) text-sm text-(--text-primary) backdrop-blur-md transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) max-md:hidden"
        onclick={toggle_panel}
        aria-label="Toggle left panel"
    >
        {is_open ? '◀' : '▶'}
    </button>

    {#if is_open}
        <!-- Mobile close button -->
        <button
            class="absolute top-4 right-4 z-10 hidden h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-(--bg-secondary) text-(--text-primary) transition-all duration-200 hover:bg-(--border-hover) max-md:flex"
            onclick={toggle_panel}
            aria-label="Close panel"
        >
            ✕
        </button>

        <div
            class="flex flex-1 flex-col gap-4 overflow-y-auto p-3 max-md:p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-(--border-default) [&::-webkit-scrollbar-thumb:hover]:bg-(--border-hover) [&::-webkit-scrollbar-track]:bg-transparent"
        >
            <!-- Project Name Section (Editable) -->
            <div class="flex flex-col gap-2">
                <h2 class="m-0 text-base font-semibold text-(--text-primary)">Project</h2>
                <div class="flex flex-col gap-2">
                    <input
                        type="text"
                        bind:value={edit_name_value}
                        onfocus={handle_name_focus}
                        onblur={handle_name_blur}
                        onkeydown={handle_name_keydown}
                        class="rounded-md border border-(--border-default) bg-(--bg-secondary) px-3 py-2 text-sm text-(--text-primary) transition-all duration-200 focus:border-(--accent-primary) focus:bg-(--bg-primary) focus:outline-none"
                        placeholder="Project name"
                    />
                </div>
            </div>

            <!-- Search Section -->
            <div class="flex flex-col gap-3">
                <h2 class="m-0 text-base font-semibold text-(--text-primary)">Search</h2>

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
    {/if}
</div>
