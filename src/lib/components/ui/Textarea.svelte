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

<div class="flex flex-col gap-1.5">
    {#if label}
        <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-neutral-400" for={textarea_id}>
                {label}
                {#if required}
                    <span class="text-red-500">*</span>
                {/if}
            </label>
            {#if maxlength}
                <span
                    class="text-xs {char_count && char_count > maxlength
                        ? 'text-red-500'
                        : 'text-neutral-500'}"
                >
                    {char_count}/{maxlength}
                </span>
            {/if}
        </div>
    {/if}
    <textarea
        id={textarea_id}
        class="scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent hover:scrollbar-thumb-neutral-600 scrollbar-thumb-rounded min-h-20 resize-y rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 font-sans text-sm text-white transition-all duration-200 placeholder:text-neutral-500 hover:border-neutral-600 focus:border-purple-600 focus:bg-neutral-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
