<script lang="ts">
    import { graph_store } from '$lib/stores/graph.svelte';
    import { loading_store } from '$lib/stores/loading.svelte';
    import { notification_store } from '$lib/stores/notification.svelte';
    import {
        download_graph_as_json,
        download_as_svg,
        download_as_png,
        download_as_jpeg,
        download_as_html
    } from '$lib/utils/export';
    import { X, Download } from '@lucide/svelte';

    interface Props {
        is_open: boolean;
        onclose: () => void;
    }

    let { is_open = $bindable(false), onclose }: Props = $props();

    let filename = $state('logic-graph');
    let export_format = $state<'json' | 'svg' | 'png' | 'jpeg' | 'html'>('json');
    let is_exporting = $state(false);

    function handle_close() {
        is_open = false;
        onclose?.();
    }

    function handle_backdrop_click(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            handle_close();
        }
    }

    async function handle_export() {
        is_exporting = true;
        loading_store.start(`Exporting as ${export_format.toUpperCase()}...`);

        try {
            const graph = graph_store.get_graph();
            const node_count = graph.nodes?.length || 0;
            const connection_count = graph.connections?.length || 0;

            switch (export_format) {
                case 'json':
                    download_graph_as_json(graph, `${filename}.json`);
                    break;
                case 'svg':
                    download_as_svg(`${filename}.svg`);
                    break;
                case 'png':
                    await download_as_png(`${filename}.png`);
                    break;
                case 'jpeg':
                    await download_as_jpeg(`${filename}.jpg`);
                    break;
                case 'html':
                    download_as_html(graph, `${filename}.html`);
                    break;
            }

            notification_store.success(
                `Graph exported as ${export_format.toUpperCase()}: ${filename} (${node_count} statements, ${connection_count} connections)`
            );
            handle_close();
        } catch (error) {
            console.error('Export failed:', error);
            const error_message = error instanceof Error ? error.message : 'Unknown error';
            notification_store.error(`Export failed: ${error_message}`);
        } finally {
            is_exporting = false;
            loading_store.stop();
        }
    }
    const format_descriptions: Record<string, string> = {
        json: 'Export graph data structure for re-importing',
        svg: 'Vector graphics with embedded styles',
        png: 'High-quality raster image (2x resolution)',
        jpeg: 'Compressed image with background',
        html: 'Standalone interactive webpage with full D3 visualization'
    };
</script>

{#if is_open}
    <div
        class="fixed top-0 right-0 bottom-0 left-0 z-1000 flex animate-[fade-in_0.2s_ease] items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onclick={handle_backdrop_click}
        onkeydown={(event) => event.key === 'Escape' && handle_close()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        tabindex="-1"
    >
        <div
            class="flex max-h-[80vh] w-[90%] max-w-[600px] animate-[slide-up_0.3s_ease] flex-col rounded-xl border border-neutral-700 bg-neutral-800/80 shadow-[0_10px_15px_rgba(0,0,0,0.5)] max-md:max-h-[90vh] max-md:w-full"
        >
            <div class="flex items-center justify-between border-b border-neutral-700 p-6">
                <h2 id="export-modal-title" class="m-0 text-xl font-semibold text-white">
                    Export Graph
                </h2>
                <button
                    class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-white transition-all duration-200 hover:border-neutral-600 hover:bg-neutral-800 active:scale-98"
                    onclick={handle_close}
                    aria-label="Close"
                    title="Close"
                >
                    <X size={18} />
                </button>
            </div>

            <div class="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
                <div class="flex flex-col gap-1.5">
                    <label for="export-filename" class="text-sm font-medium text-neutral-400"
                        >Filename</label
                    >
                    <input
                        id="export-filename"
                        type="text"
                        class="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 font-sans text-sm text-white transition-all duration-200 hover:border-neutral-600 focus:border-accent-600 focus:bg-neutral-900 focus:outline-none"
                        bind:value={filename}
                        placeholder="logic-graph"
                    />
                </div>

                <div class="flex flex-col gap-1.5">
                    <label for="export-format" class="text-sm font-medium text-neutral-400"
                        >Format</label
                    >
                    <select
                        id="export-format"
                        class="cursor-pointer rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 font-sans text-sm text-white transition-all duration-200 hover:border-neutral-600 focus:border-accent-600 focus:bg-neutral-900 focus:outline-none"
                        bind:value={export_format}
                    >
                        <option value="json">JSON (.json)</option>
                        <option value="svg">SVG (.svg)</option>
                        <option value="png">PNG (.png)</option>
                        <option value="jpeg">JPEG (.jpg)</option>
                        <option value="html">HTML (.html)</option>
                    </select>
                    <p class="m-0 text-xs text-neutral-500">{format_descriptions[export_format]}</p>
                </div>

                <div class="rounded-md bg-neutral-800 p-4">
                    <h3 class="m-0 mb-2 text-sm font-semibold text-white">Format Details</h3>
                    {#if export_format === 'json'}
                        <ul class="m-0 flex list-none flex-col gap-1.5 p-0">
                            <li
                                class="relative pl-4 text-sm text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                            >
                                Preserves all graph data and metadata
                            </li>
                            <li
                                class="relative pl-4 text-sm text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                            >
                                Can be re-imported into the application
                            </li>
                            <li
                                class="relative pl-4 text-sm text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                            >
                                Human-readable JSON format
                            </li>
                        </ul>
                    {:else if export_format === 'svg'}
                        <ul class="m-0 flex list-none flex-col gap-1.5 p-0">
                            <li
                                class="relative pl-4 text-sm text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                            >
                                Vector graphics - scales without quality loss
                            </li>
                            <li
                                class="relative pl-4 text-sm text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                            >
                                Embedded styles included
                            </li>
                            <li
                                class="relative pl-4 text-sm text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                            >
                                Can be edited in vector graphics software
                            </li>
                        </ul>
                    {:else if export_format === 'png'}
                        <ul class="m-0 flex list-none flex-col gap-1.5 p-0">
                            <li
                                class="relative pl-4 text-sm text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                            >
                                High-quality raster image (2x resolution)
                            </li>
                            <li
                                class="relative pl-4 text-sm text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                            >
                                Transparent background
                            </li>
                            <li
                                class="relative pl-4 text-sm text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                            >
                                Suitable for presentations and documents
                            </li>
                        </ul>
                    {:else if export_format === 'jpeg'}
                        <ul class="m-0 flex list-none flex-col gap-1.5 p-0">
                            <li
                                class="relative pl-4 text-sm text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                            >
                                Compressed image format
                            </li>
                            <li
                                class="relative pl-4 text-sm text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                            >
                                Dark background included
                            </li>
                            <li
                                class="relative pl-4 text-sm text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                            >
                                Smaller file size than PNG
                            </li>
                        </ul>
                    {:else if export_format === 'html'}
                        <ul class="m-0 flex list-none flex-col gap-1.5 p-0">
                            <li
                                class="relative pl-4 text-sm text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                            >
                                Fully interactive standalone webpage
                            </li>
                            <li
                                class="relative pl-4 text-sm text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                            >
                                Includes zoom, pan, and drag functionality
                            </li>
                            <li
                                class="relative pl-4 text-sm text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                            >
                                No external dependencies required
                            </li>
                            <li
                                class="relative pl-4 text-sm text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                            >
                                Open directly in any web browser
                            </li>
                        </ul>
                    {/if}
                </div>
            </div>

            <div class="flex gap-1 border-t border-neutral-700 p-6">
                <button
                    class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-white transition-all duration-200 hover:border-neutral-600 hover:bg-neutral-700 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
                    onclick={handle_close}
                    disabled={is_exporting}
                    title="Cancel"
                    aria-label="Cancel"
                >
                    <X size={18} />
                </button>
                <button
                    class="flex cursor-pointer items-center justify-center rounded-md border p-2 text-white transition-all duration-200 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50 {is_exporting
                        ? 'border-transparent bg-transparent opacity-50'
                        : 'border-(--accent-primary) bg-(--accent-primary) hover:border-accent-700 hover:bg-accent-700'}"
                    onclick={handle_export}
                    disabled={is_exporting}
                    title={is_exporting ? 'Exporting...' : 'Export'}
                    aria-label={is_exporting ? 'Exporting...' : 'Export'}
                >
                    <Download size={18} />
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    @keyframes fade-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes slide-up {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .w-\[90\%\] {
            width: 95%;
        }

        .max-h-\[80vh\] {
            max-height: 90vh;
        }

        .text-sm {
            font-size: 0.75rem;
        }

        .text-xs {
            font-size: 0.7rem;
        }
    }
</style>
