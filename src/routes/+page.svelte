<script lang="ts">
    import GraphCanvas from '$lib/components/graph/GraphCanvas.svelte';
    import TopToolbar from '$lib/components/panels/TopToolbar.svelte';
    import LeftPanel from '$lib/components/panels/LeftPanel.svelte';
    import RightPanel from '$lib/components/panels/RightPanel.svelte';
    import SearchPanel from '$lib/components/panels/SearchPanel.svelte';
    import LoadingOverlay from '$lib/components/ui/LoadingOverlay.svelte';
    import ToastContainer from '$lib/components/ui/ToastContainer.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { loading_store } from '$lib/stores/loading.svelte';
</script>

<div class="relative h-screen w-screen overflow-hidden">
    <TopToolbar />
    <LeftPanel />
    <RightPanel />
    <GraphCanvas />
    {#if ui_store.search_panel_open}
        <SearchPanel />
    {/if}
    <LoadingOverlay is_loading={loading_store.is_loading} message={loading_store.message} />
    <ToastContainer />
</div>
