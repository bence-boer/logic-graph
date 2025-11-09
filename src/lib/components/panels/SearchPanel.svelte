<script lang="ts">
    import { search_store } from '$lib/stores/search.svelte';
    import { graph_store } from '$lib/stores/graph.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { ConnectionType } from '$lib/types/graph';
    import type { LogicNode, LogicConnection } from '$lib/types/graph';

    let search_results = $derived.by(() => {
        const query = search_store.query.toLowerCase().trim();
        if (!query) return { nodes: [], connections: [] };

        const nodes = graph_store.nodes.filter((node) => {
            if (search_store.filter_type === 'connections') return false;
            const matches_query =
                node.name.toLowerCase().includes(query) ||
                node.description.toLowerCase().includes(query) ||
                node.id.toLowerCase().includes(query);
            return matches_query;
        });

        const connections = graph_store.connections.filter((conn) => {
            if (search_store.filter_type === 'nodes') return false;
            if (
                search_store.connection_type_filter !== 'all' &&
                conn.type !== search_store.connection_type_filter
            ) {
                return false;
            }
            const matches_query = conn.id.toLowerCase().includes(query);
            return matches_query;
        });

        return { nodes, connections };
    });

    let has_results = $derived(
        search_results.nodes.length > 0 || search_results.connections.length > 0
    );

    function handle_select_node(node: LogicNode) {
        selection_store.select_node(node.id);
    }

    function handle_select_connection(conn: LogicConnection) {
        selection_store.select_connection(conn.id);
    }

    function handle_clear() {
        search_store.clear();
    }
</script>

<div class="search-panel">
    <div class="search-header">
        <h3 class="search-title">Search & Filter</h3>
    </div>

    <div class="search-content">
        <div class="search-input-wrapper">
            <input
                type="text"
                class="search-input"
                placeholder="Search nodes and connections..."
                bind:value={search_store.query}
            />
            {#if search_store.query}
                <button class="clear-btn" onclick={handle_clear} aria-label="Clear search">✕</button
                >
            {/if}
        </div>

        <div class="filter-section">
            <div class="filter-group">
                <span class="filter-label">Show:</span>
                <div class="filter-buttons">
                    <button
                        class="filter-btn {search_store.filter_type === 'all' ? 'active' : ''}"
                        onclick={() => (search_store.filter_type = 'all')}
                    >
                        All
                    </button>
                    <button
                        class="filter-btn {search_store.filter_type === 'nodes' ? 'active' : ''}"
                        onclick={() => (search_store.filter_type = 'nodes')}
                    >
                        Nodes
                    </button>
                    <button
                        class="filter-btn {search_store.filter_type === 'connections'
                            ? 'active'
                            : ''}"
                        onclick={() => (search_store.filter_type = 'connections')}
                    >
                        Connections
                    </button>
                </div>
            </div>

            {#if search_store.filter_type !== 'nodes'}
                <div class="filter-group">
                    <span class="filter-label">Type:</span>
                    <div class="filter-buttons">
                        <button
                            class="filter-btn {search_store.connection_type_filter === 'all'
                                ? 'active'
                                : ''}"
                            onclick={() => (search_store.connection_type_filter = 'all')}
                        >
                            All
                        </button>
                        <button
                            class="filter-btn {search_store.connection_type_filter ===
                            ConnectionType.IMPLICATION
                                ? 'active'
                                : ''}"
                            onclick={() =>
                                (search_store.connection_type_filter = ConnectionType.IMPLICATION)}
                        >
                            Implications
                        </button>
                        <button
                            class="filter-btn {search_store.connection_type_filter ===
                            ConnectionType.CONTRADICTION
                                ? 'active'
                                : ''}"
                            onclick={() =>
                                (search_store.connection_type_filter =
                                    ConnectionType.CONTRADICTION)}
                        >
                            Contradictions
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        {#if search_store.query}
            <div class="results-section">
                {#if has_results}
                    {#if search_results.nodes.length > 0}
                        <div class="results-group">
                            <h4 class="results-title">
                                Nodes ({search_results.nodes.length})
                            </h4>
                            <div class="results-list">
                                {#each search_results.nodes as node}
                                    <button
                                        class="result-item"
                                        onclick={() => handle_select_node(node)}
                                    >
                                        <span class="result-icon">●</span>
                                        <div class="result-content">
                                            <div class="result-name">{node.name}</div>
                                            {#if node.description}
                                                <div class="result-description">
                                                    {node.description}
                                                </div>
                                            {/if}
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    {#if search_results.connections.length > 0}
                        <div class="results-group">
                            <h4 class="results-title">
                                Connections ({search_results.connections.length})
                            </h4>
                            <div class="results-list">
                                {#each search_results.connections as conn}
                                    <button
                                        class="result-item"
                                        onclick={() => handle_select_connection(conn)}
                                    >
                                        <span
                                            class="result-icon connection-icon {conn.type === ConnectionType.IMPLICATION ? 'implication' : 'contradiction'}"
                                        >
                                            {conn.type === ConnectionType.IMPLICATION
                                                ? '→'
                                                : '⟷'}
                                        </span>
                                        <div class="result-content">
                                            <div class="result-name">
                                                {conn.sources.length} source(s) → {conn.targets
                                                    .length} target(s)
                                            </div>
                                            <div class="result-description">{conn.id}</div>
                                        </div>
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/if}
                {:else}
                    <div class="no-results">
                        <p>No results found for "{search_store.query}"</p>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .search-panel {
        position: fixed;
        top: 80px;
        right: var(--spacing-md);
        width: 320px;
        max-height: calc(100vh - 100px);
        background: var(--bg-elevated);
        backdrop-filter: blur(var(--blur-md));
        border: 1px solid var(--border-default);
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        z-index: 900;
        display: flex;
        flex-direction: column;
        animation: slide-in 0.3s ease;
    }

    @keyframes slide-in {
        from {
            opacity: 0;
            transform: translateX(20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .search-header {
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--border-default);
    }

    .search-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    .search-content {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        padding: var(--spacing-lg);
    }

    .search-input-wrapper {
        position: relative;
    }

    .search-input {
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-md);
        padding-right: 40px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 0.875rem;
        transition: all 0.2s ease;
    }

    .search-input:focus {
        outline: none;
        border-color: var(--accent-primary);
        background: var(--bg-primary);
    }

    .clear-btn {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 24px;
        height: 24px;
        background: transparent;
        border: none;
        color: var(--text-secondary);
        font-size: 0.875rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s ease;
    }

    .clear-btn:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }

    .filter-section {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .filter-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .filter-buttons {
        display: flex;
        gap: var(--spacing-xs);
    }

    .filter-btn {
        flex: 1;
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: 4px;
        color: var(--text-secondary);
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .filter-btn:hover {
        border-color: var(--border-hover);
        color: var(--text-primary);
    }

    .filter-btn.active {
        background: var(--accent-primary);
        border-color: var(--accent-primary);
        color: white;
    }

    .results-section {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
    }

    .results-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
    }

    .results-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    .results-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .result-item {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm);
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
        width: 100%;
    }

    .result-item:hover {
        background: var(--bg-primary);
        border-color: var(--accent-primary);
    }

    .result-icon {
        font-size: 1rem;
        color: var(--node-default);
        flex-shrink: 0;
        line-height: 1;
    }

    .result-icon.connection-icon {
        font-size: 1.25rem;
    }

    .result-icon.implication {
        color: var(--link-implication);
    }

    .result-icon.contradiction {
        color: var(--link-contradiction);
    }

    .result-content {
        flex: 1;
        min-width: 0;
    }

    .result-name {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 2px;
    }

    .result-description {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .no-results {
        padding: var(--spacing-lg);
        text-align: center;
        color: var(--text-tertiary);
        font-size: 0.875rem;
    }

    /* Scrollbar styling */
    .search-content::-webkit-scrollbar {
        width: 6px;
    }

    .search-content::-webkit-scrollbar-track {
        background: transparent;
    }

    .search-content::-webkit-scrollbar-thumb {
        background: var(--border-default);
        border-radius: 3px;
    }

    .search-content::-webkit-scrollbar-thumb:hover {
        background: var(--border-hover);
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .search-panel {
            width: 100%;
            max-width: 320px;
            right: 50%;
            transform: translateX(50%);
        }
    }
</style>
