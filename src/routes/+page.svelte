<script lang="ts">
    import GraphCanvas from '$lib/components/graph/GraphCanvas.svelte';
    import TopToolbar from '$lib/components/panels/TopToolbar.svelte';
</script>

<div class="app-container">
    <TopToolbar />
    <GraphCanvas />
</div>

<style>
    .app-container {
        width: 100vw;
        height: 100vh;
        position: relative;
        overflow: hidden;
    }
</style>
