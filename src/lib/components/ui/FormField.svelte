<script lang="ts">
    interface Props {
        label?: string;
        error?: string;
        hint?: string;
        required?: boolean;
        children: import('svelte').Snippet;
    }

    let { label, error, hint, required = false, children }: Props = $props();

    const field_id = `field-${Math.random().toString(36).substring(2, 9)}`;
</script>

<div class="form-field">
    {#if label}
        <label class="field-label" for={field_id}>
            {label}
            {#if required}
                <span class="required">*</span>
            {/if}
        </label>
    {/if}
    <div class="field-content" id={field_id}>
        {@render children()}
    </div>
    {#if error}
        <div class="field-error" role="alert">
            {error}
        </div>
    {/if}
    {#if hint && !error}
        <div class="field-hint">
            {hint}
        </div>
    {/if}
</div>

<style>
    .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .field-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .required {
        color: var(--accent-secondary);
    }

    .field-content {
        display: contents;
    }

    .field-error {
        font-size: 0.75rem;
        color: var(--accent-secondary);
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
    }

    .field-error::before {
        content: '⚠';
        font-size: 0.875rem;
    }

    .field-hint {
        font-size: 0.75rem;
        color: var(--text-tertiary);
    }
</style>
