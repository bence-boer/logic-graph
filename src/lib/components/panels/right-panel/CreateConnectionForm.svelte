<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { toast_store } from '$lib/stores/toast.svelte';
    import { ConnectionType } from '$lib/types/graph';
    import Select from '$lib/components/ui/Select.svelte';
    import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';
    import Button from '$lib/components/ui/Button.svelte';

    let connection_type = $state<ConnectionType>(ConnectionType.IMPLICATION);
    let source_ids = $state<string[]>([]);
    let target_ids = $state<string[]>([]);
    let validation_errors = $state<Record<string, string>>({});
    let is_submitting = $state(false);

    // Computed options for multi-select
    let node_options = $derived(
        graph_store.nodes.map((node) => ({
            value: node.id,
            label: node.name,
            description: node.description
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

            toast_store.success('Connection created');

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

<div class="form-container">
    <div class="form-header">
        <h3>Create New Connection</h3>
        <button class="close-btn" onclick={handle_cancel} aria-label="Close">✕</button>
    </div>

    <div class="form-body">
        {#if !has_enough_nodes}
            <div class="warning-message">You need at least 2 nodes to create a connection</div>
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
                <div class="error-message">{validation_errors.overlap}</div>
            {/if}
        {/if}
    </div>

    <div class="form-actions">
        <Button
            variant="primary"
            onclick={handle_create}
            disabled={is_submitting || !has_enough_nodes}
        >
            {is_submitting ? 'Creating...' : 'Create Connection'}
        </Button>
        <Button variant="secondary" onclick={handle_cancel}>Cancel</Button>
    </div>
</div>

<style>
    @import '$lib/styles/forms.css';
</style>
