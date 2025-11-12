<script lang="ts">
    import { CirclePlus, CircleHelp, Link, Focus } from '@lucide/svelte';

    interface Props {
        on_add_node: () => void;
        on_add_question: () => void;
        on_add_connection: () => void;
        on_recenter: () => void;
    }

    let { on_add_node, on_add_question, on_add_connection, on_recenter }: Props = $props();
</script>

<div class="flex items-center gap-2 max-md:gap-0.5">
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98 max-md:p-1.5"
        onclick={on_add_node}
        title="Add Statement"
    >
        <CirclePlus size={18} class="max-md:h-4 max-md:w-4" />
    </button>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98 max-md:p-1.5"
        onclick={on_add_question}
        title="Add Question"
    >
        <CircleHelp size={18} class="max-md:h-4 max-md:w-4" />
    </button>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98 max-md:p-1.5"
        onclick={on_add_connection}
        title="Add Connection"
    >
        <Link size={18} class="max-md:h-4 max-md:w-4" />
    </button>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98 max-md:p-1.5"
        onclick={on_recenter}
        title="Recenter View"
    >
        <Focus size={18} class="max-md:h-4 max-md:w-4" />
    </button>
</div>
