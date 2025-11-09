<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { toast_store } from '$lib/stores/toast.svelte';
    import { ConnectionType } from '$lib/types/graph';
    import {
        close_edit_form,
        create_node_connection,
        delete_connection_with_confirmation,
        delete_node_with_confirmation,
        navigate_to_node,
        save_node_changes,
        toggle_node_pin
    } from '$lib/utils/edit-node-actions';
    import {
        get_available_nodes_for_connection,
        get_node_consequences,
        get_node_contradictions,
        get_node_reasons
    } from '$lib/utils/node-connections';
    import BasicNodeFields from './BasicNodeFields.svelte';
    import ConnectionSection from './ConnectionSection.svelte';
    import EditNodeFormHeader from './EditNodeFormHeader.svelte';
    import QuickActionsBar from './QuickActionsBar.svelte';

    interface Props {
        node_id: string;
    }

    let { node_id }: Props = $props();

    let node = $derived(graph_store.nodes.find((n) => n.id === node_id));

    // Organize connections by type and direction
    let reasons = $derived(get_node_reasons(node_id, graph_store.connections));
    let consequences = $derived(get_node_consequences(node_id, graph_store.connections));
    let contradictions = $derived(get_node_contradictions(node_id, graph_store.connections));

    let name = $state('');
    let description = $state('');

    // State for adding connections
    let is_adding_reason = $state(false);
    let is_adding_consequence = $state(false);
    let is_adding_contradiction = $state(false);
    let selected_node_for_connection = $state<string>('');
    let connection_mode = $state<'existing' | 'new'>('existing');
    let new_node_name = $state('');

    // Available nodes for connection (excluding current node)
    let available_nodes = $derived(get_available_nodes_for_connection(node_id, graph_store.nodes));

    // Initialize form values when node loads
    $effect(() => {
        if (node) {
            name = node.name;
            description = node.description;
        }
    });

    function handle_save() {
        if (!node) return;
        save_node_changes(node, name, description);
    }

    function handle_pin_toggle() {
        if (!node) return;
        toggle_node_pin(node);
    }

    function handle_delete() {
        if (!node) return;
        delete_node_with_confirmation(node, close_edit_form);
    }

    function start_adding(type: 'reason' | 'consequence' | 'contradiction') {
        if (type === 'reason') is_adding_reason = true;
        else if (type === 'consequence') is_adding_consequence = true;
        else is_adding_contradiction = true;

        selected_node_for_connection = '';
        connection_mode = 'existing';
        new_node_name = '';
    }

    function cancel_adding() {
        is_adding_reason = false;
        is_adding_consequence = false;
        is_adding_contradiction = false;
        selected_node_for_connection = '';
        new_node_name = '';
    }

    function add_connection(type: ConnectionType, sources: string[], targets: string[]) {
        if (!node) return;

        const result = create_node_connection(
            node,
            type,
            sources,
            targets,
            connection_mode,
            selected_node_for_connection,
            new_node_name,
            graph_store.nodes
        );

        if (result.error) {
            toast_store.error(result.error);
            return;
        }

        cancel_adding();
    }

    function handle_connection_delete(connection_id: string, connected_node_name: string) {
        if (!node) return;
        delete_connection_with_confirmation(connection_id, node.name, connected_node_name);
    }
</script>

{#if node}
    <div class="flex h-full flex-col">
        <EditNodeFormHeader onclose={close_edit_form} />

        <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
            <QuickActionsBar {node} onpin_toggle={handle_pin_toggle} ondelete={handle_delete} />

            <BasicNodeFields {node} bind:name bind:description onsave={handle_save} />

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <ConnectionSection
                title="Reasons"
                symbol="→"
                symbol_color="text-(--link-implication)"
                connections={reasons}
                all_nodes={graph_store.nodes}
                {available_nodes}
                empty_message="This is an axiom of the system"
                bind:is_adding={is_adding_reason}
                bind:connection_mode
                bind:selected_node_id={selected_node_for_connection}
                bind:new_node_name
                onadd_start={() => start_adding('reason')}
                onadd_confirm={() =>
                    add_connection(ConnectionType.IMPLICATION, ['target'], ['current'])}
                onadd_cancel={cancel_adding}
                onmode_change={(mode) => (connection_mode = mode)}
                onconnection_click={navigate_to_node}
                onconnection_delete={handle_connection_delete}
            />

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <ConnectionSection
                title="Consequences"
                symbol="→"
                symbol_color="text-(--link-implication)"
                connections={consequences}
                all_nodes={graph_store.nodes}
                {available_nodes}
                empty_message="No consequences"
                bind:is_adding={is_adding_consequence}
                bind:connection_mode
                bind:selected_node_id={selected_node_for_connection}
                bind:new_node_name
                onadd_start={() => start_adding('consequence')}
                onadd_confirm={() =>
                    add_connection(ConnectionType.IMPLICATION, ['current'], ['target'])}
                onadd_cancel={cancel_adding}
                onmode_change={(mode) => (connection_mode = mode)}
                onconnection_click={navigate_to_node}
                onconnection_delete={handle_connection_delete}
            />

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <ConnectionSection
                title="Contradictions"
                symbol="⟷"
                symbol_color="text-(--link-contradiction)"
                connections={contradictions}
                all_nodes={graph_store.nodes}
                {available_nodes}
                empty_message="No contradictions"
                bind:is_adding={is_adding_contradiction}
                bind:connection_mode
                bind:selected_node_id={selected_node_for_connection}
                bind:new_node_name
                onadd_start={() => start_adding('contradiction')}
                onadd_confirm={() =>
                    add_connection(ConnectionType.CONTRADICTION, ['current'], ['target'])}
                onadd_cancel={cancel_adding}
                onmode_change={(mode) => (connection_mode = mode)}
                onconnection_click={navigate_to_node}
                onconnection_delete={handle_connection_delete}
            />
        </div>
    </div>
{:else}
    <div class="flex h-full flex-col">
        <div class="flex-1 p-3">
            <p class="p-4 text-center text-sm text-red-500">Statement not found</p>
        </div>
    </div>
{/if}
