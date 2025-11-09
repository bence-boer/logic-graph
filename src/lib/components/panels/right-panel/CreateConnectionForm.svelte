<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { toast_store } from '$lib/stores/toast.svelte';
    import { ConnectionType } from '$lib/types/graph';
    import Select from '$lib/components/ui/Select.svelte';
    import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';
    import { Link, X as XIcon } from '@lucide/svelte';

    let connection_type = $state<ConnectionType>(ConnectionType.IMPLICATION);
    let source_ids = $state<string[]>([]);
    let target_ids = $state<string[]>([]);
    let validation_errors = $state<Record<string, string>>({});
    let is_submitting = $state(false);

    // Computed options for multi-select
    let node_options = $derived(
        graph_store.nodes.map((node) => ({
            value: node.id,
            label: node.statement,
            description: node.details
        }))
    );

    let has_enough_nodes = $derived(graph_store.nodes.length >= 2);

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

            toast_store.success(
                `${connection_type_label} connection created: [${source_names}] → [${target_names}]`
            );

            // Select the new connection and switch to edit mode
            selection_store.select_connection(new_connection.id);
            ui_store.open_edit_connection_form(new_connection.id);
        } catch (error) {
            toast_store.error('Failed to create connection');
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
        <button
            class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
            onclick={handle_cancel}
            aria-label="Close"
            title="Close"
        >
            <XIcon size={18} />
        </button>
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
                        { value: ConnectionType.IMPLICATION, label: '→ Implication' },
                        { value: ConnectionType.CONTRADICTION, label: '⟷ Contradiction' }
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
        <button
            class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--accent-primary) transition-all duration-200 hover:border-(--accent-primary) hover:bg-[rgba(139,92,246,0.1)] active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
            onclick={handle_create}
            disabled={is_submitting || !has_enough_nodes}
            title={is_submitting ? 'Creating Connection...' : 'Create Connection'}
            aria-label={is_submitting ? 'Creating Connection...' : 'Create Connection'}
        >
            <Link size={18} />
        </button>
        <button
            class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-elevated) active:scale-98"
            onclick={handle_cancel}
            title="Cancel"
            aria-label="Cancel"
        >
            <XIcon size={18} />
        </button>
    </div>
</div>
