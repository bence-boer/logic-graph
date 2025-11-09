<script lang="ts">
    import { Plus, Download, Upload, Database, Trash2 } from '@lucide/svelte';

    interface Props {
        on_new_graph: () => void;
        on_import: () => void;
        on_export: () => void;
        on_load_sample: () => void;
        on_clear: () => void;
    }

    let { on_new_graph, on_import, on_export, on_load_sample, on_clear }: Props = $props();
</script>

<div class="flex items-center gap-1.5 max-md:gap-0.5">
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98 max-md:p-1.5"
        onclick={on_new_graph}
        title="New Graph"
    >
        <Plus size={18} class="max-md:h-4 max-md:w-4" />
    </button>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98 max-md:p-1.5"
        onclick={on_import}
        title="Import JSON"
    >
        <Download size={18} class="max-md:h-4 max-md:w-4" />
    </button>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98 max-md:p-1.5"
        onclick={on_export}
        title="Export"
    >
        <Upload size={18} class="max-md:h-4 max-md:w-4" />
    </button>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98 max-md:p-1.5"
        onclick={on_load_sample}
        title="Load Sample Data"
    >
        <Database size={18} class="max-md:h-4 max-md:w-4" />
    </button>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--accent-secondary) transition-all duration-200 hover:border-(--accent-secondary) hover:bg-[rgba(239,68,68,0.1)] active:scale-98 max-md:p-1.5"
        onclick={on_clear}
        title="Clear Graph"
    >
        <Trash2 size={18} class="max-md:h-4 max-md:w-4" />
    </button>
</div>
