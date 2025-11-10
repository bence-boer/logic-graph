<script lang="ts">
    import { CircleQuestionMark } from '@lucide/svelte';

    interface Props {
        on_show_help: () => void;
    }

    let { on_show_help }: Props = $props();
</script>

<div class="flex items-center gap-2 max-md:gap-0.5">
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98 max-md:p-1.5"
        onclick={on_show_help}
        title="Help (?)"
    >
        <CircleQuestionMark size={18} class="max-md:h-4 max-md:w-4" />
    </button>
</div>
