<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { notification_store } from '$lib/stores/notification.svelte';
    import { ConnectionType } from '$lib/types/graph';
    import { get_available_nodes_by_type } from '$lib/utils/node-connections';
    import Select from '$lib/components/ui/Select.svelte';
    import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import { Link, X as XIcon } from '@lucide/svelte';

    let connection_type = $state<ConnectionType>(ConnectionType.IMPLICATION);
    let source_ids = $state<string[]>([]);
    let target_ids = $state<string[]>([]);
    let validation_errors = $state<Record<string, string>>({});
    let is_submitting = $state(false);

    // Computed options for multi-select, filtered by connection type
    let node_options = $derived(
        get_available_nodes_by_type('', graph_store.nodes, connection_type).map((opt) => {
            const node = graph_store.nodes.find((n) => n.id === opt.value);
            return {
                value: opt.value,
                label: opt.label,
                description: node?.details
            };
        })
    );

    let has_enough_nodes = $derived(graph_store.nodes.length >= 2);

    // Reset selections when connection type changes
    $effect(() => {
        // Watch connection_type and clear selections if they become invalid
        const valid_ids = new Set(node_options.map((opt) => opt.value));
        source_ids = source_ids.filter((id) => valid_ids.has(id));
        target_ids = target_ids.filter((id) => valid_ids.has(id));
    });

    function validate_form(): boolean {
        validation_errors = {};

        if (source_ids.length === 0) {
            validation_errors.sources = 'At least one source node is required';
        }

        if (target_ids.length === 0) {
            validation_errors.targets = 'At least one target node is required';
        }

        // Check for overlap
        const overlap = source_ids.filter((id) => target_ids.includes(id));
        if (overlap.length > 0) {
            validation_errors.overlap = 'A node cannot be both source and target';
        }

        return Object.keys(validation_errors).length === 0;
    }

    function handle_create() {
        if (!validate_form()) {
            return;
        }

        is_submitting = true;

        try {
            const new_connection = graph_store.add_connection({
                type: connection_type,
                sources: source_ids,
                targets: target_ids
            });

            const source_names = source_ids
                .map((id) => graph_store.nodes.find((n) => n.id === id)?.statement || 'Unknown')
                .join(', ');
            const target_names = target_ids
                .map((id) => graph_store.nodes.find((n) => n.id === id)?.statement || 'Unknown')
                .join(', ');
            const connection_type_label =
                connection_type === ConnectionType.IMPLICATION ? 'Implication' : 'Contradiction';

            notification_store.success(
                `${connection_type_label} connection created: [${source_names}] → [${target_names}]`
            );

            // Select the new connection and switch to edit mode
            selection_store.select_connection(new_connection.id);
            ui_store.open_edit_connection_form(new_connection.id);
        } catch (error) {
            notification_store.error('Failed to create connection');
            console.error(error);
        } finally {
            is_submitting = false;
        }
    }

    function handle_cancel() {
        ui_store.close_right_panel();
        selection_store.clear_selection();
    }
</script>

<div class="flex h-full flex-col">
    <div class="flex items-center justify-between border-b border-(--border-default) p-3">
        <h3 class="m-0 text-lg font-semibold text-(--text-primary)">Create New Connection</h3>
        <Button size="sm" icon on_click={handle_cancel}>
            <XIcon size={14} />
        </Button>
    </div>

    <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
        {#if !has_enough_nodes}
            <div
                class="flex items-center gap-1 rounded-md border border-[#f59e0b] bg-[rgba(251,191,36,0.1)] px-4 py-2 text-sm text-[#f59e0b] before:text-base before:content-['⚠']"
            >
                You need at least 2 nodes to create a connection
            </div>
        {:else}
            <FormField label="Connection Type" required>
                <Select
                    bind:value={connection_type}
                    options={[
                        {
                            value: ConnectionType.IMPLICATION,
                            label: '→ Implication (Reasons / Consequences)'
                        },
                        {
                            value: ConnectionType.CONTRADICTION,
                            label: '⟷ Contradiction (Mutual Exclusion)'
                        }
                    ]}
                />
            </FormField>

            <FormField
                label="Source Nodes"
                error={validation_errors.sources}
                hint="Select one or more source nodes"
                required
            >
                <MultiSelect
                    bind:selected={source_ids}
                    options={node_options}
                    placeholder="Select sources..."
                />
            </FormField>

            <FormField
                label="Target Nodes"
                error={validation_errors.targets}
                hint="Select one or more target nodes"
                required
            >
                <MultiSelect
                    bind:selected={target_ids}
                    options={node_options}
                    placeholder="Select targets..."
                />
            </FormField>

            {#if validation_errors.overlap}
                <div
                    class="flex items-center gap-1 rounded-md border border-(--accent-secondary) bg-[rgba(239,68,68,0.1)] px-4 py-2 text-sm text-(--accent-secondary) before:text-base before:content-['⚠']"
                >
                    {validation_errors.overlap}
                </div>
            {/if}
        {/if}
    </div>

    <div class="flex gap-1 border-t border-(--border-default) bg-(--bg-secondary) p-3">
        <Button
            variant="primary"
            size="sm"
            on_click={handle_create}
            disabled={is_submitting || !has_enough_nodes}
        >
            <Link size={14} />
        </Button>
        <Button size="sm" icon on_click={handle_cancel}>
            <XIcon size={14} />
        </Button>
    </div>
</div>
