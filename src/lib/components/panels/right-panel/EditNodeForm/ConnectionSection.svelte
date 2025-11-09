<script lang="ts">
    import { Plus } from '@lucide/svelte';
    import AddConnectionForm from './AddConnectionForm.svelte';
    import ConnectionListItem from './ConnectionListItem.svelte';
    import type { LogicNode } from '$lib/types/graph';
    import type { NodeConnectionRelation } from '$lib/utils/node-connections';

    interface Props {
        title: string;
        symbol: string;
        symbol_color: string;
        connections: NodeConnectionRelation[];
        all_nodes: LogicNode[];
        available_nodes: Array<{ value: string; label: string }>;
        empty_message: string;
        is_adding: boolean;
        connection_mode: 'existing' | 'new';
        selected_node_id: string;
        new_node_name: string;
        onadd_start: () => void;
        onadd_confirm: () => void;
        onadd_cancel: () => void;
        onmode_change: (mode: 'existing' | 'new') => void;
        onconnection_click: (node_id: string) => void;
        onconnection_delete: (connection_id: string, node_name: string) => void;
    }

    let {
        title,
        symbol,
        symbol_color,
        connections,
        all_nodes,
        available_nodes,
        empty_message,
        is_adding = $bindable(),
        connection_mode = $bindable(),
        selected_node_id = $bindable(),
        new_node_name = $bindable(),
        onadd_start,
        onadd_confirm,
        onadd_cancel,
        onmode_change,
        onconnection_click,
        onconnection_delete
    }: Props = $props();
</script>

<div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
        <h3 class="m-0 text-sm font-semibold tracking-wide text-(--text-secondary) uppercase">
            {title}
        </h3>
        <button
            class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-1 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
            onclick={onadd_start}
            title="Add {title}"
            aria-label="Add {title}"
        >
            <Plus size={16} />
        </button>
    </div>
    {#if is_adding}
        <AddConnectionForm
            bind:mode={connection_mode}
            bind:selected_node_id
            bind:new_node_name
            {available_nodes}
            {onmode_change}
            onconfirm={onadd_confirm}
            oncancel={onadd_cancel}
        />
    {/if}
    {#if connections.length > 0}
        <div class="flex flex-col gap-1">
            {#each connections as connection (connection.connection_id)}
                {@const connected_node = all_nodes.find((n) => n.id === connection.node_id)}
                {#if connected_node}
                    <ConnectionListItem
                        node={connected_node}
                        {symbol}
                        {symbol_color}
                        onclick={() => onconnection_click(connected_node.id)}
                        ondelete={() =>
                            onconnection_delete(connection.connection_id, connected_node.name)}
                    />
                {/if}
            {/each}
        </div>
    {:else if !is_adding}
        <p class="p-4 text-center text-sm text-(--text-tertiary)">{empty_message}</p>
    {/if}
</div>
