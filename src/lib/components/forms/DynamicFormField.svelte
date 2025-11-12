<script lang="ts">
    /**
     * Generic form field renderer component.
     * Renders different field types based on FormField configuration.
     */
    import type { FormField as FormFieldDef, FormFieldValue, FieldOption } from '$lib/forms/types';
    import { FieldType } from '$lib/forms/types';
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import Select from '$lib/components/ui/Select.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';

    interface Props {
        /** Field definition */
        field: FormFieldDef;
        /** Current field value */
        value: FormFieldValue;
        /** Error message for this field */
        error?: string;
        /** Whether the field has been touched */
        touched?: boolean;
        /** Callback when value changes */
        onchange: (value: FormFieldValue) => void;
        /** Callback when field loses focus */
        onblur?: () => void;
    }

    let { field, value = $bindable(), error, touched = false, onchange, onblur }: Props = $props();

    // Get options if they exist (either static array or function)
    let options = $derived<FieldOption[]>(
        typeof field.options === 'function' ? field.options({}) : (field.options ?? [])
    );

    // Only show error if field has been touched
    let display_error = $derived(touched && error ? error : undefined);

    function handle_change(new_value: FormFieldValue) {
        onchange(new_value);
    }

    function handle_blur() {
        onblur?.();
    }

    // Convert options to Select format
    let select_options = $derived(
        options.map((opt) => ({
            value: String(opt.value),
            label: opt.label,
            disabled: opt.disabled
        }))
    );
</script>

<FormField label={field.label} error={display_error} hint={field.hint} required={field.required}>
    {#if field.type === FieldType.TEXT}
        <Input
            value={String(value ?? '')}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled}
            maxlength={field.max_length}
            onchange={(val) => handle_change(val)}
            onblur={handle_blur}
        />
    {:else if field.type === FieldType.TEXTAREA}
        <Textarea
            value={String(value ?? '')}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled}
            rows={field.rows}
            maxlength={field.max_length}
            onchange={(val) => handle_change(val)}
            onblur={handle_blur}
        />
    {:else if field.type === FieldType.NUMBER}
        <Input
            type="number"
            value={String(value ?? '')}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled}
            maxlength={field.max_length}
            onchange={(val) => handle_change(Number(val))}
            onblur={handle_blur}
        />
    {:else if field.type === FieldType.CHECKBOX}
        <label class="flex items-center gap-2">
            <input
                type="checkbox"
                checked={value === true}
                disabled={field.disabled}
                onchange={(e) => handle_change(e.currentTarget.checked)}
                onblur={handle_blur}
                class="rounded border-(--border-default) text-(--accent-primary)"
            />
            <span class="text-sm">{field.label}</span>
        </label>
    {:else if field.type === FieldType.SELECT}
        <Select
            value={String(value ?? '')}
            options={select_options}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled}
            onchange={(val) => handle_change(val)}
        />
    {:else}
        <div class="text-sm text-(--text-tertiary)">
            Unsupported field type: {field.type}
        </div>
    {/if}
</FormField>
