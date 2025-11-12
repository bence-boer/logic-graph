<script lang="ts">
    /**
     * Dynamic form component that renders forms from FormDefinition.
     * Handles form state, validation, and submission.
     */
    import type { FormDefinition, FormContext } from '$lib/forms/types';
    import { create_form, type FormData } from '$lib/forms';
    import { FormActionVariant } from '$lib/forms/types';
    import DynamicFormField from './DynamicFormField.svelte';
    import Button from '$lib/components/ui/Button.svelte';

    interface Props {
        /** Form definition to render */
        definition: FormDefinition;
        /** Optional external submit handler */
        onsubmit?: (data: FormData) => void | Promise<void>;
        /** Optional cancel handler */
        oncancel?: () => void;
    }

    let { definition, onsubmit, oncancel }: Props = $props();

    // Create form context
    const form = create_form(definition) as FormContext<FormData>;

    // Get all fields (supporting both flat and sectioned layouts)
    let all_fields = $derived(definition.fields ?? []);

    /**
     * Handles form submission.
     */
    async function handle_submit() {
        try {
            // Custom onsubmit handler takes precedence
            if (onsubmit) {
                await onsubmit(form.state.data);
            } else {
                await form.submit_form();
            }
        } catch (error) {
            console.error('Form submission error:', error);
        }
    }

    /**
     * Handles action button clicks.
     */
    async function handle_action(action: (typeof definition.actions)[number]): Promise<void> {
        // Check if action should validate before executing
        if (action.validate && !form.validate_form()) {
            return;
        }

        // Execute custom handler if provided
        if (action.handler) {
            await action.handler(form.state.data);
            return;
        }

        // Check if this is a cancel action
        if (action.variant === FormActionVariant.SECONDARY && oncancel) {
            oncancel();
            return;
        }

        // Check if this is primary submit action
        if (action.variant === FormActionVariant.PRIMARY) {
            await handle_submit();
            return;
        }

        // For other actions, just execute payload if provided
        if (action.payload) {
            const payload = action.payload(form.state.data);
            console.log('Action payload:', payload);
            // TODO: Execute command when command system is integrated
        }
    }

    /**
     * Checks if an action should be visible.
     */
    function is_action_visible(action: (typeof definition.actions)[number]): boolean {
        if (!action.visible) return true;
        return action.visible(form.state.data);
    }

    /**
     * Checks if an action should be disabled.
     */
    function is_action_disabled(action: (typeof definition.actions)[number]): boolean {
        if (typeof action.disabled === 'function') {
            return action.disabled(form.state.data);
        }
        return action.disabled ?? false;
    }

    /**
     * Gets button variant for action.
     */
    function get_button_variant(
        action: (typeof definition.actions)[number]
    ): 'primary' | 'secondary' | 'danger' {
        switch (action.variant) {
            case FormActionVariant.PRIMARY:
                return 'primary';
            case FormActionVariant.DANGER:
                return 'danger';
            case FormActionVariant.SECONDARY:
            default:
                return 'secondary';
        }
    }
</script>

<div class="flex h-full flex-col">
    <!-- Form Header -->
    <div class="border-b border-(--border-default) p-3">
        <h2 class="text-lg font-semibold text-(--text-primary)">{definition.title}</h2>
        {#if definition.description}
            <p class="mt-1 text-sm text-(--text-secondary)">{definition.description}</p>
        {/if}
    </div>

    <!-- Form Fields -->
    <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
        {#each all_fields as field (field.name)}
            {#if !field.visible || field.visible(form.state.data)}
                <DynamicFormField
                    {field}
                    bind:value={form.state.data[field.name]}
                    error={form.state.errors[field.name]}
                    touched={form.state.touched.has(field.name)}
                    onchange={(value) => form.update_field(field.name, value)}
                    onblur={() => form.touch_field(field.name)}
                />
            {/if}
        {/each}
    </div>

    <!-- Form Actions -->
    <div
        class="flex items-center justify-end gap-2 border-t border-(--border-default) bg-(--bg-subtle) p-3"
    >
        {#each definition.actions as action}
            {#if is_action_visible(action)}
                <Button
                    variant={get_button_variant(action)}
                    disabled={is_action_disabled(action) || form.state.submitting}
                    onclick={() => handle_action(action)}
                >
                    {action.label}
                </Button>
            {/if}
        {/each}
    </div>
</div>
