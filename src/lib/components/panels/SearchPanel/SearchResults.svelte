<script lang="ts">
    import type { LogicNode, LogicConnection } from '$lib/types/graph';
    import NodeSearchResult from './NodeSearchResult.svelte';
    import ConnectionSearchResult from './ConnectionSearchResult.svelte';
    import EmptySearchState from './EmptySearchState.svelte';

    interface Props {
        nodes: LogicNode[];
        connections: LogicConnection[];
        query: string;
        on_select_node: (node: LogicNode) => void;
        on_select_connection: (connection: LogicConnection) => void;
    }

    let { nodes, connections, query, on_select_node, on_select_connection }: Props = $props();

    let has_results = $derived(nodes.length > 0 || connections.length > 0);
</script>

{#if query}
    <div class="flex flex-col gap-4">
        {#if has_results}
            {#if nodes.length > 0}
                <div class="flex flex-col gap-2">
                    <h4 class="m-0 text-sm font-semibold text-(--text-primary)">
                        Nodes ({nodes.length})
                    </h4>
                    <div class="flex flex-col gap-1">
                        {#each nodes as node (node.id)}
                            <NodeSearchResult {node} onselect={on_select_node} />
                        {/each}
                    </div>
                </div>
            {/if}

            {#if connections.length > 0}
                <div class="flex flex-col gap-2">
                    <h4 class="m-0 text-sm font-semibold text-(--text-primary)">
                        Connections ({connections.length})
                    </h4>
                    <div class="flex flex-col gap-1">
                        {#each connections as connection (connection.id)}
                            <ConnectionSearchResult {connection} onselect={on_select_connection} />
                        {/each}
                    </div>
                </div>
            {/if}
        {:else}
            <EmptySearchState {query} />
        {/if}
    </div>
{/if}
