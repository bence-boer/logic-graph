<script lang="ts">
    import { X } from '@lucide/svelte';
    import type { Component } from 'svelte';

    interface Props {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        primary_icon?: Component<any>;
        primary_label: string;
        primary_disabled?: boolean;
        onprimary: () => void;
        oncancel: () => void;
    }

    let {
        primary_icon: primary_icon_prop = undefined,
        primary_label,
        primary_disabled = false,
        onprimary,
        oncancel
    }: Props = $props();

    // Store the icon component reference - PascalCase for component usage
    // eslint-disable-next-line @typescript-eslint/naming-convention
    let PrimaryIcon = $derived(primary_icon_prop);
</script>

<div class="flex gap-1 border-t border-(--border-default) bg-(--bg-secondary) p-3">
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--accent-primary) transition-all duration-200 hover:border-(--accent-primary) hover:bg-[rgba(139,92,246,0.1)] active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
        onclick={onprimary}
        disabled={primary_disabled}
        title={primary_label}
        aria-label={primary_label}
    >
        {#if PrimaryIcon}
            <PrimaryIcon size={18} />
        {/if}
    </button>
    <button
        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-elevated) active:scale-98"
        onclick={oncancel}
        title="Cancel"
        aria-label="Cancel"
    >
        <X size={18} />
    </button>
</div>
