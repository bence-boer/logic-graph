<script lang="ts">
    import Button from '$lib/components/ui/Button.svelte';
    import { FlaskConical, Import, Save, Trash2 } from '@lucide/svelte';

    interface Props {
        icon_size: number;
        on_import: () => void;
        on_export: () => void;
        on_load_sample: () => void;
        on_clear: () => void;
    }

    let { icon_size, on_import, on_export, on_load_sample, on_clear }: Props = $props();
</script>

<div class="flex items-center gap-1.5 max-md:gap-0.5">
    <Button size="sm" icon on_click={on_load_sample}>
        <FlaskConical size={icon_size} />
    </Button>
    <Button size="sm" icon on_click={on_import}>
        <Import size={icon_size} />
    </Button>
    <Button size="sm" icon on_click={on_export}>
        <Save size={icon_size} />
    </Button>
    <Button variant="danger" size="sm" icon on_click={on_clear}>
        <Trash2 size={icon_size} />
    </Button>
</div>
