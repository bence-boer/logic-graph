<script lang="ts">
    import { X } from '@lucide/svelte';

    interface Props {
        title: string;
        onclose: () => void;
    }

    let { title, onclose }: Props = $props();
</script>

<div class="flex items-center justify-between border-b border-(--border-default) p-3">
    <h3 class="m-0 text-lg font-semibold text-(--text-primary)">{title}</h3>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
        onclick={onclose}
        aria-label="Close"
        title="Close"
    >
        <X size={18} />
    </button>
</div>
