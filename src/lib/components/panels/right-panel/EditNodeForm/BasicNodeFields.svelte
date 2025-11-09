<script lang="ts">
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';
    import type { LogicNode } from '$lib/types/graph';

    interface Props {
        node: LogicNode;
        name: string;
        description: string;
        onsave: () => void;
    }

    let { node, name = $bindable(), description = $bindable(), onsave }: Props = $props();
</script>

<div class="flex flex-col gap-3">
    <Input bind:value={name} label="Name" required onchange={onsave} />

    <Textarea
        bind:value={description}
        label="Description"
        placeholder="Enter node description..."
        maxlength={500}
        rows={4}
    />

    {#if node.x !== undefined && node.y !== undefined}
        <FormField label="Position">
            <div
                class="flex gap-4 rounded-md bg-(--bg-secondary) px-4 py-2 text-sm text-(--text-secondary)"
            >
                <span>X: {Math.round(node.x)}</span>
                <span>Y: {Math.round(node.y)}</span>
            </div>
        </FormField>
    {/if}
</div>
