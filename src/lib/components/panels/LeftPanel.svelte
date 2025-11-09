<script lang="ts">
    import { ui_store } from '$lib/stores/ui.svelte';
    import { graph_store } from '$lib/stores/graph.svelte';
    import { Database, Trash2 } from '@lucide/svelte';

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

<div
    class="fixed top-0 bottom-0 left-0 z-900 flex w-80 border border-l-0 border-(--border-default) bg-(--bg-elevated) shadow-(--shadow-sm) backdrop-blur-md transition-transform duration-300 ease-in-out {is_open
        ? 'translate-x-0'
        : '-translate-x-80'}"
>
    <button
        class="absolute top-1/2 -right-6 flex h-20 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-tr-lg rounded-br-lg border border-l-0 border-(--border-default) bg-(--bg-elevated) text-sm text-(--text-primary) backdrop-blur-md transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary)"
        onclick={toggle_panel}
        aria-label="Toggle left panel"
    >
        {is_open ? '◀' : '▶'}
    </button>

    {#if is_open}
        <div
            class="flex flex-1 flex-col gap-4 overflow-y-auto p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-(--border-default) [&::-webkit-scrollbar-thumb:hover]:bg-(--border-hover) [&::-webkit-scrollbar-track]:bg-transparent"
        >
            <div class="flex flex-col gap-3">
                <h2 class="m-0 text-base font-semibold text-(--text-primary)">Graph Info</h2>
                <div class="flex flex-col gap-2">
                    <div
                        class="flex items-center justify-between rounded-md bg-(--bg-secondary) p-2"
                    >
                        <span class="text-sm text-(--text-secondary)">Name:</span>
                        <span class="text-sm font-medium text-(--text-primary)">{graph_name}</span>
                    </div>
                    <div
                        class="flex items-center justify-between rounded-md bg-(--bg-secondary) p-2"
                    >
                        <span class="text-sm text-(--text-secondary)">Nodes:</span>
                        <span class="text-sm font-medium text-(--text-primary)">{node_count}</span>
                    </div>
                    <div
                        class="flex items-center justify-between rounded-md bg-(--bg-secondary) p-2"
                    >
                        <span class="text-sm text-(--text-secondary)">Connections:</span>
                        <span class="text-sm font-medium text-(--text-primary)"
                            >{connection_count}</span
                        >
                    </div>
                </div>
            </div>

            <div class="h-px bg-(--border-default)"></div>

            <div class="flex flex-col gap-3">
                <h2 class="m-0 text-base font-semibold text-(--text-primary)">View Settings</h2>
                <div class="flex flex-col gap-2">
                    <label
                        class="flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors duration-200 hover:bg-(--bg-secondary)"
                    >
                        <input
                            type="checkbox"
                            class="h-4.5 w-4.5 cursor-pointer"
                            checked={show_labels}
                            onchange={toggle_labels}
                        />
                        <span class="text-sm text-(--text-primary)">Show node labels</span>
                    </label>
                    <label
                        class="flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors duration-200 hover:bg-(--bg-secondary)"
                    >
                        <input
                            type="checkbox"
                            class="h-4.5 w-4.5 cursor-pointer"
                            checked={show_descriptions}
                            onchange={toggle_descriptions}
                        />
                        <span class="text-sm text-(--text-primary)">Show descriptions</span>
                    </label>
                </div>
            </div>

            <div class="h-px bg-(--border-default)"></div>

            <div class="flex flex-col gap-3">
                <h2 class="m-0 text-base font-semibold text-(--text-primary)">Quick Actions</h2>
                <div class="flex gap-1">
                    <button
                        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
                        onclick={() => graph_store.load_sample_data()}
                        title="Load Sample Data"
                        aria-label="Load Sample Data"
                    >
                        <Database size={18} />
                    </button>
                    <button
                        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--accent-secondary) transition-all duration-200 hover:border-(--accent-secondary) hover:bg-[rgba(239,68,68,0.1)] active:scale-98"
                        onclick={() => graph_store.clear()}
                        title="Clear Graph"
                        aria-label="Clear Graph"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    /* Mobile responsiveness */
    @media (max-width: 768px) {
        div:first-child {
            width: 100%;
            max-width: 320px;
            bottom: 80px;
        }

        button:first-of-type {
            top: auto;
            bottom: -40px;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 6px;
        }
    }
</style>
