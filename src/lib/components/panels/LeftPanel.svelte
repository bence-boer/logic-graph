<script lang="ts">
    import { ui_store } from '$lib/stores/ui.svelte';
    import { graph_store } from '$lib/stores/graph.svelte';

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

{#if is_open}
    <!-- Mobile backdrop overlay -->
    <button
        class="fixed inset-0 z-890 hidden bg-black/50 backdrop-blur-sm max-md:block"
        onclick={toggle_panel}
        aria-label="Close panel"
    ></button>
{/if}

<div
    class="fixed top-0 bottom-0 left-0 z-900 flex w-80 border border-l-0 border-(--border-default) bg-(--bg-elevated) shadow-(--shadow-sm) backdrop-blur-md transition-transform duration-300 ease-in-out max-md:left-1/2 max-md:top-1/2 max-md:h-[90vh] max-md:max-h-[600px] max-md:w-[90vw] max-md:max-w-md max-md:-translate-x-1/2 max-md:-translate-y-1/2 max-md:rounded-xl max-md:border {is_open
        ? 'translate-x-0 max-md:scale-100 max-md:opacity-100'
        : '-translate-x-80 max-md:pointer-events-none max-md:scale-95 max-md:opacity-0'}"
>
    <button
        class="absolute top-1/2 -right-6 flex h-20 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-tr-lg rounded-br-lg border border-l-0 border-(--border-default) bg-(--bg-elevated) text-sm text-(--text-primary) backdrop-blur-md transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) max-md:hidden"
        onclick={toggle_panel}
        aria-label="Toggle left panel"
    >
        {is_open ? '◀' : '▶'}
    </button>

    {#if is_open}
        <!-- Mobile close button -->
        <button
            class="absolute top-4 right-4 z-10 hidden h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-(--bg-secondary) text-(--text-primary) transition-all duration-200 hover:bg-(--border-hover) max-md:flex"
            onclick={toggle_panel}
            aria-label="Close panel"
        >
            ✕
        </button>

        <div
            class="flex flex-1 flex-col gap-4 overflow-y-auto p-3 max-md:p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-(--border-default) [&::-webkit-scrollbar-thumb:hover]:bg-(--border-hover) [&::-webkit-scrollbar-track]:bg-transparent"
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
                        <span class="text-sm text-(--text-secondary)">Statements:</span>
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
                        <span class="text-sm text-(--text-primary)">Show statement labels</span>
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

        </div>
    {/if}
</div>
