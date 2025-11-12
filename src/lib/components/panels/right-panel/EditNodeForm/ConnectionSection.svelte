<script lang="ts">
    import { Plus, ChevronDown, ChevronRight } from '@lucide/svelte';
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
        new_node_statement: string;
        existing_label?: string;
        new_label?: string;
        select_placeholder?: string;
        input_placeholder?: string;
        onadd_start: () => void;
        onadd_confirm: () => void;
        onadd_cancel: () => void;
        onmode_change: (mode: 'existing' | 'new') => void;
        onconnection_click: (node_id: string) => void;
        onconnection_delete: (connection_id: string, node_statement: string) => void;
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
        new_node_statement = $bindable(),
        existing_label,
        new_label,
        select_placeholder,
        input_placeholder,
        onadd_start,
        onadd_confirm,
        onadd_cancel,
        onmode_change,
        onconnection_click,
        onconnection_delete
    }: Props = $props();

    let is_expanded = $state(true);
    let connection_count = $derived(connections.length);
</script>

<div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
        <button
            class="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-transparent bg-transparent p-1 text-left transition-all duration-200 hover:bg-(--bg-secondary)"
            onclick={() => (is_expanded = !is_expanded)}
            title={is_expanded ? 'Collapse section' : 'Expand section'}
            aria-label={is_expanded ? 'Collapse section' : 'Expand section'}
        >
            {#if is_expanded}
                <ChevronDown size={16} class="text-(--text-secondary)" />
            {:else}
                <ChevronRight size={16} class="text-(--text-secondary)" />
            {/if}
            <h3 class="m-0 text-sm font-semibold tracking-wide text-(--text-secondary) uppercase">
                {title}
            </h3>
            {#if connection_count > 0}
                <span
                    class="rounded-full px-2 py-0.5 text-xs font-medium {symbol_color} bg-opacity-20"
                    style="background-color: currentColor; opacity: 0.2;"
                >
                    {connection_count}
                </span>
            {/if}
        </button>
        <button
            class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-1 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
            onclick={onadd_start}
            title="Add {title}"
            aria-label="Add {title}"
        >
            <Plus size={16} />
        </button>
    </div>
    {#if is_expanded}
        {#if is_adding}
            <AddConnectionForm
                bind:mode={connection_mode}
                bind:selected_node_id
                bind:new_node_statement
                {available_nodes}
                {existing_label}
                {new_label}
                {select_placeholder}
                {input_placeholder}
                {onmode_change}
                onconfirm={onadd_confirm}
                oncancel={onadd_cancel}
            />
        {/if}
        {#if connections.length > 0}
            <div class="flex flex-col gap-1">
                {#each connections as connection (connection.key)}
                    {@const connected_node = all_nodes.find((n) => n.id === connection.node_id)}
                    {#if connected_node}
                        <ConnectionListItem
                            node={connected_node}
                            {symbol}
                            {symbol_color}
                            onclick={() => onconnection_click(connected_node.id)}
                            ondelete={() =>
                                onconnection_delete(
                                    connection.connection_id,
                                    connected_node.statement
                                )}
                        />
                    {/if}
                {/each}
            </div>
        {:else if !is_adding}
            <p class="p-4 text-center text-sm text-(--text-tertiary)">{empty_message}</p>
        {/if}
    {/if}
</div>
