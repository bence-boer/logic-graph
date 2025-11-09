<script lang="ts">
    import { Plus, Download, Upload } from '@lucide/svelte';

    interface Props {
        on_new_graph: () => void;
        on_import: () => void;
        on_export: () => void;
    }

    let { on_new_graph, on_import, on_export }: Props = $props();
</script>

<div class="flex items-center gap-1.5">
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
        onclick={on_new_graph}
        title="New Graph"
    >
        <Plus size={18} />
    </button>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
        onclick={on_import}
        title="Import JSON"
    >
        <Download size={18} />
    </button>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
        onclick={on_export}
        title="Export"
    >
        <Upload size={18} />
    </button>
</div>
