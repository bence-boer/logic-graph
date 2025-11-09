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

<div class="flex flex-col gap-1.5">
    {#if label}
        <label class="text-sm font-medium text-neutral-400" for={field_id}>
            {label}
            {#if required}
                <span class="text-red-500">*</span>
            {/if}
        </label>
    {/if}
    <div class="contents" id={field_id}>
        {@render children()}
    </div>
    {#if error}
        <div
            class="flex items-center gap-1.5 text-xs text-red-500 before:text-sm before:content-['⚠']"
            role="alert"
        >
            {error}
        </div>
    {/if}
    {#if hint && !error}
        <div class="text-xs text-neutral-500">
            {hint}
        </div>
    {/if}
</div>
