<script lang="ts">
    import '../app.css';

    import { onDestroy, onMount } from 'svelte';

    import favicon from '$lib/assets/favicon.svg';
    import { register_all_commands } from '$lib/commands';
    import { all_interactions, interaction_router } from '$lib/interactions';

    let { children } = $props();

    // Register all commands and interactions during app initialization
    onMount(() => {
        register_all_commands();

        // Register all interaction definitions
        interaction_router.register_all(all_interactions);

        // Initialize event listeners
        interaction_router.initialize();
    });

    onDestroy(() => {
        // Clean up interaction listeners
        interaction_router.cleanup();
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
