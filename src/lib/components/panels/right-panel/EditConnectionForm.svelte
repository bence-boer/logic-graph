<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { toast_store } from '$lib/stores/toast.svelte';
    import { ConnectionType } from '$lib/types/graph';
    import Button from '$lib/components/ui/Button.svelte';
    import Select from '$lib/components/ui/Select.svelte';
    import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';

    interface Props {
        connection_id: string;
    }

    let { connection_id }: Props = $props();

    let connection = $derived(graph_store.connections.find((c) => c.id === connection_id));
    let available_nodes = $derived(
        graph_store.nodes.map((n) => ({ value: n.id, label: n.name }))
    );

    let type = $state<ConnectionType>(ConnectionType.IMPLICATION);
    let sources = $state<string[]>([]);
    let targets = $state<string[]>([]);

    // Initialize form values when connection loads
    $effect(() => {
        if (connection) {
            type = connection.type;
            sources = [...connection.sources];
            targets = [...connection.targets];
        }
    });

    function close_panel() {
        ui_store.close_right_panel();
        selection_store.clear_selection();
    }

    function handle_save() {
        if (!connection) return;

        // Validate no overlap
        const overlap = sources.filter((s) => targets.includes(s));
        if (overlap.length > 0) {
            toast_store.error('Sources and targets cannot overlap');
            return;
        }

        // Validate at least one source and target
        if (sources.length === 0) {
            toast_store.error('At least one source is required');
            return;
        }

        if (targets.length === 0) {
            toast_store.error('At least one target is required');
            return;
        }

        graph_store.update_connection(connection.id, {
            type,
            sources,
            targets
        });

        toast_store.success('Connection updated successfully');
    }

    function handle_delete() {
        if (!connection) return;

        if (confirm('Delete this connection?')) {
            graph_store.remove_connection(connection.id);
            toast_store.success('Connection deleted');
            close_panel();
        }
    }
</script>

{#if connection}
    <div class="form-container">
        <div class="form-header">
            <h3>Edit Connection</h3>
            <button class="close-btn" onclick={close_panel} aria-label="Close">✕</button>
        </div>

        <div class="form-body">
            <div class="panel-section">
                <FormField label="ID">
                    <div class="field-value readonly">{connection.id}</div>
                </FormField>

                <Select
                    bind:value={type}
                    label="Type"
                    required
                    options={[
                        { value: ConnectionType.IMPLICATION, label: 'Implication' },
                        { value: ConnectionType.CONTRADICTION, label: 'Contradiction' }
                    ]}
                    onchange={handle_save}
                />

                <MultiSelect
                    bind:selected={sources}
                    label="Sources"
                    placeholder="Select source nodes..."
                    options={available_nodes}
                    required
                    onchange={handle_save}
                />

                <MultiSelect
                    bind:selected={targets}
                    label="Targets"
                    placeholder="Select target nodes..."
                    options={available_nodes}
                    required
                    onchange={handle_save}
                />
            </div>

            <div class="divider"></div>

            <div class="panel-section">
                <Button variant="danger" onclick={handle_delete}>Delete Connection</Button>
            </div>
        </div>
    </div>
{:else}
    <div class="form-container">
        <div class="form-body">
            <p class="error-message">Connection not found</p>
        </div>
    </div>
{/if}

<style>
    .field-value {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 0.875rem;
        font-family: 'Monaco', 'Courier New', monospace;
    }

    .field-value.readonly {
        color: var(--text-tertiary);
    }

    .error-message {
        font-size: 0.875rem;
        color: var(--error);
        text-align: center;
        padding: var(--spacing-md);
    }
</style>
