<script lang="ts">
    interface SelectOption {
        value: string;
        label: string;
    }

    interface Props {
        value: string;
        options: SelectOption[];
        onchange?: (value: string) => void;
        label?: string;
        placeholder?: string;
        required?: boolean;
        disabled?: boolean;
    }

    let {
        value = $bindable(''),
        options,
        onchange,
        label,
        placeholder = 'Select an option...',
        required = false,
        disabled = false
    }: Props = $props();

    function handle_change(e: Event) {
        const target = e.target as HTMLSelectElement;
        value = target.value;
        onchange?.(target.value);
    }

    const select_id = `select-${Math.random().toString(36).substring(2, 9)}`;
</script>

<div class="flex flex-col gap-1.5">
    {#if label}
        <label class="text-sm font-medium text-neutral-400" for={select_id}>
            {label}
            {#if required}
                <span class="text-red-500">*</span>
            {/if}
        </label>
    {/if}
    <select
        id={select_id}
        class="cursor-pointer appearance-none rounded-md border border-neutral-700 bg-neutral-800 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2012%2012%27%3E%3Cpath%20fill=%27%23a0a0a0%27%20d=%27M6%209L1%204h10z%27/%3E%3C/svg%3E')] bg-[right_1rem_center] bg-no-repeat px-4 py-2 pr-10 font-sans text-sm text-white transition-all duration-200 hover:border-neutral-600 focus:border-purple-600 focus:bg-neutral-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        {value}
        {disabled}
        {required}
        onchange={handle_change}
    >
        {#if placeholder && !value}
            <option value="" disabled selected>{placeholder}</option>
        {/if}
        {#each options as option (option.value)}
            <option value={option.value} class="bg-neutral-800 text-white">
                {option.label}
            </option>
        {/each}
    </select>
</div>
