<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { toast_store } from '$lib/stores/toast.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';
    import Button from '$lib/components/ui/Button.svelte';

    let node_name = $state('');
    let node_description = $state('');
    let validation_errors = $state<Record<string, string>>({});
    let is_submitting = $state(false);

    function validate_form(): boolean {
        validation_errors = {};

        if (!node_name.trim()) {
            validation_errors.name = 'Name is required';
        } else if (node_name.length > 100) {
            validation_errors.name = 'Name must be less than 100 characters';
        }

        if (node_description.length > 500) {
            validation_errors.description = 'Description must be less than 500 characters';
        }

        return Object.keys(validation_errors).length === 0;
    }

    function handle_create() {
        if (!validate_form()) {
            return;
        }

        is_submitting = true;

        try {
            const new_node = graph_store.add_node({
                name: node_name.trim(),
                description: node_description.trim()
            });

            toast_store.success(`Node "${node_name}" created`);

            // Select the new node and switch to edit mode
            selection_store.select_node(new_node.id);
            ui_store.open_edit_node_form(new_node.id);
        } catch (error) {
            toast_store.error('Failed to create node');
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
        <h3>Create New Node</h3>
        <button class="close-btn" onclick={handle_cancel} aria-label="Close">✕</button>
    </div>

    <div class="form-body">
        <FormField label="Name" error={validation_errors.name} required>
            <Input bind:value={node_name} placeholder="Enter node name..." required />
        </FormField>

        <FormField
            label="Description"
            error={validation_errors.description}
            hint="Optional detailed description"
        >
            <Textarea
                bind:value={node_description}
                placeholder="Enter description..."
                rows={4}
                maxlength={500}
            />
        </FormField>
    </div>

    <div class="form-actions">
        <Button variant="primary" onclick={handle_create} disabled={is_submitting}>
            {is_submitting ? 'Creating...' : 'Create Node'}
        </Button>
        <Button variant="secondary" onclick={handle_cancel}>Cancel</Button>
    </div>
</div>

<style>
    @import '$lib/styles/forms.css';
</style>
