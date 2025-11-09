<script lang="ts">
    import { CirclePlus, Link, Trash2 } from '@lucide/svelte';

    interface Props {
        on_add_node: () => void;
        on_add_connection: () => void;
        on_delete_selected: () => void;
    }

    let { on_add_node, on_add_connection, on_delete_selected }: Props = $props();
</script>

<div class="flex items-center gap-2">
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
        onclick={on_add_node}
        title="Add Statement"
    >
        <CirclePlus size={18} />
    </button>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
        onclick={on_add_connection}
        title="Add Connection"
    >
        <Link size={18} />
    </button>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--accent-secondary) hover:bg-[rgba(239,68,68,0.1)] hover:text-(--accent-secondary) active:scale-98"
        onclick={on_delete_selected}
        title="Delete Selected"
    >
        <Trash2 size={18} />
    </button>
</div>
