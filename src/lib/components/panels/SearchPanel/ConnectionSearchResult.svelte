<script lang="ts">
    import type { LogicConnection } from '$lib/types/graph';
    import { ConnectionType } from '$lib/types/graph';

    interface Props {
        connection: LogicConnection;
        onselect: (connection: LogicConnection) => void;
    }

    let { connection, onselect }: Props = $props();
</script>

<button
    class="flex w-full cursor-pointer items-start gap-2 rounded-md border border-(--border-default) bg-(--bg-secondary) p-2 text-left transition-all duration-200 hover:border-(--accent-primary) hover:bg-(--bg-primary)"
    onclick={() => onselect(connection)}
>
    <span
        class="shrink-0 text-xl leading-none {connection.type === ConnectionType.IMPLICATION
            ? 'text-(--link-implication)'
            : 'text-(--link-contradiction)'}"
    >
        {connection.type === ConnectionType.IMPLICATION ? '→' : '⟷'}
    </span>
    <div class="min-w-0 flex-1">
        <div class="mb-0.5 text-sm font-medium text-(--text-primary)">
            {connection.sources.length} source(s) → {connection.targets.length} target(s)
        </div>
        <div class="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-(--text-tertiary)">
            {connection.id}
        </div>
    </div>
</button>
