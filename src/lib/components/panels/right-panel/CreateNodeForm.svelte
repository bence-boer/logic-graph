<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { toast_store } from '$lib/stores/toast.svelte';
    import { use_node_form } from '$lib/composables/use-node-form.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';
    import { FormHeader, FormActions } from './shared';
    import { CirclePlus } from '@lucide/svelte';

    const form = use_node_form();

    function handle_create() {
        if (!form.validate()) {
            return;
        }

        form.set_submitting(true);

        try {
            const new_node = graph_store.add_node({
                name: form.node_name.trim(),
                description: form.node_description.trim()
            });

            toast_store.success(`Statement "${form.node_name}" created`);

            // Select the new node and switch to edit mode
            selection_store.select_node(new_node.id);
            ui_store.open_edit_node_form(new_node.id);
        } catch (error) {
            toast_store.error('Failed to create statement');
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
        <FormField label="Name" error={form.validation_errors.name} required>
            <Input bind:value={form.node_name} placeholder="Enter statement name..." required />
        </FormField>

        <FormField
            label="Description"
            error={form.validation_errors.description}
            hint="Optional detailed description"
        >
            <Textarea
                bind:value={form.node_description}
                placeholder="Enter description..."
                rows={4}
                maxlength={500}
            />
        </FormField>
    </div>

    <FormActions
        primary_icon={CirclePlus}
        primary_label={form.is_submitting ? 'Creating Statement...' : 'Create Statement'}
        primary_disabled={form.is_submitting}
        onprimary={handle_create}
        oncancel={handle_cancel}
    />
</div>
