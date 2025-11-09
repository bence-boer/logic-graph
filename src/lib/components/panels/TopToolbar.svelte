<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { toast_store } from '$lib/stores/toast.svelte';
    import { trigger_import_dialog } from '$lib/utils/import';
    import { validate_graph } from '$lib/utils/validation';
    import { SelectionTypeEnum } from '$lib/types/graph';
    import HelpModal from '$lib/components/ui/HelpModal.svelte';
    import ExportModal from '$lib/components/ui/ExportModal.svelte';
    import { FileActions, EditActions, UtilityActions } from './TopToolbar';

    interface Props {
        show_help?: boolean;
    }

    let { show_help = $bindable(false) }: Props = $props();
    let show_export = $state(false);

    async function handle_import() {
        const graph = await trigger_import_dialog();
        if (graph) {
            const validation = validate_graph(graph);
            if (validation.valid) {
                graph_store.load_graph(graph);
                const node_count = graph.nodes?.length || 0;
                const connection_count = graph.connections?.length || 0;
                toast_store.success(
                    `Graph imported: ${node_count} statements, ${connection_count} connections`
                );
            } else {
                const error_summary = validation.errors
                    .slice(0, 3)
                    .map((e) => e.message)
                    .join('; ');
                toast_store.error(
                    `Invalid graph: ${error_summary}${validation.errors.length > 3 ? '...' : ''}`
                );
                alert(
                    `Invalid graph:\n${validation.errors.map((e) => `- ${e.message}`).join('\n')}`
                );
            }
        }
    }

    function handle_new_graph() {
        const node_count = graph_store.nodes.length;
        const connection_count = graph_store.connections.length;

        if (confirm('Create a new graph? This will clear the current graph.')) {
            graph_store.clear();
            toast_store.info(
                `New graph created (cleared ${node_count} statements, ${connection_count} connections)`
            );
        }
    }

    function handle_add_node() {
        ui_store.open_create_node_form();
    }

    function handle_add_connection() {
        if (graph_store.nodes.length < 2) {
            toast_store.error('You need at least 2 statements to create a connection');
            return;
        }
        ui_store.open_create_connection_form();
    }

    function handle_delete_selected() {
        const selected_type = selection_store.type;
        const selected_id = selection_store.id;

        if (!selected_type || !selected_id) {
            toast_store.warning('No item selected');
            return;
        }

        if (selected_type === SelectionTypeEnum.NODE) {
            const node = graph_store.nodes.find((n) => n.id === selected_id);
            if (node && confirm(`Delete statement "${node.name}"?`)) {
                graph_store.remove_node(selected_id);
                toast_store.success(`Statement "${node.name}" deleted`);
                selection_store.clear_selection();
            }
        } else if (selected_type === SelectionTypeEnum.CONNECTION) {
            const connection = graph_store.connections.find((c) => c.id === selected_id);
            if (connection) {
                const source_names = connection.sources
                    .map((id) => graph_store.nodes.find((n) => n.id === id)?.name || 'Unknown')
                    .join(', ');
                const target_names = connection.targets
                    .map((id) => graph_store.nodes.find((n) => n.id === id)?.name || 'Unknown')
                    .join(', ');

                if (confirm(`Delete connection?\n[${source_names}] → [${target_names}]`)) {
                    graph_store.remove_connection(selected_id);
                    toast_store.success(
                        `Connection deleted: [${source_names}] → [${target_names}]`
                    );
                    selection_store.clear_selection();
                }
            }
        }
    }
</script>

<div
    class="fixed bottom-4 left-1/2 z-1000 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-(--border-default) bg-(--bg-elevated) shadow-(--shadow-md) backdrop-blur-md"
>
    <FileActions
        on_new_graph={handle_new_graph}
        on_import={handle_import}
        on_export={() => (show_export = true)}
    />

    <div class="h-6 w-px bg-(--border-default)"></div>

    <EditActions
        on_add_node={handle_add_node}
        on_add_connection={handle_add_connection}
        on_delete_selected={handle_delete_selected}
    />

    <div class="h-6 w-px bg-(--border-default)"></div>

    <UtilityActions
        on_toggle_search={() => ui_store.toggle_search_panel()}
        on_show_help={() => (show_help = true)}
        search_panel_open={ui_store.search_panel_open}
    />
</div>

<HelpModal bind:is_open={show_help} onclose={() => (show_help = false)} />
<ExportModal bind:is_open={show_export} onclose={() => (show_export = false)} />
