<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { toast_store } from '$lib/stores/toast.svelte';
    import { ConnectionType } from '$lib/types/graph';
    import Select from '$lib/components/ui/Select.svelte';
    import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';
    import { Trash2, X } from '@lucide/svelte';

    interface Props {
        connection_id: string;
    }

    let { connection_id }: Props = $props();

    let connection = $derived(graph_store.connections.find((c) => c.id === connection_id));
    let available_nodes = $derived(graph_store.nodes.map((n) => ({ value: n.id, label: n.name })));

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

        const source_names = sources.map((id) => graph_store.nodes.find((n) => n.id === id)?.name || 'Unknown').join(', ');
        const target_names = targets.map((id) => graph_store.nodes.find((n) => n.id === id)?.name || 'Unknown').join(', ');
        const connection_type_label = type === ConnectionType.IMPLICATION ? 'implication' : 'contradiction';
        
        toast_store.success(`${connection_type_label} connection updated: [${source_names}] → [${target_names}]`);
    }

    function handle_delete() {
        if (!connection) return;

        const source_names = connection.sources.map((id) => graph_store.nodes.find((n) => n.id === id)?.name || 'Unknown').join(', ');
        const target_names = connection.targets.map((id) => graph_store.nodes.find((n) => n.id === id)?.name || 'Unknown').join(', ');
        const connection_type_label = connection.type === ConnectionType.IMPLICATION ? 'implication' : 'contradiction';
        
        if (confirm(`Delete this ${connection_type_label} connection?\n[${source_names}] → [${target_names}]`)) {
            graph_store.remove_connection(connection.id);
            toast_store.success(`${connection_type_label} connection deleted: [${source_names}] → [${target_names}]`);
            close_panel();
        }
    }
</script>

{#if connection}
    <div class="flex h-full flex-col">
        <div class="flex items-center justify-between border-b border-(--border-default) p-3">
            <h3 class="m-0 text-lg font-semibold text-(--text-primary)">Edit Connection</h3>
            <button
                class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
                onclick={close_panel}
                aria-label="Close"
                title="Close"
            >
                <X size={18} />
            </button>
        </div>

        <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
            <div class="flex flex-col gap-3">
                <FormField label="ID">
                    <div
                        class="rounded-md border border-(--border-default) bg-(--bg-secondary) px-4 py-2 font-mono text-sm text-(--text-tertiary)"
                    >
                        {connection.id}
                    </div>
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

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <div class="flex gap-1">
                <button
                    class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--accent-secondary) transition-all duration-200 hover:border-(--accent-secondary) hover:bg-[rgba(239,68,68,0.1)] active:scale-98"
                    onclick={handle_delete}
                    title="Delete Connection"
                    aria-label="Delete Connection"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    </div>
{:else}
    <div class="flex h-full flex-col">
        <div class="flex-1 p-3">
            <p class="p-4 text-center text-sm text-red-500">Connection not found</p>
        </div>
    </div>
{/if}
