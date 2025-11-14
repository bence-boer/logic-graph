<script lang="ts">
    import Button from '$lib/components/ui/Button.svelte';
    import { X, type IconProps } from '@lucide/svelte';
    import type { Component } from 'svelte';

    interface Props {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        primary_icon?: Component<IconProps, {}, ''>;
        primary_disabled?: boolean;
        on_primary: () => void;
        on_cancel: () => void;
    }

    let {
        primary_icon: primary_icon_prop = undefined,
        primary_disabled = false,
        on_primary,
        on_cancel
    }: Props = $props();

    // Store the icon component reference - PascalCase for component usage
    // eslint-disable-next-line @typescript-eslint/naming-convention
    let PrimaryIcon = $derived(primary_icon_prop);
</script>

<div class="flex gap-1 border-t border-(--border-default) bg-(--bg-secondary) p-3">
    <Button variant="primary" size="sm" on_click={on_primary} disabled={primary_disabled}>
        {#if PrimaryIcon}
            <PrimaryIcon size={14} />
        {/if}
    </Button>
    <Button size="sm" icon on_click={on_cancel}>
        <X size={14} />
    </Button>
</div>
