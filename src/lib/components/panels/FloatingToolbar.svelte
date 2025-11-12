<script lang="ts">
    import type GraphCanvas from '$lib/components/graph/GraphCanvas.svelte';
    import ConfirmationModal from '$lib/components/ui/ConfirmationModal.svelte';
    import CreateModal from '$lib/components/ui/CreateModal.svelte';
    import ExportModal from '$lib/components/ui/ExportModal.svelte';
    import HelpModal from '$lib/components/ui/HelpModal.svelte';
    import ImportModal from '$lib/components/ui/ImportModal.svelte';
    import { graph_store } from '$lib/stores/graph.svelte';
    import { notification_store } from '$lib/stores/notification.svelte';
    import type { LogicGraph } from '$lib/types/graph';
    import { validate_graph } from '$lib/utils/validation';
    import { EditActions, FileActions, HistoryActions, UtilityActions } from './FloatingToolbar';

    interface Props {
        show_help?: boolean;
        graph_canvas?: GraphCanvas;
    }

    let { show_help = $bindable(false), graph_canvas }: Props = $props();
    let show_export = $state(false);
    let show_import = $state(false);
    let show_create = $state(false);
    let show_clear_confirmation = $state(false);
    let show_sample_confirmation = $state(false);
    const icon_size = 18;

    function handle_import(graph: LogicGraph) {
        const validation = validate_graph(graph);
        if (validation.valid) {
            graph_store.load_graph(graph);
            const node_count = graph.nodes?.length || 0;
            const connection_count = graph.connections?.length || 0;
            notification_store.success(
                `Graph imported: ${node_count} statements, ${connection_count} connections`
            );
        } else {
            const error_summary = validation.errors
                .slice(0, 3)
                .map((e) => e.message)
                .join('; ');
            notification_store.error(
                `Invalid graph: ${error_summary}${validation.errors.length > 3 ? '...' : ''}`
            );
            alert(`Invalid graph:\n${validation.errors.map((e) => `- ${e.message}`).join('\n')}`);
        }
    }

    function handle_load_sample() {
        const has_data = graph_store.nodes.length > 0 || graph_store.connections.length > 0;
        if (has_data) {
            show_sample_confirmation = true;
        } else {
            confirm_load_sample();
        }
    }

    function confirm_load_sample() {
        graph_store.load_sample_data();
        notification_store.success('Sample graph loaded: "Socrates is mortal" syllogism');
        show_sample_confirmation = false;
    }

    function handle_clear() {
        show_clear_confirmation = true;
    }

    function confirm_clear() {
        const node_count = graph_store.nodes.length;
        const connection_count = graph_store.connections.length;

        graph_store.clear();
        notification_store.info(
            `Graph cleared (${node_count} statements, ${connection_count} connections removed)`
        );
        show_clear_confirmation = false;
    }

    function handle_create() {
        show_create = true;
    }

    function handle_recenter() {
        graph_canvas?.recenter_view();
    }

    // Computed values for confirmation modal
    const clear_details = $derived(() => {
        const node_count = graph_store.nodes.length;
        const connection_count = graph_store.connections.length;
        if (node_count === 0 && connection_count === 0) {
            return 'The graph is already empty.';
        }
        return `This will remove ${node_count} statement${node_count !== 1 ? 's' : ''} and ${connection_count} connection${connection_count !== 1 ? 's' : ''}.`;
    });

    const sample_details = $derived(() => {
        const node_count = graph_store.nodes.length;
        const connection_count = graph_store.connections.length;
        return `Your current graph has ${node_count} statement${node_count !== 1 ? 's' : ''} and ${connection_count} connection${connection_count !== 1 ? 's' : ''}. Loading the sample will replace your current work.`;
    });
</script>

<div
    class=" fixed bottom-4 left-1/2 z-1000 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-(--border-default) bg-(--bg-elevated) shadow-(--shadow-md) backdrop-blur-md max-md:bottom-2 max-md:gap-1 max-md:px-1"
>
    <EditActions {icon_size} on_create={handle_create} on_recenter={handle_recenter} />

    <div class="h-6 w-px bg-(--border-default) max-md:h-5"></div>

    <HistoryActions {icon_size} />

    <div class="h-6 w-px bg-(--border-default) max-md:h-5"></div>

    <FileActions
        {icon_size}
        on_import={() => (show_import = true)}
        on_export={() => (show_export = true)}
        on_load_sample={handle_load_sample}
        on_clear={handle_clear}
    />

    <div class="h-6 w-px bg-(--border-default) max-md:h-5"></div>

    <UtilityActions {icon_size} on_show_help={() => (show_help = true)} />
</div>

<HelpModal bind:is_open={show_help} onclose={() => (show_help = false)} />
<ExportModal bind:is_open={show_export} onclose={() => (show_export = false)} />
<ImportModal
    bind:is_open={show_import}
    onclose={() => (show_import = false)}
    onimport={handle_import}
/>
<CreateModal bind:is_open={show_create} onclose={() => (show_create = false)} />
<ConfirmationModal
    bind:is_open={show_clear_confirmation}
    title="Clear entire graph?"
    message="This will delete all statements and connections from the graph."
    details={clear_details()}
    confirm_text="Clear Graph"
    cancel_text="Cancel"
    variant="danger"
    onconfirm={confirm_clear}
    oncancel={() => (show_clear_confirmation = false)}
/>
<ConfirmationModal
    bind:is_open={show_sample_confirmation}
    title="Load sample graph?"
    message="This will replace your current graph with the sample data."
    details={sample_details()}
    confirm_text="Load Sample"
    cancel_text="Cancel"
    variant="warning"
    onconfirm={confirm_load_sample}
    oncancel={() => (show_sample_confirmation = false)}
/>
