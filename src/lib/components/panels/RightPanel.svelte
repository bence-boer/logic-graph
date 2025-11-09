<script lang="ts">
    import { ui_store } from '$lib/stores/ui.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { RightPanelModeType, SelectionTypeEnum } from '$lib/types/graph';
    import CreateNodeForm from './right-panel/CreateNodeForm.svelte';
    import CreateConnectionForm from './right-panel/CreateConnectionForm.svelte';
    import EditNodeForm from './right-panel/EditNodeForm.svelte';
    import EditConnectionForm from './right-panel/EditConnectionForm.svelte';

    let mode = $derived(ui_store.right_panel_mode);
    let is_open = $derived(mode.type !== RightPanelModeType.CLOSED);

    // Watch for selection changes to open edit forms
    $effect(() => {
        const selected_type = selection_store.type;
        const selected_id = selection_store.id;

        if (selected_type === SelectionTypeEnum.NODE && selected_id) {
            ui_store.open_edit_node_form(selected_id);
        } else if (selected_type === SelectionTypeEnum.CONNECTION && selected_id) {
            ui_store.open_edit_connection_form(selected_id);
        }
    });
</script>

{#if is_open}
    <div class="right-panel">
        {#if mode.type === RightPanelModeType.CREATE_NODE}
            <CreateNodeForm />
        {:else if mode.type === RightPanelModeType.CREATE_CONNECTION}
            <CreateConnectionForm />
        {:else if mode.type === RightPanelModeType.EDIT_NODE}
            <EditNodeForm node_id={mode.node_id} />
        {:else if mode.type === RightPanelModeType.EDIT_CONNECTION}
            <EditConnectionForm connection_id={mode.connection_id} />
        {/if}
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

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .right-panel {
            width: 100%;
            max-width: 320px;
            bottom: 80px;
        }
    }
</style>
