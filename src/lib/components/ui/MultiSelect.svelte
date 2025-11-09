<script lang="ts">
    interface SelectOption {
        value: string;
        label: string;
        description?: string;
    }

    interface Props {
        selected: string[];
        options: SelectOption[];
        onchange?: (selected: string[]) => void;
        label?: string;
        placeholder?: string;
        required?: boolean;
        disabled?: boolean;
        max_selections?: number;
    }

    let {
        selected = $bindable([]),
        options,
        onchange,
        label,
        placeholder = 'Select items...',
        required = false,
        disabled = false,
        max_selections
    }: Props = $props();

    let is_open = $state(false);
    let search_query = $state('');
    let dropdown_ref: HTMLDivElement | null = $state(null);

    // Filter options based on search
    let filtered_options = $derived(
        options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(search_query.toLowerCase()) ||
                opt.description?.toLowerCase().includes(search_query.toLowerCase())
        )
    );

    // Get selected option labels
    let selected_labels = $derived(
        selected
            .map((value) => options.find((opt) => opt.value === value)?.label)
            .filter(Boolean) as string[]
    );

    function toggle_dropdown() {
        if (!disabled) {
            is_open = !is_open;
            if (is_open) {
                search_query = '';
            }
        }
    }

    function toggle_option(value: string) {
        if (selected.includes(value)) {
            // Remove from selection
            selected = selected.filter((v) => v !== value);
        } else {
            // Add to selection (check max limit)
            if (!max_selections || selected.length < max_selections) {
                selected = [...selected, value];
            }
        }
        onchange?.(selected);
    }

    function remove_item(value: string) {
        selected = selected.filter((v) => v !== value);
        onchange?.(selected);
    }

    function handle_click_outside(event: MouseEvent) {
        if (dropdown_ref && !dropdown_ref.contains(event.target as Node)) {
            is_open = false;
        }
    }

    function handle_keydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            is_open = false;
        }
    }

    const multiselect_id = `multiselect-${Math.random().toString(36).substring(2, 9)}`;

    $effect(() => {
        if (is_open) {
            document.addEventListener('click', handle_click_outside);
            document.addEventListener('keydown', handle_keydown);
            return () => {
                document.removeEventListener('click', handle_click_outside);
                document.removeEventListener('keydown', handle_keydown);
            };
        }
    });
</script>

<div class="multiselect-wrapper" bind:this={dropdown_ref}>
    {#if label}
        <label class="multiselect-label" for={multiselect_id}>
            {label}
            {#if required}
                <span class="required">*</span>
            {/if}
        </label>
    {/if}

    <div class="multiselect">
        <!-- Selected chips -->
        {#if selected.length > 0}
            <div class="chips-container">
                {#each selected as value}
                    {@const option = options.find((opt) => opt.value === value)}
                    {#if option}
                        <div class="chip">
                            <span class="chip-label">{option.label}</span>
                            <button
                                class="chip-remove"
                                onclick={(e) => {
                                    e.stopPropagation();
                                    remove_item(value);
                                }}
                                aria-label="Remove {option.label}"
                                type="button"
                            >
                                ✕
                            </button>
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}

        <!-- Dropdown trigger -->
        <button
            id={multiselect_id}
            class="multiselect-trigger"
            class:disabled
            class:has-selections={selected.length > 0}
            onclick={toggle_dropdown}
            type="button"
        >
            <span class="trigger-text">
                {#if selected.length === 0}
                    {placeholder}
                {:else}
                    Add more...
                {/if}
            </span>
            <span class="trigger-icon">{is_open ? '▲' : '▼'}</span>
        </button>

        <!-- Dropdown menu -->
        {#if is_open}
            <div class="dropdown-menu">
                <!-- Search input -->
                <div class="search-container">
                    <input
                        type="text"
                        class="search-input"
                        bind:value={search_query}
                        placeholder="Search..."
                        onclick={(e) => e.stopPropagation()}
                    />
                </div>

                <!-- Options list -->
                <div class="options-list">
                    {#if filtered_options.length === 0}
                        <div class="no-results">No options found</div>
                    {:else}
                        {#each filtered_options as option}
                            {@const is_selected = selected.includes(option.value)}
                            {@const is_disabled =
                                !!max_selections &&
                                selected.length >= max_selections &&
                                !is_selected}
                            <button
                                class="option"
                                class:selected={is_selected}
                                class:disabled={is_disabled}
                                onclick={() => !is_disabled && toggle_option(option.value)}
                                type="button"
                            >
                                <input
                                    type="checkbox"
                                    checked={is_selected}
                                    disabled={is_disabled}
                                    onclick={(e) => e.preventDefault()}
                                    tabindex="-1"
                                />
                                <div class="option-content">
                                    <div class="option-label">{option.label}</div>
                                    {#if option.description}
                                        <div class="option-description">{option.description}</div>
                                    {/if}
                                </div>
                            </button>
                        {/each}
                    {/if}
                </div>

                {#if max_selections && selected.length > 0}
                    <div class="dropdown-footer">
                        Selected: {selected.length}
                        {#if max_selections}/ {max_selections}{/if}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .multiselect-wrapper {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        position: relative;
    }

    .multiselect-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .required {
        color: var(--accent-secondary);
    }

    .multiselect {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .chips-container {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
    }

    .chip {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--accent-primary);
        color: white;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .chip-label {
        line-height: 1;
    }

    .chip-remove {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        padding: 0;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 0.625rem;
        cursor: pointer;
        transition: background 0.2s ease;
    }

    .chip-remove:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    .multiselect-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 0.875rem;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
    }

    .multiselect-trigger:hover:not(.disabled) {
        border-color: var(--border-hover);
    }

    .multiselect-trigger:focus {
        outline: none;
        border-color: var(--accent-primary);
    }

    .multiselect-trigger.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .multiselect-trigger.has-selections {
        font-size: 0.75rem;
        color: var(--text-tertiary);
    }

    .trigger-text {
        flex: 1;
    }

    .trigger-icon {
        font-size: 0.75rem;
        color: var(--text-tertiary);
    }

    .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: var(--spacing-xs);
        background: var(--bg-elevated);
        backdrop-filter: blur(var(--blur-md));
        border: 1px solid var(--border-default);
        border-radius: 6px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        max-height: 300px;
        display: flex;
        flex-direction: column;
    }

    .search-container {
        padding: var(--spacing-sm);
        border-bottom: 1px solid var(--border-default);
    }

    .search-input {
        width: 100%;
        padding: var(--spacing-sm);
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: 4px;
        color: var(--text-primary);
        font-size: 0.875rem;
        font-family: inherit;
    }

    .search-input:focus {
        outline: none;
        border-color: var(--accent-primary);
    }

    .options-list {
        flex: 1;
        overflow-y: auto;
        padding: var(--spacing-xs);
    }

    .option {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-sm);
        width: 100%;
        padding: var(--spacing-sm);
        background: transparent;
        border: none;
        border-radius: 4px;
        color: var(--text-primary);
        font-size: 0.875rem;
        font-family: inherit;
        text-align: left;
        cursor: pointer;
        transition: background 0.2s ease;
    }

    .option:hover:not(.disabled) {
        background: var(--bg-secondary);
    }

    .option.selected {
        background: rgba(124, 58, 237, 0.1);
    }

    .option.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .option input[type='checkbox'] {
        margin-top: 2px;
        cursor: pointer;
    }

    .option-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .option-label {
        font-weight: 500;
    }

    .option-description {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        line-height: 1.4;
    }

    .no-results {
        padding: var(--spacing-md);
        text-align: center;
        color: var(--text-tertiary);
        font-size: 0.875rem;
    }

    .dropdown-footer {
        padding: var(--spacing-sm);
        border-top: 1px solid var(--border-default);
        font-size: 0.75rem;
        color: var(--text-tertiary);
        text-align: center;
    }

    /* Custom scrollbar */
    .options-list::-webkit-scrollbar {
        width: 6px;
    }

    .options-list::-webkit-scrollbar-track {
        background: transparent;
    }

    .options-list::-webkit-scrollbar-thumb {
        background: var(--border-default);
        border-radius: 3px;
    }

    .options-list::-webkit-scrollbar-thumb:hover {
        background: var(--border-hover);
    }
</style>
