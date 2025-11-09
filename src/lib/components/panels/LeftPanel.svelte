<script lang="ts">
    import { ui_store } from '$lib/stores/ui.svelte';
    import { graph_store } from '$lib/stores/graph.svelte';
    import Button from '$lib/components/ui/Button.svelte';

    let is_open = $derived(ui_store.left_panel_open);
    let show_labels = $derived(ui_store.show_labels);
    let show_descriptions = $derived(ui_store.show_descriptions);
    let node_count = $derived(graph_store.nodes.length);
    let connection_count = $derived(graph_store.connections.length);
    let graph_name = $derived(graph_store.metadata.name);

    function toggle_panel() {
        ui_store.toggle_left_panel();
    }

    function toggle_labels() {
        ui_store.show_labels = !ui_store.show_labels;
    }

    function toggle_descriptions() {
        ui_store.show_descriptions = !ui_store.show_descriptions;
    }
</script>

<div class="left-panel" class:open={is_open}>
    <button class="toggle-btn" onclick={toggle_panel} aria-label="Toggle left panel">
        {is_open ? '◀' : '▶'}
    </button>

    {#if is_open}
        <div class="panel-content">
            <div class="panel-section">
                <h2 class="panel-title">Graph Info</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Name:</span>
                        <span class="info-value">{graph_name}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Nodes:</span>
                        <span class="info-value">{node_count}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Connections:</span>
                        <span class="info-value">{connection_count}</span>
                    </div>
                </div>
            </div>

            <div class="divider"></div>

            <div class="panel-section">
                <h2 class="panel-title">View Settings</h2>
                <div class="settings-list">
                    <label class="setting-item">
                        <input type="checkbox" checked={show_labels} onchange={toggle_labels} />
                        <span>Show node labels</span>
                    </label>
                    <label class="setting-item">
                        <input
                            type="checkbox"
                            checked={show_descriptions}
                            onchange={toggle_descriptions}
                        />
                        <span>Show descriptions</span>
                    </label>
                </div>
            </div>

            <div class="divider"></div>

            <div class="panel-section">
                <h2 class="panel-title">Quick Actions</h2>
                <div class="actions">
                    <Button onclick={() => graph_store.load_sample_data()}>Load Sample Data</Button>
                    <Button variant="danger" onclick={() => graph_store.clear()}>Clear Graph</Button
                    >
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .left-panel {
        position: fixed;
        left: 0;
        top: 80px;
        bottom: var(--spacing-md);
        width: 320px;
        background: var(--bg-elevated);
        backdrop-filter: blur(var(--blur-md));
        border: 1px solid var(--border-default);
        border-left: none;
        border-top-right-radius: 12px;
        border-bottom-right-radius: 12px;
        box-shadow: var(--shadow-lg);
        z-index: 900;
        display: flex;
        transition: transform 0.3s ease;
        transform: translateX(0);
    }

    .left-panel:not(.open) {
        transform: translateX(-320px);
    }

    .toggle-btn {
        position: absolute;
        right: -32px;
        top: 50%;
        transform: translateY(-50%);
        width: 32px;
        height: 64px;
        background: var(--bg-elevated);
        backdrop-filter: blur(var(--blur-md));
        border: 1px solid var(--border-default);
        border-left: none;
        border-top-right-radius: 8px;
        border-bottom-right-radius: 8px;
        color: var(--text-primary);
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .toggle-btn:hover {
        background: var(--bg-secondary);
        border-color: var(--border-hover);
    }

    .panel-content {
        flex: 1;
        padding: var(--spacing-lg);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
    }

    .panel-section {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
    }

    .panel-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    .info-grid {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
    }

    .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm);
        background: var(--bg-secondary);
        border-radius: 6px;
    }

    .info-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .info-value {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
    }

    .divider {
        height: 1px;
        background: var(--border-default);
    }

    .settings-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
    }

    .setting-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm);
        cursor: pointer;
        border-radius: 6px;
        transition: background 0.2s ease;
    }

    .setting-item:hover {
        background: var(--bg-secondary);
    }

    .setting-item input[type='checkbox'] {
        width: 18px;
        height: 18px;
        cursor: pointer;
    }

    .setting-item span {
        font-size: 0.875rem;
        color: var(--text-primary);
    }

    .actions {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
    }

    /* Scrollbar styling */
    .panel-content::-webkit-scrollbar {
        width: 6px;
    }

    .panel-content::-webkit-scrollbar-track {
        background: transparent;
    }

    .panel-content::-webkit-scrollbar-thumb {
        background: var(--border-default);
        border-radius: 3px;
    }

    .panel-content::-webkit-scrollbar-thumb:hover {
        background: var(--border-hover);
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .left-panel {
            width: 100%;
            max-width: 320px;
            bottom: 80px;
        }

        .toggle-btn {
            top: auto;
            bottom: -40px;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 6px;
        }
    }
</style>
