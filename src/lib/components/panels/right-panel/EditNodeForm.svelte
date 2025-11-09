<script lang="ts">
    import FormField from '$lib/components/ui/FormField.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import Select from '$lib/components/ui/Select.svelte';
    import { graph_store } from '$lib/stores/graph.svelte';
    import { selection_store } from '$lib/stores/selection.svelte';
    import { toast_store } from '$lib/stores/toast.svelte';
    import { ui_store } from '$lib/stores/ui.svelte';
    import { ConnectionType } from '$lib/types/graph';
    import { AlertTriangle, ArrowDownRight, Pin, PinOff, Trash2, X, Plus } from '@lucide/svelte';

    interface Props {
        node_id: string;
    }

    let { node_id }: Props = $props();

    let node = $derived(graph_store.nodes.find((n) => n.id === node_id));
    
    // Organize connections by type and direction
    let reasons = $derived(
        graph_store.connections
            .filter((c) => c.type === ConnectionType.IMPLICATION && c.targets.includes(node_id))
            .flatMap((c) => c.sources.map((source_id) => ({ node_id: source_id, connection_id: c.id })))
    );

    let consequences = $derived(
        graph_store.connections
            .filter((c) => c.type === ConnectionType.IMPLICATION && c.sources.includes(node_id))
            .flatMap((c) => c.targets.map((target_id) => ({ node_id: target_id, connection_id: c.id })))
    );

    let contradictions = $derived(
        graph_store.connections
            .filter(
                (c) =>
                    c.type === ConnectionType.CONTRADICTION &&
                    (c.sources.includes(node_id) || c.targets.includes(node_id))
            )
            .flatMap((c) => {
                // Get the other nodes (not the current node)
                const other_nodes = [...c.sources, ...c.targets].filter((id) => id !== node_id);
                return other_nodes.map((other_id) => ({ node_id: other_id, connection_id: c.id }));
            })
    );

    let name = $state('');
    let description = $state('');
    
    // State for adding connections
    let is_adding_reason = $state(false);
    let is_adding_consequence = $state(false);
    let is_adding_contradiction = $state(false);
    let selected_node_for_connection = $state<string>('');
    let connection_mode = $state<'existing' | 'new'>('existing');
    let new_node_name = $state('');
    
    // Available nodes for connection (excluding current node)
    let available_nodes = $derived(
        graph_store.nodes
            .filter((n) => n.id !== node_id)
            .map((n) => ({ value: n.id, label: n.name }))
    );

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
            toast_store.error('Statement name is required');
            return;
        }

        if (name.length > 100) {
            toast_store.error('Statement name must be 100 characters or less');
            return;
        }

        if (description.length > 500) {
            toast_store.error('Statement description must be 500 characters or less');
            return;
        }

        graph_store.update_node(node.id, {
            name: name.trim(),
            description: description.trim()
        });

        toast_store.success(`Statement "${name.trim()}" updated successfully`);
    }

    function handle_pin_toggle() {
        if (!node) return;

        if (node.fx !== null && node.fx !== undefined) {
            // Unpin
            graph_store.update_node(node.id, {
                fx: null,
                fy: null
            });
            toast_store.info(`Statement "${node.name}" unpinned`);
        } else {
            // Pin at current position
            graph_store.update_node(node.id, {
                fx: node.x,
                fy: node.y
            });
            toast_store.info(`Statement "${node.name}" pinned`);
        }
    }

    function handle_delete() {
        if (!node) return;

        if (confirm(`Delete statement "${node.name}"?`)) {
            graph_store.remove_node(node.id);
            toast_store.success(`Statement "${node.name}" deleted`);
            close_panel();
        }
    }

    function handle_add_child_node() {
        if (!node) return;

        // Create a new statement as a child (conclusion)
        const new_node = graph_store.add_node({
            name: `Consequence of ${node.name}`,
            description: ''
        });

        // Create an implication connection from current statement to new statement
        graph_store.add_connection({
            type: ConnectionType.IMPLICATION,
            sources: [node.id],
            targets: [new_node.id]
        });

        toast_store.success(`Consequence statement created for "${node.name}"`);

        // Select the new statement and switch to edit mode
        selection_store.select_node(new_node.id);
        ui_store.open_edit_node_form(new_node.id);
    }

    function handle_add_contradiction_node() {
        if (!node) return;

        // Create a new statement as a contradiction
        const new_node = graph_store.add_node({
            name: `Contradicts ${node.name}`,
            description: ''
        });

        // Create a contradiction connection between current statement and new statement
        graph_store.add_connection({
            type: ConnectionType.CONTRADICTION,
            sources: [node.id],
            targets: [new_node.id]
        });

        toast_store.success(`Contradiction statement created for "${node.name}"`);

        // Select the new statement and switch to edit mode
        selection_store.select_node(new_node.id);
        ui_store.open_edit_node_form(new_node.id);
    }
    
    function handle_add_reason() {
        is_adding_reason = true;
        selected_node_for_connection = '';
        connection_mode = 'existing';
        new_node_name = '';
    }
    
    function handle_add_consequence() {
        is_adding_consequence = true;
        selected_node_for_connection = '';
        connection_mode = 'existing';
        new_node_name = '';
    }
    
    function handle_add_contradiction() {
        is_adding_contradiction = true;
        selected_node_for_connection = '';
        connection_mode = 'existing';
        new_node_name = '';
    }
    
    function handle_confirm_add_reason() {
        if (!node) return;
        
        let target_node_id: string;
        let target_node_name: string;
        
        if (connection_mode === 'new') {
            if (!new_node_name.trim()) {
                toast_store.error('Statement name is required');
                return;
            }
            // Create new statement
            const new_node = graph_store.add_node({
                name: new_node_name.trim(),
                description: ''
            });
            target_node_id = new_node.id;
            target_node_name = new_node_name.trim();
        } else {
            if (!selected_node_for_connection) return;
            target_node_id = selected_node_for_connection;
            const selected_node = graph_store.nodes.find((n) => n.id === selected_node_for_connection);
            target_node_name = selected_node?.name || 'Unknown';
        }
        
        graph_store.add_connection({
            type: ConnectionType.IMPLICATION,
            sources: [target_node_id],
            targets: [node.id]
        });
        
        toast_store.success(`Reason "${target_node_name}" added to "${node.name}"`);
        is_adding_reason = false;
        selected_node_for_connection = '';
        new_node_name = '';
    }
    
    function handle_confirm_add_consequence() {
        if (!node) return;
        
        let target_node_id: string;
        let target_node_name: string;
        
        if (connection_mode === 'new') {
            if (!new_node_name.trim()) {
                toast_store.error('Statement name is required');
                return;
            }
            // Create new statement
            const new_node = graph_store.add_node({
                name: new_node_name.trim(),
                description: ''
            });
            target_node_id = new_node.id;
            target_node_name = new_node_name.trim();
        } else {
            if (!selected_node_for_connection) return;
            target_node_id = selected_node_for_connection;
            const selected_node = graph_store.nodes.find((n) => n.id === selected_node_for_connection);
            target_node_name = selected_node?.name || 'Unknown';
        }
        
        graph_store.add_connection({
            type: ConnectionType.IMPLICATION,
            sources: [node.id],
            targets: [target_node_id]
        });
        
        toast_store.success(`Consequence "${target_node_name}" added to "${node.name}"`);
        is_adding_consequence = false;
        selected_node_for_connection = '';
        new_node_name = '';
    }
    
    function handle_confirm_add_contradiction() {
        if (!node) return;
        
        let target_node_id: string;
        let target_node_name: string;
        
        if (connection_mode === 'new') {
            if (!new_node_name.trim()) {
                toast_store.error('Statement name is required');
                return;
            }
            // Create new statement
            const new_node = graph_store.add_node({
                name: new_node_name.trim(),
                description: ''
            });
            target_node_id = new_node.id;
            target_node_name = new_node_name.trim();
        } else {
            if (!selected_node_for_connection) return;
            target_node_id = selected_node_for_connection;
            const selected_node = graph_store.nodes.find((n) => n.id === selected_node_for_connection);
            target_node_name = selected_node?.name || 'Unknown';
        }
        
        graph_store.add_connection({
            type: ConnectionType.CONTRADICTION,
            sources: [node.id],
            targets: [target_node_id]
        });
        
        toast_store.success(`Contradiction "${target_node_name}" added to "${node.name}"`);
        is_adding_contradiction = false;
        selected_node_for_connection = '';
        new_node_name = '';
    }
    
    function handle_cancel_add() {
        is_adding_reason = false;
        is_adding_consequence = false;
        is_adding_contradiction = false;
        selected_node_for_connection = '';
        new_node_name = '';
    }
    
    function handle_delete_connection(connection_id: string, connected_node_name: string) {
        if (!node) return;
        
        if (confirm(`Delete connection between "${node.name}" and "${connected_node_name}"?`)) {
            graph_store.remove_connection(connection_id);
            toast_store.success(`Connection to "${connected_node_name}" deleted`);
        }
    }
</script>

{#if node}
    <div class="flex h-full flex-col">
        <div class="flex items-center justify-between border-b border-(--border-default) p-3">
            <h3 class="m-0 text-lg font-semibold text-(--text-primary)">Edit Statement</h3>
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
                <div class="flex items-center justify-between">
                    <h3
                        class="m-0 text-sm font-semibold tracking-wide text-(--text-secondary) uppercase"
                    >
                        Reasons
                    </h3>
                    <button
                        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-1 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
                        onclick={handle_add_reason}
                        title="Add Reason"
                        aria-label="Add Reason"
                    >
                        <Plus size={16} />
                    </button>
                </div>
                {#if is_adding_reason}
                    <div class="flex flex-col gap-2 rounded-md border border-(--border-default) bg-(--bg-secondary) p-3">
                        <div class="flex gap-2">
                            <button
                                class="flex-1 cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-all duration-200 active:scale-98 {connection_mode === 'existing' ? 'border-(--accent-primary) bg-(--accent-primary) text-white' : 'border-(--border-default) bg-transparent text-(--text-primary) hover:bg-(--bg-tertiary)'}"
                                onclick={() => { connection_mode = 'existing'; }}
                            >
                                Existing Statement
                            </button>
                            <button
                                class="flex-1 cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-all duration-200 active:scale-98 {connection_mode === 'new' ? 'border-(--accent-primary) bg-(--accent-primary) text-white' : 'border-(--border-default) bg-transparent text-(--text-primary) hover:bg-(--bg-tertiary)'}"
                                onclick={() => { connection_mode = 'new'; }}
                            >
                                New Statement
                            </button>
                        </div>
                        {#if connection_mode === 'existing'}
                            <Select
                                bind:value={selected_node_for_connection}
                                options={available_nodes}
                                placeholder="Select a statement..."
                            />
                        {:else}
                            <Input
                                bind:value={new_node_name}
                                placeholder="Enter statement name..."
                                required
                            />
                        {/if}
                        <div class="flex gap-2">
                            <button
                                class="flex-1 cursor-pointer rounded-md border border-(--accent-primary) bg-(--accent-primary) px-3 py-1.5 text-sm text-white transition-all duration-200 hover:bg-purple-700 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
                                onclick={handle_confirm_add_reason}
                                disabled={connection_mode === 'existing' ? !selected_node_for_connection : !new_node_name.trim()}
                            >
                                Add
                            </button>
                            <button
                                class="cursor-pointer rounded-md border border-(--border-default) bg-transparent px-3 py-1.5 text-sm text-(--text-primary) transition-all duration-200 hover:bg-(--bg-tertiary) active:scale-98"
                                onclick={handle_cancel_add}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                {/if}
                {#if reasons.length > 0}
                    <div class="flex flex-col gap-1">
                        {#each reasons as reason}
                            {@const reason_node = graph_store.nodes.find((n) => n.id === reason.node_id)}
                            {#if reason_node}
                                <div
                                    class="flex items-center gap-2 rounded-md bg-(--bg-secondary) transition-colors duration-200 hover:bg-(--bg-tertiary)"
                                >
                                    <button
                                        class="flex flex-1 cursor-pointer items-center gap-2 px-3 py-2 text-left"
                                        onclick={() => {
                                            selection_store.select_node(reason_node.id);
                                            ui_store.open_edit_node_form(reason_node.id);
                                        }}
                                    >
                                        <span class="text-lg leading-none text-(--link-implication)">→</span>
                                        <span class="text-sm text-(--text-primary)">{reason_node.name}</span>
                                    </button>
                                    <button
                                        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-tertiary) transition-all duration-200 hover:text-(--accent-secondary) active:scale-98"
                                        onclick={() => handle_delete_connection(reason.connection_id, reason_node.name)}
                                        title="Delete connection"
                                        aria-label="Delete connection"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            {/if}
                        {/each}
                    </div>
                {:else if !is_adding_reason}
                    <p class="p-4 text-center text-sm text-(--text-tertiary)">This is an axiom of the system</p>
                {/if}
            </div>

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <h3
                        class="m-0 text-sm font-semibold tracking-wide text-(--text-secondary) uppercase"
                    >
                        Consequences
                    </h3>
                    <button
                        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-1 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
                        onclick={handle_add_consequence}
                        title="Add Consequence"
                        aria-label="Add Consequence"
                    >
                        <Plus size={16} />
                    </button>
                </div>
                {#if is_adding_consequence}
                    <div class="flex flex-col gap-2 rounded-md border border-(--border-default) bg-(--bg-secondary) p-3">
                        <div class="flex gap-2">
                            <button
                                class="flex-1 cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-all duration-200 active:scale-98 {connection_mode === 'existing' ? 'border-(--accent-primary) bg-(--accent-primary) text-white' : 'border-(--border-default) bg-transparent text-(--text-primary) hover:bg-(--bg-tertiary)'}"
                                onclick={() => { connection_mode = 'existing'; }}
                            >
                                Existing Statement
                            </button>
                            <button
                                class="flex-1 cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-all duration-200 active:scale-98 {connection_mode === 'new' ? 'border-(--accent-primary) bg-(--accent-primary) text-white' : 'border-(--border-default) bg-transparent text-(--text-primary) hover:bg-(--bg-tertiary)'}"
                                onclick={() => { connection_mode = 'new'; }}
                            >
                                New Statement
                            </button>
                        </div>
                        {#if connection_mode === 'existing'}
                            <Select
                                bind:value={selected_node_for_connection}
                                options={available_nodes}
                                placeholder="Select a statement..."
                            />
                        {:else}
                            <Input
                                bind:value={new_node_name}
                                placeholder="Enter statement..."
                                required
                            />
                        {/if}
                        <div class="flex gap-2">
                            <button
                                class="flex-1 cursor-pointer rounded-md border border-(--accent-primary) bg-(--accent-primary) px-3 py-1.5 text-sm text-white transition-all duration-200 hover:bg-purple-700 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
                                onclick={handle_confirm_add_consequence}
                                disabled={connection_mode === 'existing' ? !selected_node_for_connection : !new_node_name.trim()}
                            >
                                Add
                            </button>
                            <button
                                class="cursor-pointer rounded-md border border-(--border-default) bg-transparent px-3 py-1.5 text-sm text-(--text-primary) transition-all duration-200 hover:bg-(--bg-tertiary) active:scale-98"
                                onclick={handle_cancel_add}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                {/if}
                {#if consequences.length > 0}
                    <div class="flex flex-col gap-1">
                        {#each consequences as consequence}
                            {@const consequence_node = graph_store.nodes.find(
                                (n) => n.id === consequence.node_id
                            )}
                            {#if consequence_node}
                                <div
                                    class="flex items-center gap-2 rounded-md bg-(--bg-secondary) transition-colors duration-200 hover:bg-(--bg-tertiary)"
                                >
                                    <button
                                        class="flex flex-1 cursor-pointer items-center gap-2 px-3 py-2 text-left"
                                        onclick={() => {
                                            selection_store.select_node(consequence_node.id);
                                            ui_store.open_edit_node_form(consequence_node.id);
                                        }}
                                    >
                                        <span class="text-lg leading-none text-(--link-implication)">→</span>
                                        <span class="text-sm text-(--text-primary)"
                                            >{consequence_node.name}</span
                                        >
                                    </button>
                                    <button
                                        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-tertiary) transition-all duration-200 hover:text-(--accent-secondary) active:scale-98"
                                        onclick={() => handle_delete_connection(consequence.connection_id, consequence_node.name)}
                                        title="Delete connection"
                                        aria-label="Delete connection"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            {/if}
                        {/each}
                    </div>
                {:else if !is_adding_consequence}
                    <p class="p-4 text-center text-sm text-(--text-tertiary)">No consequences</p>
                {/if}
            </div>

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <h3
                        class="m-0 text-sm font-semibold tracking-wide text-(--text-secondary) uppercase"
                    >
                        Contradictions
                    </h3>
                    <button
                        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-1 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
                        onclick={handle_add_contradiction}
                        title="Add Contradiction"
                        aria-label="Add Contradiction"
                    >
                        <Plus size={16} />
                    </button>
                </div>
                {#if is_adding_contradiction}
                    <div class="flex flex-col gap-2 rounded-md border border-(--border-default) bg-(--bg-secondary) p-3">
                        <div class="flex gap-2">
                            <button
                                class="flex-1 cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-all duration-200 active:scale-98 {connection_mode === 'existing' ? 'border-(--accent-primary) bg-(--accent-primary) text-white' : 'border-(--border-default) bg-transparent text-(--text-primary) hover:bg-(--bg-tertiary)'}"
                                onclick={() => { connection_mode = 'existing'; }}
                            >
                                Existing Statement
                            </button>
                            <button
                                class="flex-1 cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-all duration-200 active:scale-98 {connection_mode === 'new' ? 'border-(--accent-primary) bg-(--accent-primary) text-white' : 'border-(--border-default) bg-transparent text-(--text-primary) hover:bg-(--bg-tertiary)'}"
                                onclick={() => { connection_mode = 'new'; }}
                            >
                                New Statement
                            </button>
                        </div>
                        {#if connection_mode === 'existing'}
                            <Select
                                bind:value={selected_node_for_connection}
                                options={available_nodes}
                                placeholder="Select a statement..."
                            />
                        {:else}
                            <Input
                                bind:value={new_node_name}
                                placeholder="Enter statement name..."
                                required
                            />
                        {/if}
                        <div class="flex gap-2">
                            <button
                                class="flex-1 cursor-pointer rounded-md border border-(--accent-primary) bg-(--accent-primary) px-3 py-1.5 text-sm text-white transition-all duration-200 hover:bg-purple-700 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
                                onclick={handle_confirm_add_contradiction}
                                disabled={connection_mode === 'existing' ? !selected_node_for_connection : !new_node_name.trim()}
                            >
                                Add
                            </button>
                            <button
                                class="cursor-pointer rounded-md border border-(--border-default) bg-transparent px-3 py-1.5 text-sm text-(--text-primary) transition-all duration-200 hover:bg-(--bg-tertiary) active:scale-98"
                                onclick={handle_cancel_add}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                {/if}
                {#if contradictions.length > 0}
                    <div class="flex flex-col gap-1">
                        {#each contradictions as contradiction}
                            {@const contradiction_node = graph_store.nodes.find(
                                (n) => n.id === contradiction.node_id
                            )}
                            {#if contradiction_node}
                                <div
                                    class="flex items-center gap-2 rounded-md bg-(--bg-secondary) transition-colors duration-200 hover:bg-(--bg-tertiary)"
                                >
                                    <button
                                        class="flex flex-1 cursor-pointer items-center gap-2 px-3 py-2 text-left"
                                        onclick={() => {
                                            selection_store.select_node(contradiction_node.id);
                                            ui_store.open_edit_node_form(contradiction_node.id);
                                        }}
                                    >
                                        <span class="text-lg leading-none text-(--link-contradiction)"
                                            >⟷</span
                                        >
                                        <span class="text-sm text-(--text-primary)"
                                            >{contradiction_node.name}</span
                                        >
                                    </button>
                                    <button
                                        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-tertiary) transition-all duration-200 hover:text-(--accent-secondary) active:scale-98"
                                        onclick={() => handle_delete_connection(contradiction.connection_id, contradiction_node.name)}
                                        title="Delete connection"
                                        aria-label="Delete connection"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            {/if}
                        {/each}
                    </div>
                {:else if !is_adding_contradiction}
                    <p class="p-4 text-center text-sm text-(--text-tertiary)">No contradictions</p>
                {/if}
            </div>

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <div class="flex flex-col gap-3">
                <h3
                    class="m-0 text-sm font-semibold tracking-wide text-(--text-secondary) uppercase"
                >
                    Quick Actions
                </h3>
                <div class="flex flex-col gap-2">
                    <button
                        class="flex w-full cursor-pointer items-center gap-2 rounded-md border border-(--border-default) bg-(--bg-secondary) px-3 py-2 text-left text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-tertiary) active:scale-98"
                        onclick={handle_add_child_node}
                        title="Add Child Node"
                        aria-label="Add Child Node"
                    >
                        <ArrowDownRight size={16} class="shrink-0" />
                        <div class="flex flex-col gap-0.5">
                            <span class="text-sm font-medium">Add Consequence</span>
                            <span class="text-xs text-(--text-tertiary)"
                                >Create a consequence</span
                            >
                        </div>
                    </button>
                    <button
                        class="flex w-full cursor-pointer items-center gap-2 rounded-md border border-(--border-default) bg-(--bg-secondary) px-3 py-2 text-left text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-tertiary) active:scale-98"
                        onclick={handle_add_contradiction_node}
                        title="Add Contradiction"
                        aria-label="Add Contradiction"
                    >
                        <AlertTriangle size={16} class="shrink-0" />
                        <div class="flex flex-col gap-0.5">
                            <span class="text-sm font-medium">Add Contradiction Statement</span>
                            <span class="text-xs text-(--text-tertiary)"
                                >Create a statement that contradicts this one</span
                            >
                        </div>
                    </button>
                </div>
            </div>

            <div class="my-(--spacing-sm) h-px bg-(--border-default)"></div>

            <div class="flex gap-1">
                <button
                    class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-(--text-primary) transition-all duration-200 hover:border-(--border-hover) hover:bg-(--bg-secondary) active:scale-98"
                    onclick={handle_pin_toggle}
                    title={node.fx !== null && node.fx !== undefined ? 'Unpin Statement' : 'Pin Statement'}
                    aria-label={node.fx !== null && node.fx !== undefined
                        ? 'Unpin Statement'
                        : 'Pin Statement'}
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
                    title="Delete Statement"
                    aria-label="Delete Statement"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    </div>
{:else}
    <div class="flex h-full flex-col">
        <div class="flex-1 p-3">
            <p class="p-4 text-center text-sm text-red-500">Statement not found</p>
        </div>
    </div>
{/if}
