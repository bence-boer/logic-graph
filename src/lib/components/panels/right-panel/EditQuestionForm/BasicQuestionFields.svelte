<script lang="ts">
    import FormField from '$lib/components/ui/FormField.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';

    interface Props {
        statement: string;
        details: string;
    }

    let { statement = $bindable(), details = $bindable() }: Props = $props();

    const MAX_STATEMENT_LENGTH = 100;
    const MAX_DETAILS_LENGTH = 500;

    let statement_error = $derived(
        statement.trim().length === 0 ? 'Question is required' : undefined
    );
</script>

<FormField label="Question" required error={statement_error}>
    <Input
        bind:value={statement}
        maxlength={MAX_STATEMENT_LENGTH}
        placeholder="What is the question?"
    />
    <div class="mt-1 text-right text-xs text-(--text-tertiary)">
        {statement.length}/{MAX_STATEMENT_LENGTH}
    </div>
</FormField>

<FormField label="Details">
    <Textarea
        bind:value={details}
        maxlength={MAX_DETAILS_LENGTH}
        placeholder="Additional context or clarification (optional)"
        rows={4}
    />
    <div class="mt-1 text-right text-xs text-(--text-tertiary)">
        {details.length}/{MAX_DETAILS_LENGTH}
    </div>
</FormField>
