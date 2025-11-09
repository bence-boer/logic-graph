<script lang="ts">
    import { ui_store } from '$lib/stores/ui.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { RightPanelModeType, SelectionTypeEnum } from '$lib/types/graph';
    import CreateNodeForm from './right-panel/CreateNodeForm.svelte';
    import CreateConnectionForm from './right-panel/CreateConnectionForm.svelte';
    import EditNodeForm from './right-panel/EditNodeForm';
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
    <!-- Mobile backdrop overlay -->
    <button
        class="fixed inset-0 z-890 hidden bg-black/50 backdrop-blur-sm max-md:block"
        onclick={() => ui_store.close_right_panel()}
        aria-label="Close panel"
    ></button>

    <div
        class="fixed top-0 right-0 bottom-0 z-900 flex w-[360px] animate-[slide-in_0.3s_ease] flex-col border border-r-0 border-(--border-default) bg-(--bg-elevated) shadow-(--shadow-sm) backdrop-blur-md max-md:top-1/2 max-md:right-auto max-md:bottom-auto max-md:left-1/2 max-md:h-[90vh] max-md:max-h-[600px] max-md:w-[90vw] max-md:max-w-md max-md:-translate-x-1/2 max-md:-translate-y-1/2 max-md:rounded-xl max-md:border"
    >
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
    @keyframes slide-in {
        from {
            transform: translateX(100%);
        }
        to {
            transform: translateX(0);
        }
    }
</style>
