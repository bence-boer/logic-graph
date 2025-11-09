<script lang="ts">
    import Input from '$lib/components/ui/Input.svelte';
    import Select from '$lib/components/ui/Select.svelte';

    interface Props {
        mode: 'existing' | 'new';
        selected_node_id: string;
        new_node_name: string;
        available_nodes: Array<{ value: string; label: string }>;
        onmode_change: (mode: 'existing' | 'new') => void;
        onconfirm: () => void;
        oncancel: () => void;
    }

    let {
        mode = $bindable(),
        selected_node_id = $bindable(),
        new_node_name = $bindable(),
        available_nodes,
        onmode_change,
        onconfirm,
        oncancel
    }: Props = $props();

    let is_disabled = $derived(mode === 'existing' ? !selected_node_id : !new_node_name.trim());
</script>

<div
    class="flex flex-col gap-2 rounded-md border border-(--border-default) bg-(--bg-secondary) p-3"
>
    <div class="flex gap-2">
        <button
            class="flex-1 cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-all duration-200 active:scale-98 {mode ===
            'existing'
                ? 'border-(--accent-primary) bg-(--accent-primary) text-white'
                : 'border-(--border-default) bg-transparent text-(--text-primary) hover:bg-(--bg-tertiary)'}"
            onclick={() => onmode_change('existing')}
        >
            Existing Statement
        </button>
        <button
            class="flex-1 cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-all duration-200 active:scale-98 {mode ===
            'new'
                ? 'border-(--accent-primary) bg-(--accent-primary) text-white'
                : 'border-(--border-default) bg-transparent text-(--text-primary) hover:bg-(--bg-tertiary)'}"
            onclick={() => onmode_change('new')}
        >
            New Statement
        </button>
    </div>
    {#if mode === 'existing'}
        <Select
            bind:value={selected_node_id}
            options={available_nodes}
            placeholder="Select a statement..."
        />
    {:else}
        <Input bind:value={new_node_name} placeholder="Enter statement name..." required />
    {/if}
    <div class="flex gap-2">
        <button
            class="flex-1 cursor-pointer rounded-md border border-(--accent-primary) bg-(--accent-primary) px-3 py-1.5 text-sm text-white transition-all duration-200 hover:bg-purple-700 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
            onclick={onconfirm}
            disabled={is_disabled}
        >
            Add
        </button>
        <button
            class="cursor-pointer rounded-md border border-(--border-default) bg-transparent px-3 py-1.5 text-sm text-(--text-primary) transition-all duration-200 hover:bg-(--bg-tertiary) active:scale-98"
            onclick={oncancel}
        >
            Cancel
        </button>
    </div>
</div>
