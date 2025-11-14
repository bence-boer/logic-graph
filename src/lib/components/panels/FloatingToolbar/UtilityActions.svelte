<script lang="ts">
    import { CircleQuestionMark } from '@lucide/svelte';
    import Button from '$lib/components/ui/Button.svelte';

    interface Props {
        icon_size: number;
        on_show_help: () => void;
    }

    let { icon_size, on_show_help }: Props = $props();
</script>

<div class="flex items-center gap-1.5 max-md:gap-0.5">
    <Button size="sm" icon on_click={on_show_help}>
        <CircleQuestionMark size={icon_size} />
    </Button>
</div>
