<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { notification_store } from '$lib/stores/notification.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import QuestionHeader from './QuestionHeader.svelte';
    import BasicQuestionFields from './BasicQuestionFields.svelte';
    import QuestionStateControl from './QuestionStateControl.svelte';
    import AnswerSection from './AnswerSection.svelte';
    import LinkedStatementsSection from './LinkedStatementsSection.svelte';

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

    function save_changes() {
        if (!node) return;

        if (statement.trim().length === 0) {
            notification_store.error('Question cannot be empty');
            return;
        }

        graph_store.update_node(node.id, {
            statement: statement.trim(),
            details: details.trim() || undefined
        });

        notification_store.success('Question updated');
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
</script>

{#if node}
    <div class="flex h-full flex-col">
        <QuestionHeader {node} onclose={close_form} />

        <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
            <BasicQuestionFields bind:statement bind:details onsave={save_changes} />

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <QuestionStateControl {node} />

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <AnswerSection {node} />

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <LinkedStatementsSection {node} />

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <!-- Form actions -->
            <div class="flex gap-2">
                <Button onclick={save_changes} variant="primary">
                    {#snippet children()}
                        Save Changes
                    {/snippet}
                </Button>
                <Button onclick={delete_node} variant="danger">
                    {#snippet children()}
                        Delete Question
                    {/snippet}
                </Button>
            </div>
        </div>
    </div>
{:else}
    <div class="flex h-full flex-col">
        <div class="flex-1 p-3">
            <p class="p-4 text-center text-sm text-red-500">Question not found</p>
        </div>
    </div>
{/if}
