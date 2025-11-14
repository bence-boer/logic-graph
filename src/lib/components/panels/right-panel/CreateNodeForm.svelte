<script lang="ts">
    import FormField from '$lib/components/ui/FormField.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import Select from '$lib/components/ui/Select.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import { use_node_form } from '$lib/composables/use-node-form.svelte';
    import { graph_store } from '$lib/stores/graph.svelte';
    import { notification_store } from '$lib/stores/notification.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { ConnectionType } from '$lib/types/graph';
    import { CirclePlus } from '@lucide/svelte';
    import { FormActions, FormHeader } from './shared';

    const form = use_node_form();

    // Connection options
    let connection_type = $state<'none' | 'parent' | 'consequence' | 'contradiction'>('none');
    let selected_node_id = $state<string>('');

    // Available nodes for connection
    let available_nodes = $derived(
        graph_store.nodes.map((node) => ({
            value: node.id,
            label: node.statement
        }))
    );

    // Connection type options
    const connection_type_options = [
        { value: 'none', label: 'No connection' },
        { value: 'parent', label: 'Parent (reason for this statement)' },
        { value: 'consequence', label: 'Consequence (implied by this statement)' },
        { value: 'contradiction', label: 'Contradiction (conflicts with this statement)' }
    ];

    function handle_create() {
        if (!form.validate()) {
            return;
        }

        // Validate connection selection if needed
        if (connection_type !== 'none' && !selected_node_id) {
            notification_store.error('Please select a statement to connect with');
            return;
        }

        form.set_submitting(true);

        try {
            const new_node = graph_store.add_node({
                statement: form.node_statement.trim(),
                details: form.node_details.trim()
            });

            // Create connection if specified
            if (connection_type !== 'none' && selected_node_id) {
                if (connection_type === 'parent') {
                    // Parent is a reason: parent → new_node
                    graph_store.add_connection({
                        type: ConnectionType.IMPLICATION,
                        sources: [selected_node_id],
                        targets: [new_node.id]
                    });
                } else if (connection_type === 'consequence') {
                    // Consequence: new_node → consequence
                    graph_store.add_connection({
                        type: ConnectionType.IMPLICATION,
                        sources: [new_node.id],
                        targets: [selected_node_id]
                    });
                } else if (connection_type === 'contradiction') {
                    // Contradiction: bidirectional
                    graph_store.add_connection({
                        type: ConnectionType.CONTRADICTION,
                        sources: [new_node.id],
                        targets: [selected_node_id]
                    });
                }

                const connected_node = graph_store.nodes.find((n) => n.id === selected_node_id);
                const connection_label =
                    connection_type === 'parent'
                        ? 'parent'
                        : connection_type === 'consequence'
                          ? 'consequence'
                          : 'contradiction';
                notification_store.success(
                    `Statement "${form.node_statement}" created with ${connection_label} "${connected_node?.statement}"`
                );
            } else {
                notification_store.success(`Statement "${form.node_statement}" created`);
            }

            // Select the new node and switch to edit mode
            selection_store.select_node(new_node.id);
            ui_store.open_edit_node_form(new_node.id);
        } catch (error) {
            notification_store.error('Failed to create statement');
            console.error(error);
        } finally {
            form.set_submitting(false);
        }
    }

    function handle_cancel() {
        ui_store.close_right_panel();
        selection_store.clear_selection();
    }
</script>

<div class="flex h-full flex-col">
    <FormHeader title="Create New Statement" onclose={handle_cancel} />

    <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
        <FormField label="Statement" error={form.validation_errors.statement} required>
            <Input
                bind:value={form.node_statement}
                placeholder="Enter statement..."
                required
                maxlength={100}
            />
        </FormField>

        <FormField
            label="Details"
            error={form.validation_errors.details}
            hint="Optional additional details"
        >
            <Textarea
                bind:value={form.node_details}
                placeholder="Enter details..."
                rows={4}
                maxlength={500}
            />
        </FormField>

        <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

        <FormField label="Connect to existing statement" hint="Optional">
            <Select
                bind:value={connection_type}
                options={connection_type_options}
                placeholder="Select connection type..."
            />
        </FormField>

        {#if connection_type !== 'none' && available_nodes.length > 0}
            <FormField label="Select statement" required>
                <Select
                    bind:value={selected_node_id}
                    options={available_nodes}
                    placeholder="Select a statement..."
                    required
                />
            </FormField>
        {/if}

        {#if connection_type !== 'none' && available_nodes.length === 0}
            <p class="text-sm text-(--text-tertiary)">
                No statements available to connect. Create this statement first, then add
                connections from the edit view.
            </p>
        {/if}
    </div>

    <FormActions
        primary_icon={CirclePlus}
        primary_disabled={form.is_submitting}
        on_primary={handle_create}
        on_cancel={handle_cancel}
    />
</div>
