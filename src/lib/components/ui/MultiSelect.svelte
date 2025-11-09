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

<div class="relative flex flex-col gap-1.5" bind:this={dropdown_ref}>
    {#if label}
        <label class="text-sm font-medium text-neutral-400" for={multiselect_id}>
            {label}
            {#if required}
                <span class="text-red-500">*</span>
            {/if}
        </label>
    {/if}

    <div class="flex flex-col gap-1.5">
        <!-- Selected chips -->
        {#if selected.length > 0}
            <div class="flex flex-wrap gap-1.5">
                {#each selected as value (value)}
                    {@const option = options.find((opt) => opt.value === value)}
                    {#if option}
                        <div
                            class="inline-flex items-center gap-1.5 rounded bg-purple-600 px-2.5 py-1.5 text-xs font-medium text-white"
                        >
                            <span class="leading-none">{option.label}</span>
                            <button
                                class="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-0 bg-white/20 p-0 text-[0.625rem] text-white transition-colors duration-200 hover:bg-white/30"
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
            class="flex w-full cursor-pointer items-center rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-left text-sm text-neutral-300 transition-colors {disabled
                ? 'cursor-not-allowed opacity-50'
                : 'hover:border-neutral-600 focus:border-purple-600 focus:outline-none'} {selected.length >
            0
                ? 'text-xs text-neutral-500'
                : ''}"
            onclick={toggle_dropdown}
            type="button"
        >
            <span class="flex-1">
                {#if selected.length === 0}
                    {placeholder}
                {:else}
                    Add more...
                {/if}
            </span>
            <span class="text-xs text-neutral-500">{is_open ? '▲' : '▼'}</span>
        </button>

        <!-- Dropdown menu -->
        {#if is_open}
            <div
                class="absolute top-full right-0 left-0 z-1000 mt-1.5 flex max-h-[300px] flex-col rounded-md border border-neutral-700 bg-neutral-800/80 shadow-[0_10px_15px_rgba(0,0,0,0.5)] backdrop-blur-md"
            >
                <!-- Search input -->
                <div class="border-b border-neutral-700 p-2">
                    <input
                        type="text"
                        class="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-2 font-sans text-sm text-white focus:border-purple-600 focus:outline-none"
                        bind:value={search_query}
                        placeholder="Search..."
                        onclick={(e) => e.stopPropagation()}
                    />
                </div>

                <!-- Options list -->
                <div
                    class="scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent hover:scrollbar-thumb-neutral-600 scrollbar-thumb-rounded flex-1 overflow-y-auto p-1.5"
                >
                    {#if filtered_options.length === 0}
                        <div class="p-4 text-center text-sm text-neutral-500">No options found</div>
                    {:else}
                        {#each filtered_options as option (option.value)}
                            {@const is_selected = selected.includes(option.value)}
                            {@const is_disabled =
                                !!max_selections &&
                                selected.length >= max_selections &&
                                !is_selected}
                            <button
                                class="flex w-full cursor-pointer items-start gap-2 rounded border-0 bg-transparent p-2 text-left font-sans text-sm text-white transition-colors duration-200 {is_selected
                                    ? 'bg-purple-600/10'
                                    : ''} {is_disabled
                                    ? 'cursor-not-allowed opacity-50'
                                    : 'hover:bg-neutral-800'}"
                                onclick={() => !is_disabled && toggle_option(option.value)}
                                type="button"
                            >
                                <input
                                    type="checkbox"
                                    checked={is_selected}
                                    disabled={is_disabled}
                                    onclick={(e) => e.preventDefault()}
                                    tabindex="-1"
                                    class="mt-0.5 cursor-pointer disabled:cursor-not-allowed"
                                />
                                <div class="flex flex-1 flex-col gap-1.5">
                                    <div class="font-medium">{option.label}</div>
                                    {#if option.description}
                                        <div class="text-xs leading-snug text-neutral-500">
                                            {option.description}
                                        </div>
                                    {/if}
                                </div>
                            </button>
                        {/each}
                    {/if}
                </div>

                {#if max_selections && selected.length > 0}
                    <div
                        class="border-t border-neutral-700 p-2 text-center text-xs text-neutral-500"
                    >
                        Selected: {selected.length}
                        {#if max_selections}/ {max_selections}{/if}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
