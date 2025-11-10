<script lang="ts">
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';

    interface Props {
        statement: string;
        details: string;
        onsave: () => void;
    }

    let { statement = $bindable(), details = $bindable(), onsave }: Props = $props();
</script>

<div class="flex flex-col gap-3">
    <Input bind:value={statement} label="Statement" required maxlength={100} onblur={onsave} />

    <Textarea
        bind:value={details}
        label="Details"
        placeholder="Enter details..."
        maxlength={500}
        rows={4}
        onblur={onsave}
    />
</div>
