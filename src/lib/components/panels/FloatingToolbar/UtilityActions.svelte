<script lang="ts">
    import { Search, HelpCircle } from '@lucide/svelte';

    interface Props {
        on_toggle_search: () => void;
        on_show_help: () => void;
        search_panel_open: boolean;
    }

    let { on_toggle_search, on_show_help, search_panel_open }: Props = $props();
</script>

<div class="flex items-center gap-2 max-md:gap-0.5">
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98 max-md:p-1.5 {search_panel_open
            ? 'border-(--border-hover) bg-(--bg-secondary)'
            : ''}"
        onclick={on_toggle_search}
        title="Search (Ctrl+F)"
    >
        <Search size={18} class="max-md:h-4 max-md:w-4" />
    </button>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98 max-md:p-1.5"
        onclick={on_show_help}
        title="Help (?)"
    >
        <HelpCircle size={18} class="max-md:h-4 max-md:w-4" />
    </button>
</div>
