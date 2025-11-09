<script lang="ts">
    import type GraphCanvas from '$lib/components/graph/GraphCanvas.svelte';
    import type { LogicGraph } from '$lib/types/graph';
    import { graph_store } from '$lib/stores/graph.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { toast_store } from '$lib/stores/toast.svelte';
    import { validate_graph } from '$lib/utils/validation';
    import HelpModal from '$lib/components/ui/HelpModal.svelte';
    import ExportModal from '$lib/components/ui/ExportModal.svelte';
    import ImportModal from '$lib/components/ui/ImportModal.svelte';
    import { FileActions, EditActions, UtilityActions } from './FloatingToolbar';

    interface Props {
        show_help?: boolean;
        graph_canvas?: GraphCanvas;
    }

    let { show_help = $bindable(false), graph_canvas }: Props = $props();
    let show_export = $state(false);
    let show_import = $state(false);

    function handle_import(graph: LogicGraph) {
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
            alert(`Invalid graph:\n${validation.errors.map((e) => `- ${e.message}`).join('\n')}`);
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

    function handle_load_sample() {
        graph_store.load_sample_data();
        toast_store.success('Sample graph loaded: "Socrates is mortal" syllogism');
    }

    function handle_clear() {
        const node_count = graph_store.nodes.length;
        const connection_count = graph_store.connections.length;

        if (confirm('Clear the entire graph? This will delete all statements and connections.')) {
            graph_store.clear();
            toast_store.info(
                `Graph cleared (${node_count} statements, ${connection_count} connections removed)`
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

    function handle_recenter() {
        graph_canvas?.recenter_view();
    }
</script>

<div
    class="fixed bottom-4 left-1/2 z-1000 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-(--border-default) bg-(--bg-elevated) shadow-(--shadow-md) backdrop-blur-md max-md:bottom-2 max-md:gap-1 max-md:px-1"
>
    <FileActions
        on_new_graph={handle_new_graph}
        on_import={() => (show_import = true)}
        on_export={() => (show_export = true)}
        on_load_sample={handle_load_sample}
        on_clear={handle_clear}
    />

    <div class="h-6 w-px bg-(--border-default) max-md:h-5"></div>

    <EditActions
        on_add_node={handle_add_node}
        on_add_connection={handle_add_connection}
        on_recenter={handle_recenter}
    />

    <div class="h-6 w-px bg-(--border-default) max-md:h-5"></div>

    <UtilityActions
        on_toggle_search={() => ui_store.toggle_search_panel()}
        on_show_help={() => (show_help = true)}
        search_panel_open={ui_store.search_panel_open}
    />
</div>

<HelpModal bind:is_open={show_help} onclose={() => (show_help = false)} />
<ExportModal bind:is_open={show_export} onclose={() => (show_export = false)} />
<ImportModal
    bind:is_open={show_import}
    onclose={() => (show_import = false)}
    onimport={handle_import}
/>
