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

    function handle_input(event: Event) {
        const target = event.target as HTMLInputElement;
        value = target.value;
        onchange?.(target.value);
    }

    const input_id = `input-${Math.random().toString(36).substring(2, 9)}`;
</script>

<div class="flex flex-col gap-1.5">
    {#if label}
        <label class="text-sm font-medium text-neutral-400" for={input_id}>
            {label}
            {#if required}
                <span class="text-red-500">*</span>
            {/if}
        </label>
    {/if}
    <input
        id={input_id}
        class="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 font-sans text-sm text-white transition-all duration-200 placeholder:text-neutral-500 hover:border-neutral-600 focus:border-accent-600 focus:bg-neutral-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        {type}
        {value}
        {placeholder}
        {disabled}
        {required}
        oninput={handle_input}
    />
</div>
