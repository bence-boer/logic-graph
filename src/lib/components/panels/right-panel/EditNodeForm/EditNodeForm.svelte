<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { notification_store } from '$lib/stores/notification.svelte';
    import { ConnectionType, NodeType, QuestionState } from '$lib/types/graph';
    import {
        close_edit_form,
        create_node_connection,
        delete_connection_with_confirmation,
        delete_node_with_confirmation,
        navigate_to_node,
        save_node_changes,
        toggle_node_pin
    } from '$lib/utils/edit-node-actions';
    import {
        get_available_nodes_by_type,
        get_node_consequences,
        get_node_contradictions,
        get_node_reasons,
        get_node_questions
    } from '$lib/utils/node-connections';
    import { is_axiom_node } from '$lib/utils/node-classification';
    import BasicNodeFields from './BasicNodeFields.svelte';
    import ConnectionSection from './ConnectionSection.svelte';
    import EditNodeFormHeader from './EditNodeFormHeader.svelte';
    import FormalizedStatement from './FormalizedStatement.svelte';
    import QuickActionsBar from './QuickActionsBar.svelte';
    import StatementStateControl from './StatementStateControl.svelte';

    interface Props {
        node_id: string;
    }

    let { node_id }: Props = $props();

    let node = $derived(graph_store.nodes.find((n) => n.id === node_id));

    // Organize connections by type and direction
    let reasons = $derived(get_node_reasons(node_id, graph_store.connections));
    let consequences = $derived(get_node_consequences(node_id, graph_store.connections));
    let contradictions = $derived(get_node_contradictions(node_id, graph_store.connections));
    let questions = $derived(get_node_questions(node_id, graph_store.connections));

    let statement = $state('');
    let details = $state('');
    let is_initialized = $state(false);

    // State for adding connections
    let is_adding_reason = $state(false);
    let is_adding_consequence = $state(false);
    let is_adding_contradiction = $state(false);
    let is_adding_question = $state(false);
    let selected_node_for_connection = $state<string>('');
    let connection_mode = $state<'existing' | 'new'>('existing');
    let new_node_statement = $state('');

    // Available nodes for connection (excluding current node), filtered by type
    let available_nodes_implication = $derived(
        get_available_nodes_by_type(node_id, graph_store.nodes, ConnectionType.IMPLICATION)
    );
    let available_nodes_contradiction = $derived(
        get_available_nodes_by_type(node_id, graph_store.nodes, ConnectionType.CONTRADICTION)
    );
    
    // Available question nodes for linking as answers
    let available_questions = $derived(
        graph_store.nodes
            .filter((n) => n.type === NodeType.QUESTION && n.id !== node_id)
            .map((n) => ({ value: n.id, label: n.statement }))
    );

    // Check if this node is an axiom (for statement state control)
    let is_axiom = $derived(is_axiom_node(node_id, graph_store.connections));

    // Initialize form values when node loads (only once)
    $effect(() => {
        if (node && !is_initialized) {
            statement = node.statement;
            details = node.details || '';
            is_initialized = true;
        }
    });

    function handle_save() {
        if (!node) return;
        save_node_changes(node, statement, details);
    }

    function handle_pin_toggle() {
        toggle_node_pin(node_id);
    }

    function handle_delete() {
        if (!node) return;
        delete_node_with_confirmation(node, close_edit_form);
    }

    function start_adding(type: 'reason' | 'consequence' | 'contradiction' | 'question') {
        if (type === 'reason') is_adding_reason = true;
        else if (type === 'consequence') is_adding_consequence = true;
        else if (type === 'contradiction') is_adding_contradiction = true;
        else if (type === 'question') is_adding_question = true;

        selected_node_for_connection = '';
        connection_mode = 'existing';
        new_node_statement = '';
    }

    function cancel_adding() {
        is_adding_reason = false;
        is_adding_consequence = false;
        is_adding_contradiction = false;
        is_adding_question = false;
        selected_node_for_connection = '';
        new_node_statement = '';
    }

    function add_connection(type: ConnectionType, sources: string[], targets: string[]) {
        if (!node) return;

        const result = create_node_connection(
            node,
            type,
            sources,
            targets,
            connection_mode,
            selected_node_for_connection,
            new_node_statement,
            graph_store.nodes
        );

        if (result.error) {
            notification_store.error(result.error);
            return;
        }

        cancel_adding();
    }
    
    function add_question() {
        if (!node) return;

        if (connection_mode === 'new') {
            // Create a new question and link it to this statement
            if (!new_node_statement.trim()) {
                notification_store.error('Question is required');
                return;
            }
            
            const new_question = graph_store.add_node({
                statement: new_node_statement.trim(),
                details: '',
                type: NodeType.QUESTION,
                question_state: QuestionState.ACTIVE
            });
            
            // Link the question to this statement as an answer
            graph_store.set_answer(new_question.id, node.id);
            
            notification_store.success(
                `Question "${new_question.statement}" created and linked to "${node.statement}"`
            );
        } else {
            // Link an existing question to this statement
            if (!selected_node_for_connection) {
                notification_store.error('No question selected');
                return;
            }
            
            const question_node = graph_store.nodes.find((n) => n.id === selected_node_for_connection);
            if (!question_node) {
                notification_store.error('Question not found');
                return;
            }
            
            // Check if question already has an answer
            if (question_node.answered_by) {
                const current_answer = graph_store.nodes.find((n) => n.id === question_node.answered_by);
                if (current_answer && !confirm(
                    `This question is already answered by "${current_answer.statement}". Replace it with "${node.statement}"?`
                )) {
                    return;
                }
            }
            
            graph_store.set_answer(selected_node_for_connection, node.id);
            
            notification_store.success(
                `Question "${question_node.statement}" linked to "${node.statement}"`
            );
        }
        
        cancel_adding();
    }

    function handle_connection_delete(connection_id: string, connected_node_statement: string) {
        if (!node) return;
        delete_connection_with_confirmation(
            connection_id,
            node.statement,
            connected_node_statement
        );
    }
    
    function handle_question_delete(connection_id: string, question_statement: string) {
        if (!node) return;
        if (confirm(`Unlink question "${question_statement}" from "${node.statement}"?`)) {
            graph_store.remove_connection(connection_id);
            notification_store.success(`Question "${question_statement}" unlinked`);
        }
    }
</script>

{#if node}
    <div class="flex h-full flex-col">
        <EditNodeFormHeader onclose={close_edit_form} />

        <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
            <QuickActionsBar {node} onpin_toggle={handle_pin_toggle} ondelete={handle_delete} />

            <BasicNodeFields bind:statement bind:details onsave={handle_save} />

            {#if is_axiom}
                <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>
                <StatementStateControl {node} />
            {/if}

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <FormalizedStatement
                {node}
                {reasons}
                {consequences}
                {contradictions}
                all_nodes={graph_store.nodes}
            />

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <ConnectionSection
                title="Reasons"
                symbol="→"
                symbol_color="text-(--link-implication)"
                connections={reasons}
                all_nodes={graph_store.nodes}
                available_nodes={available_nodes_implication}
                empty_message="This is an axiom of the system"
                bind:is_adding={is_adding_reason}
                bind:connection_mode
                bind:selected_node_id={selected_node_for_connection}
                bind:new_node_statement
                onadd_start={() => start_adding('reason')}
                onadd_confirm={() =>
                    add_connection(ConnectionType.IMPLICATION, ['target'], ['current'])}
                onadd_cancel={cancel_adding}
                onmode_change={(mode) => (connection_mode = mode)}
                onconnection_click={navigate_to_node}
                onconnection_delete={handle_connection_delete}
            />

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <ConnectionSection
                title="Consequences"
                symbol="→"
                symbol_color="text-(--link-implication)"
                connections={consequences}
                all_nodes={graph_store.nodes}
                available_nodes={available_nodes_implication}
                empty_message="No consequences"
                bind:is_adding={is_adding_consequence}
                bind:connection_mode
                bind:selected_node_id={selected_node_for_connection}
                bind:new_node_statement
                onadd_start={() => start_adding('consequence')}
                onadd_confirm={() =>
                    add_connection(ConnectionType.IMPLICATION, ['current'], ['target'])}
                onadd_cancel={cancel_adding}
                onmode_change={(mode) => (connection_mode = mode)}
                onconnection_click={navigate_to_node}
                onconnection_delete={handle_connection_delete}
            />

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <ConnectionSection
                title="Contradictions"
                symbol="⟷"
                symbol_color="text-(--link-contradiction)"
                connections={contradictions}
                all_nodes={graph_store.nodes}
                available_nodes={available_nodes_contradiction}
                empty_message="No contradictions"
                bind:is_adding={is_adding_contradiction}
                bind:connection_mode
                bind:selected_node_id={selected_node_for_connection}
                bind:new_node_statement
                onadd_start={() => start_adding('contradiction')}
                onadd_confirm={() =>
                    add_connection(ConnectionType.CONTRADICTION, ['current'], ['target'])}
                onadd_cancel={cancel_adding}
                onmode_change={(mode) => (connection_mode = mode)}
                onconnection_click={navigate_to_node}
                onconnection_delete={handle_connection_delete}
            />

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <ConnectionSection
                title="Questions Answered"
                symbol="?"
                symbol_color="text-amber-500"
                connections={questions}
                all_nodes={graph_store.nodes}
                available_nodes={available_questions}
                empty_message="No questions answered"
                existing_label="Existing Question"
                new_label="New Question"
                select_placeholder="Select a question..."
                input_placeholder="Enter question..."
                bind:is_adding={is_adding_question}
                bind:connection_mode
                bind:selected_node_id={selected_node_for_connection}
                bind:new_node_statement
                onadd_start={() => start_adding('question')}
                onadd_confirm={add_question}
                onadd_cancel={cancel_adding}
                onmode_change={(mode) => (connection_mode = mode)}
                onconnection_click={navigate_to_node}
                onconnection_delete={handle_question_delete}
            />
        </div>
    </div>
{:else}
    <div class="flex h-full flex-col">
        <div class="flex-1 p-3">
            <p class="p-4 text-center text-sm text-red-500">Statement not found</p>
        </div>
    </div>
{/if}
