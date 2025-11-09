<script lang="ts">
    import GraphCanvas from '$lib/components/graph/GraphCanvas.svelte';
    import FloatingToolbar from '$lib/components/panels/FloatingToolbar.svelte';
    import LeftPanel from '$lib/components/panels/LeftPanel.svelte';
    import RightPanel from '$lib/components/panels/RightPanel.svelte';
    import SearchPanel from '$lib/components/panels/SearchPanel.svelte';
    import LoadingOverlay from '$lib/components/ui/LoadingOverlay.svelte';
    import ToastContainer from '$lib/components/ui/ToastContainer.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { loading_store } from '$lib/stores/loading.svelte';
    import { Menu } from '@lucide/svelte';

    let graph_canvas: GraphCanvas;
</script>

<div class="relative h-screen w-screen overflow-hidden">
    <FloatingToolbar {graph_canvas} />
    <LeftPanel />
    <RightPanel />
    <GraphCanvas bind:this={graph_canvas} />
    {#if ui_store.search_panel_open}
        <SearchPanel />
    {/if}
    
    <!-- Mobile menu button -->
    <button
        class="fixed top-4 left-4 z-1000 hidden h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-(--border-default) bg-(--bg-elevated) text-(--text-primary) shadow-(--shadow-md) backdrop-blur-md transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-95 max-md:flex"
        onclick={() => ui_store.toggle_left_panel()}
        aria-label="Toggle menu"
        title="Menu"
    >
        <Menu size={20} />
    </button>
    
    <LoadingOverlay is_loading={loading_store.is_loading} message={loading_store.message} />
    <ToastContainer />
</div>
