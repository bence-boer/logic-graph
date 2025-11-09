<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { trigger_import_dialog } from '$lib/utils/import';
    import {
        download_graph_as_json,
        download_as_svg,
        download_as_png,
        download_as_jpeg,
        download_as_html
    } from '$lib/utils/export';
    import { validate_graph } from '$lib/utils/validation';
    import { ConnectionType } from '$lib/types/graph';
    import HelpModal from '$lib/components/ui/HelpModal.svelte';

    interface Props {
        show_help?: boolean;
    }

    let { show_help = $bindable(false) }: Props = $props();

    async function handle_import() {
        const graph = await trigger_import_dialog();
        if (graph) {
            const validation = validate_graph(graph);
            if (validation.valid) {
                graph_store.load_graph(graph);
            } else {
                alert(
                    `Invalid graph:\n${validation.errors.map((e) => `- ${e.message}`).join('\n')}`
                );
            }
        }
    }

    function handle_export_json() {
        const graph = graph_store.get_graph();
        download_graph_as_json(graph);
    }

    function handle_export_svg() {
        try {
            download_as_svg();
        } catch (error) {
            console.error('Failed to export SVG:', error);
            alert('Failed to export SVG');
        }
    }

    async function handle_export_png() {
        try {
            await download_as_png();
        } catch (error) {
            console.error('Failed to export PNG:', error);
            alert('Failed to export PNG');
        }
    }

    async function handle_export_jpeg() {
        try {
            await download_as_jpeg();
        } catch (error) {
            console.error('Failed to export JPEG:', error);
            alert('Failed to export JPEG');
        }
    }

    function handle_export_html() {
        const graph = graph_store.get_graph();
        download_as_html(graph);
    }

    function handle_new_graph() {
        if (confirm('Create a new graph? This will clear the current graph.')) {
            graph_store.clear();
        }
    }

    function handle_add_node() {
        const name = prompt('Enter node name:');
        if (name && name.trim()) {
            const description = prompt('Enter node description (optional):') || '';
            graph_store.add_node({
                name: name.trim(),
                description: description.trim()
            });
        }
    }

    function handle_add_connection() {
        const nodes = graph_store.nodes;
        if (nodes.length < 2) {
            alert('You need at least 2 nodes to create a connection');
            return;
        }

        // Simple prompt-based creation (will be replaced with proper UI later)
        const type_str = prompt('Connection type (implication or contradiction):');
        if (!type_str) return;

        const type =
            type_str.toLowerCase() === 'contradiction'
                ? ConnectionType.CONTRADICTION
                : ConnectionType.IMPLICATION;

        const source_ids_str = prompt(
            `Enter source node IDs (comma-separated):\n${nodes.map((n) => `${n.id}: ${n.name}`).join('\n')}`
        );
        if (!source_ids_str) return;

        const target_ids_str = prompt(
            `Enter target node IDs (comma-separated):\n${nodes.map((n) => `${n.id}: ${n.name}`).join('\n')}`
        );
        if (!target_ids_str) return;

        const sources = source_ids_str.split(',').map((s) => s.trim());
        const targets = target_ids_str.split(',').map((s) => s.trim());

        graph_store.add_connection({
            type,
            sources,
            targets
        });
    }

    function handle_delete_selected() {
        const selected_type = selection_store.type;
        const selected_id = selection_store.id;

        if (!selected_type || !selected_id) {
            alert('No item selected');
            return;
        }

        if (confirm(`Delete selected ${selected_type}?`)) {
            if (selected_type === 'node') {
                graph_store.remove_node(selected_id);
            } else if (selected_type === 'connection') {
                graph_store.remove_connection(selected_id);
            }
            selection_store.clear_selection();
        }
    }
</script>

<div class="toolbar">
    <div class="toolbar-section">
        <button class="toolbar-btn" onclick={handle_new_graph} title="New Graph">
            <span class="icon">📄</span>
            <span class="label">New</span>
        </button>
        <button class="toolbar-btn" onclick={handle_import} title="Import JSON">
            <span class="icon">📂</span>
            <span class="label">Import</span>
        </button>
        <button class="toolbar-btn" onclick={handle_export_json} title="Export JSON">
            <span class="icon">💾</span>
            <span class="label">Export JSON</span>
        </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-section">
        <button class="toolbar-btn" onclick={handle_export_svg} title="Export SVG">
            <span class="icon">🎨</span>
            <span class="label">SVG</span>
        </button>
        <button class="toolbar-btn" onclick={handle_export_png} title="Export PNG">
            <span class="icon">🖼️</span>
            <span class="label">PNG</span>
        </button>
        <button class="toolbar-btn" onclick={handle_export_jpeg} title="Export JPEG">
            <span class="icon">📷</span>
            <span class="label">JPEG</span>
        </button>
        <button class="toolbar-btn" onclick={handle_export_html} title="Export HTML">
            <span class="icon">🌐</span>
            <span class="label">HTML</span>
        </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-section">
        <button class="toolbar-btn" onclick={handle_add_node} title="Add Node">
            <span class="icon">➕</span>
            <span class="label">Add Node</span>
        </button>
        <button class="toolbar-btn" onclick={handle_add_connection} title="Add Connection">
            <span class="icon">🔗</span>
            <span class="label">Add Link</span>
        </button>
        <button class="toolbar-btn danger" onclick={handle_delete_selected} title="Delete Selected">
            <span class="icon">🗑️</span>
            <span class="label">Delete</span>
        </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-section">
        <button class="toolbar-btn" onclick={() => (show_help = true)} title="Help (?)">
            <span class="icon">❓</span>
            <span class="label">Help</span>
        </button>
    </div>
</div>

<HelpModal bind:is_open={show_help} onclose={() => (show_help = false)} />

<style>
    .toolbar {
        position: fixed;
        top: var(--spacing-md);
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        background: var(--bg-elevated);
        backdrop-filter: blur(var(--blur-md));
        border: 1px solid var(--border-default);
        border-radius: 8px;
        padding: var(--spacing-sm) var(--spacing-md);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
    }

    .toolbar-section {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
    }

    .toolbar-divider {
        width: 1px;
        height: 24px;
        background: var(--border-default);
    }

    .toolbar-btn {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: var(--spacing-sm) var(--spacing-md);
        background: transparent;
        border: 1px solid transparent;
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .toolbar-btn:hover {
        background: var(--bg-secondary);
        border-color: var(--border-hover);
    }

    .toolbar-btn:active {
        transform: scale(0.98);
    }

    .toolbar-btn.danger:hover {
        background: rgba(239, 68, 68, 0.1);
        border-color: var(--accent-secondary);
        color: var(--accent-secondary);
    }

    .toolbar-btn .icon {
        font-size: 1rem;
        line-height: 1;
    }

    .toolbar-btn .label {
        font-weight: 500;
    }

    @media (max-width: 768px) {
        .toolbar {
            flex-wrap: wrap;
            max-width: 90vw;
        }

        .toolbar-btn .label {
            display: none;
        }
    }
</style>
