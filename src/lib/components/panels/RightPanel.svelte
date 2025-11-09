<script lang="ts">
    import { selection_store } from '$lib/stores/selection.svelte';
    import { graph_store } from '$lib/stores/graph.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { ConnectionType } from '$lib/types/graph';
    import Button from '$lib/components/ui/Button.svelte';
    import Input from '$lib/components/ui/Input.svelte';

    let selected_type = $derived(selection_store.type);
    let selected_id = $derived(selection_store.id);
    let is_open = $derived(ui_store.right_panel_open);

    let selected_node = $derived(
        selected_type === 'node' ? graph_store.nodes.find((n) => n.id === selected_id) : null
    );

    let selected_connection = $derived(
        selected_type === 'connection'
            ? graph_store.connections.find((c) => c.id === selected_id)
            : null
    );

    // Watch for selection changes to open/close panel
    $effect(() => {
        if (selected_type && selected_id) {
            ui_store.open_right_panel();
        }
    });

    function close_panel() {
        ui_store.close_right_panel();
        selection_store.clear_selection();
    }

    function handle_node_name_change(value: string) {
        if (selected_node) {
            graph_store.update_node(selected_node.id, { name: value });
        }
    }

    function handle_node_description_change(e: Event) {
        if (selected_node) {
            const target = e.target as HTMLTextAreaElement;
            graph_store.update_node(selected_node.id, { description: target.value });
        }
    }

    function handle_pin_node() {
        if (selected_node) {
            if (selected_node.fx !== null && selected_node.fx !== undefined) {
                // Unpin
                graph_store.update_node(selected_node.id, { fx: null, fy: null });
            } else {
                // Pin at current position
                graph_store.update_node(selected_node.id, {
                    fx: selected_node.x,
                    fy: selected_node.y
                });
            }
        }
    }

    function handle_delete_node() {
        if (selected_node && confirm(`Delete node "${selected_node.name}"?`)) {
            graph_store.remove_node(selected_node.id);
            close_panel();
        }
    }

    function handle_connection_type_change(e: Event) {
        if (selected_connection) {
            const target = e.target as HTMLSelectElement;
            const type =
                target.value === 'contradiction'
                    ? ConnectionType.CONTRADICTION
                    : ConnectionType.IMPLICATION;
            graph_store.update_connection(selected_connection.id, { type });
        }
    }

    function handle_delete_connection() {
        if (selected_connection && confirm('Delete this connection?')) {
            graph_store.remove_connection(selected_connection.id);
            close_panel();
        }
    }
</script>

{#if is_open}
    <div class="right-panel">
        <div class="panel-header">
            <h2 class="panel-title">
                {selected_type === 'node' ? 'Edit Node' : 'Edit Connection'}
            </h2>
            <button class="close-btn" onclick={close_panel} aria-label="Close panel">✕</button>
        </div>

        <div class="panel-content">
            {#if selected_node}
                <div class="panel-section">
                    <div class="field-group">
                        <div class="field-label">ID</div>
                        <div class="field-value readonly">{selected_node.id}</div>
                    </div>

                    <Input
                        bind:value={selected_node.name}
                        label="Name"
                        required
                        onchange={handle_node_name_change}
                    />

                    <div class="field-group">
                        <label class="field-label" for="description">Description</label>
                        <textarea
                            id="description"
                            class="textarea"
                            value={selected_node.description}
                            oninput={handle_node_description_change}
                            placeholder="Enter node description..."
                            rows="4"
                        ></textarea>
                    </div>

                    {#if selected_node.x !== undefined && selected_node.y !== undefined}
                        <div class="field-group">
                            <div class="field-label">Position</div>
                            <div class="position-info">
                                <span>X: {Math.round(selected_node.x)}</span>
                                <span>Y: {Math.round(selected_node.y)}</span>
                            </div>
                        </div>
                    {/if}

                    <Button onclick={handle_pin_node}>
                        {selected_node.fx !== null && selected_node.fx !== undefined
                            ? '📍 Unpin Node'
                            : '📌 Pin Node'}
                    </Button>
                </div>

                <div class="divider"></div>

                <div class="panel-section">
                    <h3 class="section-title">Connected To</h3>
                    <div class="connections-list">
                        {#each graph_store.connections.filter((c) => c.sources.includes(selected_node.id) || c.targets.includes(selected_node.id)) as conn}
                            <div class="connection-item">
                                <span class="connection-type {conn.type}">
                                    {conn.type === ConnectionType.IMPLICATION ? '→' : '⟷'}
                                </span>
                                <span class="connection-label">
                                    {conn.sources.length} source(s) → {conn.targets.length} target(s)
                                </span>
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="divider"></div>

                <div class="panel-section">
                    <Button variant="danger" onclick={handle_delete_node}>Delete Node</Button>
                </div>
            {:else if selected_connection}
                <div class="panel-section">
                    <div class="field-group">
                        <div class="field-label">ID</div>
                        <div class="field-value readonly">{selected_connection.id}</div>
                    </div>

                    <div class="field-group">
                        <label class="field-label" for="connection-type">Type</label>
                        <select
                            id="connection-type"
                            class="select"
                            value={selected_connection.type}
                            onchange={handle_connection_type_change}
                        >
                            <option value={ConnectionType.IMPLICATION}>Implication</option>
                            <option value={ConnectionType.CONTRADICTION}>Contradiction</option>
                        </select>
                    </div>

                    <div class="field-group">
                        <div class="field-label">
                            Sources ({selected_connection.sources.length})
                        </div>
                        <div class="node-list">
                            {#each selected_connection.sources as source_id}
                                {@const node = graph_store.nodes.find((n) => n.id === source_id)}
                                {#if node}
                                    <div class="node-chip">{node.name}</div>
                                {/if}
                            {/each}
                        </div>
                    </div>

                    <div class="field-group">
                        <div class="field-label">
                            Targets ({selected_connection.targets.length})
                        </div>
                        <div class="node-list">
                            {#each selected_connection.targets as target_id}
                                {@const node = graph_store.nodes.find((n) => n.id === target_id)}
                                {#if node}
                                    <div class="node-chip">{node.name}</div>
                                {/if}
                            {/each}
                        </div>
                    </div>
                </div>

                <div class="divider"></div>

                <div class="panel-section">
                    <Button variant="danger" onclick={handle_delete_connection}>
                        Delete Connection
                    </Button>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .right-panel {
        position: fixed;
        right: 0;
        top: 80px;
        bottom: var(--spacing-md);
        width: 360px;
        background: var(--bg-elevated);
        backdrop-filter: blur(var(--blur-md));
        border: 1px solid var(--border-default);
        border-right: none;
        border-top-left-radius: 12px;
        border-bottom-left-radius: 12px;
        box-shadow: var(--shadow-lg);
        z-index: 900;
        display: flex;
        flex-direction: column;
        animation: slide-in 0.3s ease;
    }

    @keyframes slide-in {
        from {
            transform: translateX(100%);
        }
        to {
            transform: translateX(0);
        }
    }

    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--border-default);
    }

    .panel-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    .close-btn {
        width: 32px;
        height: 32px;
        background: transparent;
        border: 1px solid var(--border-default);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .close-btn:hover {
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

    .section-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0;
    }

    .field-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .field-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .field-value {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 0.875rem;
        font-family: 'Monaco', 'Courier New', monospace;
    }

    .field-value.readonly {
        color: var(--text-tertiary);
    }

    .textarea {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 0.875rem;
        font-family: inherit;
        resize: vertical;
        min-height: 80px;
        transition: all 0.2s ease;
    }

    .textarea:hover {
        border-color: var(--border-hover);
    }

    .textarea:focus {
        outline: none;
        border-color: var(--accent-primary);
        background: var(--bg-primary);
    }

    .position-info {
        display: flex;
        gap: var(--spacing-md);
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: 6px;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .select {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 0.875rem;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .select:hover {
        border-color: var(--border-hover);
    }

    .select:focus {
        outline: none;
        border-color: var(--accent-primary);
    }

    .connections-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .connection-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm);
        background: var(--bg-secondary);
        border-radius: 6px;
    }

    .connection-type {
        font-size: 1.25rem;
        line-height: 1;
    }

    .connection-type.implication {
        color: var(--link-implication);
    }

    .connection-type.contradiction {
        color: var(--link-contradiction);
    }

    .connection-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .node-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .node-chip {
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: 4px;
        color: var(--text-primary);
        font-size: 0.875rem;
    }

    .divider {
        height: 1px;
        background: var(--border-default);
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
</style>
