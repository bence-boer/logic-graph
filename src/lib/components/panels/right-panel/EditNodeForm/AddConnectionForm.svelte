<script lang="ts">
    import Button from '$lib/components/ui/Button.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import Select from '$lib/components/ui/Select.svelte';

    interface Props {
        mode: 'existing' | 'new';
        selected_node_id: string;
        new_node_statement: string;
        available_nodes: Array<{ value: string; label: string }>;
        existing_label?: string;
        new_label?: string;
        select_placeholder?: string;
        input_placeholder?: string;
        onmode_change: (mode: 'existing' | 'new') => void;
        onconfirm: () => void;
        oncancel: () => void;
    }

    let {
        mode = $bindable(),
        selected_node_id = $bindable(),
        new_node_statement = $bindable(),
        available_nodes,
        existing_label = 'Existing Statement',
        new_label = 'New Statement',
        select_placeholder = 'Select a statement...',
        input_placeholder = 'Enter statement...',
        onmode_change,
        onconfirm,
        oncancel
    }: Props = $props();

    let is_disabled = $derived(
        mode === 'existing' ? !selected_node_id : !new_node_statement.trim()
    );
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
            {existing_label}
        </button>
        <button
            class="flex-1 cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-all duration-200 active:scale-98 {mode ===
            'new'
                ? 'border-(--accent-primary) bg-(--accent-primary) text-white'
                : 'border-(--border-default) bg-transparent text-(--text-primary) hover:bg-(--bg-tertiary)'}"
            onclick={() => onmode_change('new')}
        >
            {new_label}
        </button>
    </div>
    {#if mode === 'existing'}
        <Select
            bind:value={selected_node_id}
            options={available_nodes}
            placeholder={select_placeholder}
        />
    {:else}
        <Input
            bind:value={new_node_statement}
            placeholder={input_placeholder}
            required
            maxlength={100}
        />
    {/if}
    <div class="flex gap-2">
        <Button variant="primary" size="sm" on_click={onconfirm} disabled={is_disabled}>Add</Button>
        <Button variant="secondary" size="sm" on_click={oncancel}>Cancel</Button>
    </div>
</div>
