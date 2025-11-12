<script lang="ts">
    import { X } from '@lucide/svelte';
    import Button from '$lib/components/ui/Button.svelte';

    interface Props {
        onclose: () => void;
    }

    let { onclose }: Props = $props();
</script>

<div class="flex items-center justify-between border-b border-(--border-default) p-3">
    <h3 class="m-0 text-lg font-semibold text-(--text-primary)">Edit Statement</h3>
    <Button size="sm" icon onclick={onclose}>
        <X size={14} />
    </Button>
</div>
