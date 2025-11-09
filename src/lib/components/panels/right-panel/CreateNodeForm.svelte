<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { toast_store } from '$lib/stores/toast.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';
    import { CirclePlus, X as XIcon } from '@lucide/svelte';

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

<div class="flex h-full flex-col">
    <div class="flex items-center justify-between border-b border-(--border-default) p-3">
        <h3 class="m-0 text-lg font-semibold text-(--text-primary)">Create New Node</h3>
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

    <div class="flex gap-1 border-t border-(--border-default) bg-(--bg-secondary) p-3">
        <button
            class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--accent-primary) transition-all duration-200 hover:border-(--accent-primary) hover:bg-[rgba(139,92,246,0.1)] active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
            onclick={handle_create}
            disabled={is_submitting}
            title={is_submitting ? 'Creating Node...' : 'Create Node'}
            aria-label={is_submitting ? 'Creating Node...' : 'Create Node'}
        >
            <CirclePlus size={18} />
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
