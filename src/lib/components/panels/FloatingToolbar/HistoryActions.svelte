<script lang="ts">
    import { Undo2, Redo2 } from '@lucide/svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import { history_store } from '$lib/stores/history.svelte';
    import { command_executor } from '$lib/commands/executor';

    interface Props {
        icon_size: number;
    }
    let { icon_size }: Props = $props();

    async function handle_undo() {
        await command_executor.execute('history.undo', undefined);
    }

    async function handle_redo() {
        await command_executor.execute('history.redo', undefined);
    }

    const can_undo = $derived(history_store.can_undo);
    const can_redo = $derived(history_store.can_redo);
</script>

<div class="flex items-center gap-1.5 max-md:gap-0.5">
    <Button size="sm" icon onclick={handle_undo} disabled={!can_undo}>
        <Undo2 size={icon_size} />
    </Button>
    <Button size="sm" icon onclick={handle_redo} disabled={!can_redo}>
        <Redo2 size={icon_size} />
    </Button>
</div>
