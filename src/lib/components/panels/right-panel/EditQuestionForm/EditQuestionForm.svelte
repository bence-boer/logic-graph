<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { notification_store } from '$lib/stores/notification.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { toggle_node_pin } from '$lib/utils/edit-node-actions';
    import QuickActionsBar from '../EditNodeForm/QuickActionsBar.svelte';
    import AnswerSection from './AnswerSection.svelte';
    import BasicQuestionFields from './BasicQuestionFields.svelte';
    import LinkedStatementsSection from './LinkedStatementsSection.svelte';
    import QuestionHeader from './QuestionHeader.svelte';

    interface Props {
        node_id: string;
    }

    let { node_id }: Props = $props();

    let node = $derived(graph_store.nodes.find((n) => n.id === node_id));

    let statement = $state('');
    let details = $state('');
    let is_initialized = $state(false);

    // Initialize form values when node loads (only once)
    $effect(() => {
        if (node && !is_initialized) {
            statement = node.statement;
            details = node.details || '';
            is_initialized = true;
        }
    });

    function close_form() {
        ui_store.close_right_panel();
        selection_store.clear_selection();
    }

    function delete_node() {
        if (!node) return;

        const confirm_delete = confirm(
            `Delete question "${node.statement}"?\n\nThis will also remove all connections.`
        );

        if (!confirm_delete) return;

        graph_store.remove_node(node.id);
        notification_store.success('Question deleted');
        close_form();
    }

    function handle_pin_toggle() {
        toggle_node_pin(node_id);
    }
</script>

{#if node}
    <div class="flex h-full flex-col">
        <QuestionHeader {node} onclose={close_form} />

        <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
            <QuickActionsBar {node} onpin_toggle={handle_pin_toggle} ondelete={delete_node} />

            <BasicQuestionFields bind:statement bind:details />

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <AnswerSection {node} />

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <LinkedStatementsSection {node} />

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>
        </div>
    </div>
{:else}
    <div class="flex h-full flex-col">
        <div class="flex-1 p-3">
            <p class="p-4 text-center text-sm text-red-500">Question not found</p>
        </div>
    </div>
{/if}
