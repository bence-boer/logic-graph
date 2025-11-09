<script lang="ts">
    interface Props {
        value: string;
        onchange?: (value: string) => void;
        placeholder?: string;
        label?: string;
        type?: 'text' | 'number' | 'email';
        disabled?: boolean;
        required?: boolean;
    }

    let {
        value = $bindable(''),
        onchange,
        placeholder = '',
        label,
        type = 'text',
        disabled = false,
        required = false
    }: Props = $props();

    function handle_input(e: Event) {
        const target = e.target as HTMLInputElement;
        value = target.value;
        onchange?.(target.value);
    }

    const input_id = `input-${Math.random().toString(36).substring(2, 9)}`;
</script>

<div class="input-wrapper">
    {#if label}
        <label class="input-label" for={input_id}>
            {label}
            {#if required}
                <span class="required">*</span>
            {/if}
        </label>
    {/if}
    <input
        id={input_id}
        class="input"
        {type}
        {value}
        {placeholder}
        {disabled}
        {required}
        oninput={handle_input}
    />
</div>

<style>
    .input-wrapper {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .input-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .required {
        color: var(--accent-secondary);
    }

    .input {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 0.875rem;
        font-family: inherit;
        transition: all 0.2s ease;
    }

    .input:hover:not(:disabled) {
        border-color: var(--border-hover);
    }

    .input:focus {
        outline: none;
        border-color: var(--accent-primary);
        background: var(--bg-primary);
    }

    .input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .input::placeholder {
        color: var(--text-tertiary);
    }
</style>
