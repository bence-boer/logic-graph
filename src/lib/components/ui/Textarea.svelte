<script lang="ts">
    interface Props {
        value: string;
        onchange?: (value: string) => void;
        oninput?: (value: string) => void;
        placeholder?: string;
        label?: string;
        rows?: number;
        disabled?: boolean;
        required?: boolean;
        maxlength?: number;
    }

    let {
        value = $bindable(''),
        onchange,
        oninput,
        placeholder = '',
        label,
        rows = 4,
        disabled = false,
        required = false,
        maxlength
    }: Props = $props();

    function handle_input(e: Event) {
        const target = e.target as HTMLTextAreaElement;
        value = target.value;
        oninput?.(target.value);
    }

    function handle_change(e: Event) {
        const target = e.target as HTMLTextAreaElement;
        onchange?.(target.value);
    }

    const textarea_id = `textarea-${Math.random().toString(36).substring(2, 9)}`;
    let char_count = $derived(maxlength ? value.length : null);
</script>

<div class="textarea-wrapper">
    {#if label}
        <div class="textarea-header">
            <label class="textarea-label" for={textarea_id}>
                {label}
                {#if required}
                    <span class="required">*</span>
                {/if}
            </label>
            {#if maxlength}
                <span class="char-count" class:over-limit={char_count && char_count > maxlength}>
                    {char_count}/{maxlength}
                </span>
            {/if}
        </div>
    {/if}
    <textarea
        id={textarea_id}
        class="textarea"
        {value}
        {placeholder}
        {disabled}
        {required}
        {rows}
        {maxlength}
        oninput={handle_input}
        onchange={handle_change}
    ></textarea>
</div>

<style>
    .textarea-wrapper {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .textarea-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .textarea-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .required {
        color: var(--accent-secondary);
    }

    .char-count {
        font-size: 0.75rem;
        color: var(--text-tertiary);
    }

    .char-count.over-limit {
        color: var(--accent-secondary);
    }

    .textarea {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 0.875rem;
        font-family: inherit;
        resize: vertical;
        min-height: 80px;
        transition: all 0.2s ease;
    }

    .textarea:hover:not(:disabled) {
        border-color: var(--border-hover);
    }

    .textarea:focus {
        outline: none;
        border-color: var(--accent-primary);
        background: var(--bg-primary);
    }

    .textarea:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .textarea::placeholder {
        color: var(--text-tertiary);
    }

    /* Custom scrollbar */
    .textarea::-webkit-scrollbar {
        width: 6px;
    }

    .textarea::-webkit-scrollbar-track {
        background: transparent;
    }

    .textarea::-webkit-scrollbar-thumb {
        background: var(--border-default);
        border-radius: 3px;
    }

    .textarea::-webkit-scrollbar-thumb:hover {
        background: var(--border-hover);
    }
</style>
