<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { notification_store } from '$lib/stores/notification.svelte';
    import { use_node_form } from '$lib/composables/use-node-form.svelte';
    import { NodeType, QuestionState } from '$lib/types/graph';
    import { is_statement_node } from '$lib/utils/node-classification';
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';
    import Select from '$lib/components/ui/Select.svelte';
    import { FormHeader, FormActions } from './shared';
    import { CircleHelp } from '@lucide/svelte';

    const form = use_node_form();

    // Question-specific state
    let initial_state = $state<QuestionState>(QuestionState.ACTIVE);
    let link_answer = $state<boolean>(false);
    let selected_answer_id = $state<string>('');

    // Available statement nodes for answering
    let available_statements = $derived(
        graph_store.nodes
            .filter((node) => is_statement_node(node))
            .map((node) => ({
                value: node.id,
                label: node.statement
            }))
    );

    // Question state options
    const state_options = [
        { value: QuestionState.ACTIVE, label: 'Active' },
        { value: QuestionState.RESOLVED, label: 'Resolved' }
    ];

    function handle_create() {
        if (!form.validate()) {
            return;
        }

        // Validate answer selection if needed
        if (link_answer && !selected_answer_id) {
            notification_store.error('Please select a statement to link as an answer');
            return;
        }

        form.set_submitting(true);

        try {
            const new_node = graph_store.add_node({
                statement: form.node_statement.trim(),
                details: form.node_details.trim(),
                type: NodeType.QUESTION,
                question_state: initial_state,
                answered_by: link_answer ? selected_answer_id : undefined
            });

            // Create answer connection if specified
            if (link_answer && selected_answer_id) {
                graph_store.set_answer(new_node.id, selected_answer_id);
                const answer_node = graph_store.nodes.find((n) => n.id === selected_answer_id);
                notification_store.success(
                    `Question "${form.node_statement}" created with answer "${answer_node?.statement}"`
                );
            } else {
                notification_store.success(`Question "${form.node_statement}" created`);
            }

            // Select the new node and switch to edit mode
            selection_store.select_node(new_node.id);
            ui_store.open_edit_question_form(new_node.id);
        } catch (error) {
            notification_store.error('Failed to create question');
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
    <FormHeader title="Create New Question" onclose={handle_cancel} />

    <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
        <FormField label="Question" error={form.validation_errors.statement} required>
            <Input
                bind:value={form.node_statement}
                placeholder="Enter your question..."
                required
                maxlength={100}
            />
        </FormField>

        <FormField
            label="Details"
            error={form.validation_errors.details}
            hint="Optional additional context"
        >
            <Textarea
                bind:value={form.node_details}
                placeholder="Enter details..."
                rows={4}
                maxlength={500}
            />
        </FormField>

        <FormField label="Initial State" hint="Questions start as active by default">
            <Select
                bind:value={initial_state}
                options={state_options}
                placeholder="Select initial state..."
            />
        </FormField>

        <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

        <FormField label="Link answer immediately" hint="Optional">
            <label class="flex cursor-pointer items-center gap-2">
                <input
                    type="checkbox"
                    bind:checked={link_answer}
                    class="h-4 w-4 rounded border-gray-300"
                />
                <span class="text-sm">Link to an existing statement as the answer</span>
            </label>
        </FormField>

        {#if link_answer && available_statements.length > 0}
            <FormField label="Select answer statement" required>
                <Select
                    bind:value={selected_answer_id}
                    options={available_statements}
                    placeholder="Select a statement..."
                    required
                />
            </FormField>
        {/if}

        {#if link_answer && available_statements.length === 0}
            <p class="text-sm text-(--text-tertiary)">
                No statements available to link as answer. Create this question first, then add an
                answer from the edit view.
            </p>
        {/if}
    </div>

    <FormActions
        primary_icon={CircleHelp}
        primary_label={form.is_submitting ? 'Creating Question...' : 'Create Question'}
        primary_disabled={form.is_submitting}
        onprimary={handle_create}
        oncancel={handle_cancel}
    />
</div>
