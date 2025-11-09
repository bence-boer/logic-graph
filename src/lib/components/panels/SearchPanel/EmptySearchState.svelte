<script lang="ts">
    interface Props {
        query: string;
    }

    let { query }: Props = $props();
</script>

<div class="p-6 text-center text-sm text-(--text-tertiary)">
    <p>No results found for "{query}"</p>
</div>
