<script lang="ts">
    import type { LogicNode } from '$lib/types/graph';
    import type { NodeConnectionRelation } from '$lib/utils/node-connections';

    interface Props {
        node: LogicNode;
        reasons: NodeConnectionRelation[];
        consequences: NodeConnectionRelation[];
        contradictions: NodeConnectionRelation[];
        all_nodes: LogicNode[];
    }

    let { node, reasons, consequences, contradictions, all_nodes }: Props = $props();

    /**
     * Get node statements from NodeConnectionRelation array
     */
    function get_node_statements(relations: NodeConnectionRelation[]): string[] {
        if (!relations || !Array.isArray(relations)) return [];
        return relations
            .map((rel) => all_nodes.find((n) => n.id === rel.node_id)?.statement)
            .filter((statement): statement is string => !!statement);
    }

    let reason_statements = $derived(get_node_statements(reasons || []));
    let consequence_statements = $derived(get_node_statements(consequences || []));
    let contradiction_statements = $derived(get_node_statements(contradictions || []));
</script>

<div class="rounded-lg bg-(--bg-secondary) p-4">
    <h4 class="mb-3 text-sm font-semibold text-(--text-primary)">Formalized Statement</h4>

    <div class="space-y-3 text-sm text-(--text-secondary)">
        {#if reason_statements.length > 0}
            <div>
                <p class="mb-1 font-medium text-(--text-primary)">Given</p>
                <ul class="ml-4 space-y-1">
                    {#each reason_statements as reason_statement, idx (idx)}
                        <li class="list-disc">{reason_statement}</li>
                    {/each}
                </ul>
            </div>
        {/if}

        <div>
            <p class="mb-1 font-medium text-(--text-primary)">It is true that</p>
            <ul class="ml-4 space-y-1">
                <li class="list-disc">{node.statement}</li>
            </ul>
        </div>

        {#if consequence_statements.length > 0}
            <div>
                <p class="mb-1 font-medium text-(--text-primary)">Which implies</p>
                <ul class="ml-4 space-y-1">
                    {#each consequence_statements as consequence_statement, idx (idx)}
                        <li class="list-disc">{consequence_statement}</li>
                    {/each}
                </ul>
            </div>
        {/if}

        {#if contradiction_statements.length > 0}
            <div>
                <p class="mb-1 font-medium text-(--text-primary)">Which contradicts</p>
                <ul class="ml-4 space-y-1">
                    {#each contradiction_statements as contradiction_statement, idx (idx)}
                        <li class="list-disc">{contradiction_statement}</li>
                    {/each}
                </ul>
            </div>
        {/if}
    </div>
</div>
