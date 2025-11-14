<script lang="ts">
    import { X } from '@lucide/svelte';

    interface Props {
        value: string;
        onchange: (value: string) => void;
        on_clear: () => void;
    }

    let { value = $bindable(''), onchange, on_clear: onclear }: Props = $props();
</script>

<div class="relative">
    <input
        type="text"
        class="w-full rounded-md border border-(--border-default) bg-(--bg-secondary) px-4 py-2 pr-10 text-sm text-(--text-primary) transition-all duration-200 focus:border-(--accent-primary) focus:bg-(--bg-primary) focus:outline-none"
        placeholder="Search nodes and connections..."
        bind:value
        oninput={(e) => onchange(e.currentTarget.value)}
    />
    {#if value}
        <button
            class="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-sm text-(--text-secondary) transition-all duration-200 hover:bg-(--bg-secondary) hover:text-(--text-primary)"
            onclick={onclear}
            aria-label="Clear search"
            title="Clear search"
        >
            <X size={14} />
        </button>
    {/if}
</div>
