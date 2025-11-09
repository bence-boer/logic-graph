<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { toast_store } from '$lib/stores/toast.svelte';
    import { ConnectionType } from '$lib/types/graph';
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import FormField from '$lib/components/ui/FormField.svelte';
    import { Pin, PinOff, Trash2, X } from '@lucide/svelte';

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
            graph_store.update_node(node.id, {
                fx: null,
                fy: null
            });
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
    <div class="flex h-full flex-col">
        <div class="flex items-center justify-between border-b border-(--border-default) p-3">
            <h3 class="m-0 text-lg font-semibold text-(--text-primary)">Edit Node</h3>
            <button
                class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
                onclick={close_panel}
                aria-label="Close"
                title="Close"
            >
                <X size={18} />
            </button>
        </div>

        <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
            <div class="flex flex-col gap-3">
                <FormField label="ID">
                    <div
                        class="rounded-md border border-(--border-default) bg-(--bg-secondary) px-4 py-2 font-mono text-sm text-(--text-tertiary)"
                    >
                        {node.id}
                    </div>
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
                        <div
                            class="flex gap-4 rounded-md bg-(--bg-secondary) px-4 py-2 text-sm text-(--text-secondary)"
                        >
                            <span>X: {Math.round(node.x)}</span>
                            <span>Y: {Math.round(node.y)}</span>
                        </div>
                    </FormField>
                {/if}
            </div>

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <div class="flex flex-col gap-3">
                <h3
                    class="m-0 text-sm font-semibold tracking-wide text-(--text-secondary) uppercase"
                >
                    Connected To
                </h3>
                {#if connected_connections.length > 0}
                    <div class="flex flex-col gap-1">
                        {#each connected_connections as conn}
                            <div
                                class="flex cursor-pointer items-center gap-2 rounded-md bg-(--bg-secondary) px-2 py-2 transition-colors duration-200 hover:bg-(--bg-tertiary)"
                            >
                                <span
                                    class="text-xl leading-none {conn.type ===
                                    ConnectionType.IMPLICATION
                                        ? 'text-(--link-implication)'
                                        : 'text-(--link-contradiction)'}"
                                >
                                    {conn.type === ConnectionType.IMPLICATION ? '→' : '⟷'}
                                </span>
                                <span class="text-sm text-(--text-secondary)">
                                    {conn.sources.length} source(s) → {conn.targets.length} target(s)
                                </span>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="p-4 text-center text-sm text-(--text-tertiary)">No connections</p>
                {/if}
            </div>

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <div class="flex gap-1">
                <button
                    class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
                    onclick={handle_pin_toggle}
                    title={node.fx !== null && node.fx !== undefined ? 'Unpin Node' : 'Pin Node'}
                    aria-label={node.fx !== null && node.fx !== undefined
                        ? 'Unpin Node'
                        : 'Pin Node'}
                >
                    {#if node.fx !== null && node.fx !== undefined}
                        <PinOff size={18} />
                    {:else}
                        <Pin size={18} />
                    {/if}
                </button>
                <button
                    class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--accent-secondary) transition-all duration-200 hover:border-(--accent-secondary) hover:bg-[rgba(239,68,68,0.1)] active:scale-98"
                    onclick={handle_delete}
                    title="Delete Node"
                    aria-label="Delete Node"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    </div>
{:else}
    <div class="flex h-full flex-col">
        <div class="flex-1 p-3">
            <p class="p-4 text-center text-sm text-red-500">Node not found</p>
        </div>
    </div>
{/if}
