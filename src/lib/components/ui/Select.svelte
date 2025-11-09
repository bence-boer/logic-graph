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

<div class="select-wrapper">
    {#if label}
        <label class="select-label" for={select_id}>
            {label}
            {#if required}
                <span class="required">*</span>
            {/if}
        </label>
    {/if}
    <select
        id={select_id}
        class="select"
        {value}
        {disabled}
        {required}
        onchange={handle_change}
    >
        {#if placeholder && !value}
            <option value="" disabled selected>{placeholder}</option>
        {/if}
        {#each options as option}
            <option value={option.value}>
                {option.label}
            </option>
        {/each}
    </select>
</div>

<style>
    .select-wrapper {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .select-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .required {
        color: var(--accent-secondary);
    }

    .select {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 0.875rem;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.2s ease;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a0a0a0' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right var(--spacing-md) center;
        padding-right: calc(var(--spacing-md) * 2 + 12px);
    }

    .select:hover:not(:disabled) {
        border-color: var(--border-hover);
    }

    .select:focus {
        outline: none;
        border-color: var(--accent-primary);
        background-color: var(--bg-primary);
    }

    .select:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .select option {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }
</style>
