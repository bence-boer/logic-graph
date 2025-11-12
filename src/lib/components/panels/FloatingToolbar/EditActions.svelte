<script lang="ts">
    import { Plus, Focus } from '@lucide/svelte';
    import Button from '$lib/components/ui/Button.svelte';

    interface Props {
        icon_size: number;
        on_create: () => void;
        on_recenter: () => void;
    }

    let { icon_size, on_create, on_recenter }: Props = $props();
</script>

<div class="flex items-center gap-1.5 max-md:gap-0.5">
    <Button variant="primary" size="sm" icon onclick={on_create}>
        <Plus size={icon_size} />
    </Button>
    <Button size="sm" icon onclick={on_recenter}>
        <Focus size={icon_size} />
    </Button>
</div>
