<script lang="ts">
    import FormField from '$lib/components/ui/FormField.svelte';
    import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
    import Select from '$lib/components/ui/Select.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import { graph_store } from '$lib/stores/graph.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { notification_store } from '$lib/stores/notification.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { ConnectionType } from '$lib/types/graph';
    import { get_available_nodes_by_type } from '$lib/utils/node-connections';
    import { Trash2, X } from '@lucide/svelte';

    interface Props {
        connection_id: string;
    }

    let { connection_id }: Props = $props();

    let connection = $derived(
        graph_store.connections.find((connection) => connection.id === connection_id)
    );

    let type = $state<ConnectionType>(ConnectionType.IMPLICATION);
    let sources = $state<string[]>([]);
    let targets = $state<string[]>([]);

    // Available nodes filtered by connection type
    let available_nodes = $derived(get_available_nodes_by_type('', graph_store.nodes, type));

    // Initialize form values when connection loads
    $effect(() => {
        if (connection) {
            type = connection.type;
            sources = [...connection.sources];
            targets = [...connection.targets];
        }
    });

    // Filter selections when type changes
    $effect(() => {
        const valid_ids = new Set(available_nodes.map((opt) => opt.value));
        sources = sources.filter((id) => valid_ids.has(id));
        targets = targets.filter((id) => valid_ids.has(id));
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
            notification_store.error('Sources and targets cannot overlap');
            return;
        }

        // Validate at least one source and target
        if (sources.length === 0) {
            notification_store.error('At least one source is required');
            return;
        }

        if (targets.length === 0) {
            notification_store.error('At least one target is required');
            return;
        }

        graph_store.update_connection(connection.id!, {
            type,
            sources,
            targets
        });

        const source_names = sources
            .map((id) => graph_store.nodes.find((node) => node.id === id)?.statement || 'Unknown')
            .join(', ');
        const target_names = targets
            .map((id) => graph_store.nodes.find((node) => node.id === id)?.statement || 'Unknown')
            .join(', ');
        const connection_type_label =
            type === ConnectionType.IMPLICATION ? 'implication' : 'contradiction';

        notification_store.success(
            `${connection_type_label} connection updated: [${source_names}] → [${target_names}]`
        );
    }

    function handle_delete() {
        if (!connection) return;

        const source_statements = connection.sources
            .map((id) => graph_store.nodes.find((node) => node.id === id)?.statement || 'Unknown')
            .join(', ');
        const target_statements = connection.targets
            .map((id) => graph_store.nodes.find((node) => node.id === id)?.statement || 'Unknown')
            .join(', ');
        const connection_type_label =
            connection.type === ConnectionType.IMPLICATION ? 'implication' : 'contradiction';

        if (
            confirm(
                `Delete this ${connection_type_label} connection?\n[${source_statements}] → [${target_statements}]`
            )
        ) {
            graph_store.remove_connection(connection.id!);
            notification_store.success(
                `${connection_type_label} connection deleted: [${source_statements}] → [${target_statements}]`
            );
            close_panel();
        }
    }
</script>

{#if connection}
    <div class="flex h-full flex-col">
        <div class="flex items-center justify-between border-b border-(--border-default) p-3">
            <h3 class="m-0 text-lg font-semibold text-(--text-primary)">Edit Connection</h3>
            <Button size="sm" icon onclick={close_panel}>
                <X size={14} />
            </Button>
        </div>

        <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
            <div class="flex flex-col gap-3">
                <FormField label="ID">
                    <div
                        class="rounded-md border border-(--border-default) bg-(--bg-secondary) px-4 py-2 font-mono text-sm text-(--text-tertiary)"
                    >
                        {connection.id!}
                    </div>
                </FormField>

                <Select
                    bind:value={type}
                    label="Type"
                    required
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
                <Button variant="danger" size="sm" onclick={handle_delete}>
                    <Trash2 size={14} />
                </Button>
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
