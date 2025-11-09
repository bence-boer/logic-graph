<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { toast_store } from '$lib/stores/toast.svelte';
    import { ConnectionType } from '$lib/types/graph';
    import Button from '$lib/components/ui/Button.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';

    interface Props {
        node_id: string;
    }

    let { node_id }: Props = $props();

    let node = $derived(graph_store.nodes.find((n) => n.id === node_id));
    let connected_connections = $derived(
        graph_store.connections.filter(
            (c) => c.sources.includes(node_id) || c.targets.includes(node_id)
        )
    );

    let name = $state('');
    let description = $state('');

    // Initialize form values when node loads
    $effect(() => {
        if (node) {
            name = node.name;
            description = node.description;
        }
    });

    function close_panel() {
        ui_store.close_right_panel();
        selection_store.clear_selection();
    }

    function handle_save() {
        if (!node) return;

        if (!name.trim()) {
            toast_store.error('Node name is required');
            return;
        }

        if (name.length > 100) {
            toast_store.error('Node name must be 100 characters or less');
            return;
        }

        if (description.length > 500) {
            toast_store.error('Node description must be 500 characters or less');
            return;
        }

        graph_store.update_node(node.id, {
            name: name.trim(),
            description: description.trim()
        });

        toast_store.success('Node updated successfully');
    }

    function handle_pin_toggle() {
        if (!node) return;

        if (node.fx !== null && node.fx !== undefined) {
            // Unpin
            graph_store.update_node(node.id, { fx: null, fy: null });
            toast_store.info('Node unpinned');
        } else {
            // Pin at current position
            graph_store.update_node(node.id, {
                fx: node.x,
                fy: node.y
            });
            toast_store.info('Node pinned');
        }
    }

    function handle_delete() {
        if (!node) return;

        if (confirm(`Delete node "${node.name}"?`)) {
            graph_store.remove_node(node.id);
            toast_store.success('Node deleted');
            close_panel();
        }
    }
</script>

{#if node}
    <div class="form-container">
        <div class="form-header">
            <h3>Edit Node</h3>
            <button class="close-btn" onclick={close_panel} aria-label="Close">✕</button>
        </div>

        <div class="form-body">
            <div class="panel-section">
                <FormField label="ID">
                    <div class="field-value readonly">{node.id}</div>
                </FormField>

                <Input bind:value={name} label="Name" required onchange={handle_save} />

                <Textarea
                    bind:value={description}
                    label="Description"
                    placeholder="Enter node description..."
                    maxlength={500}
                    rows={4}
                />

                {#if node.x !== undefined && node.y !== undefined}
                    <FormField label="Position">
                        <div class="position-info">
                            <span>X: {Math.round(node.x)}</span>
                            <span>Y: {Math.round(node.y)}</span>
                        </div>
                    </FormField>
                {/if}

                <Button onclick={handle_pin_toggle}>
                    {node.fx !== null && node.fx !== undefined ? 'Unpin Node' : 'Pin Node'}
                </Button>
            </div>

            <div class="divider"></div>

            <div class="panel-section">
                <h3 class="section-title">Connected To</h3>
                {#if connected_connections.length > 0}
                    <div class="connections-list">
                        {#each connected_connections as conn}
                            <div class="connection-item">
                                <span class="connection-type {conn.type}">
                                    {conn.type === ConnectionType.IMPLICATION ? '→' : '⟷'}
                                </span>
                                <span class="connection-label">
                                    {conn.sources.length} source(s) → {conn.targets.length} target(s)
                                </span>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="empty-message">No connections</p>
                {/if}
            </div>

            <div class="divider"></div>

            <div class="panel-section">
                <Button variant="danger" onclick={handle_delete}>Delete Node</Button>
            </div>
        </div>
    </div>
{:else}
    <div class="form-container">
        <div class="form-body">
            <p class="error-message">Node not found</p>
        </div>
    </div>
{/if}

<style>
    .field-value {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 0.875rem;
        font-family: 'Monaco', 'Courier New', monospace;
    }

    .field-value.readonly {
        color: var(--text-tertiary);
    }

    .position-info {
        display: flex;
        gap: var(--spacing-md);
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: 6px;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .section-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0;
    }

    .connections-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .connection-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm);
        background: var(--bg-secondary);
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s ease;
    }

    .connection-item:hover {
        background: var(--bg-tertiary);
    }

    .connection-type {
        font-size: 1.25rem;
        line-height: 1;
    }

    .connection-type.implication {
        color: var(--link-implication);
    }

    .connection-type.contradiction {
        color: var(--link-contradiction);
    }

    .connection-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .empty-message {
        font-size: 0.875rem;
        color: var(--text-tertiary);
        text-align: center;
        padding: var(--spacing-md);
    }

    .error-message {
        font-size: 0.875rem;
        color: var(--error);
        text-align: center;
        padding: var(--spacing-md);
    }
</style>
