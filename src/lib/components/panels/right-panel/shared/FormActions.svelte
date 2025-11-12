<script lang="ts">
    import { X } from '@lucide/svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import type { Component } from 'svelte';

    interface Props {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        primary_icon?: Component<any>;
        primary_disabled?: boolean;
        onprimary: () => void;
        oncancel: () => void;
    }

    let {
        primary_icon: primary_icon_prop = undefined,
        primary_disabled = false,
        onprimary,
        oncancel
    }: Props = $props();

    // Store the icon component reference - PascalCase for component usage
    // eslint-disable-next-line @typescript-eslint/naming-convention
    let PrimaryIcon = $derived(primary_icon_prop);
</script>

<div class="flex gap-1 border-t border-(--border-default) bg-(--bg-secondary) p-3">
    <Button variant="primary" size="sm" onclick={onprimary} disabled={primary_disabled}>
        {#if PrimaryIcon}
            <PrimaryIcon size={14} />
        {/if}
    </Button>
    <Button size="sm" icon onclick={oncancel}>
        <X size={14} />
    </Button>
</div>
