<script lang="ts">
    import Button from './Button.svelte';
    import { graph_store } from '$lib/stores/graph.svelte';
    import { loading_store } from '$lib/stores/loading.svelte';
    import { toast_store } from '$lib/stores/toast.svelte';
    import {
        download_graph_as_json,
        download_as_svg,
        download_as_png,
        download_as_jpeg,
        download_as_html
    } from '$lib/utils/export';

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

    function handle_backdrop_click(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            handle_close();
        }
    }

    async function handle_export() {
        is_exporting = true;
        loading_store.start(`Exporting as ${export_format.toUpperCase()}...`);

        try {
            const graph = graph_store.get_graph();

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

            toast_store.success(`Exported as ${export_format.toUpperCase()}`);
            handle_close();
        } catch (error) {
            console.error('Export failed:', error);
            const error_message = error instanceof Error ? error.message : 'Unknown error';
            toast_store.error(`Export failed: ${error_message}`);
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
        class="modal-backdrop"
        onclick={handle_backdrop_click}
        onkeydown={(e) => e.key === 'Escape' && handle_close()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        tabindex="-1"
    >
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="export-modal-title" class="modal-title">Export Graph</h2>
                <button class="close-btn" onclick={handle_close} aria-label="Close">✕</button>
            </div>

            <div class="modal-body">
                <div class="form-group">
                    <label for="export-filename" class="form-label">Filename</label>
                    <input
                        id="export-filename"
                        type="text"
                        class="form-input"
                        bind:value={filename}
                        placeholder="logic-graph"
                    />
                </div>

                <div class="form-group">
                    <label for="export-format" class="form-label">Format</label>
                    <select id="export-format" class="form-select" bind:value={export_format}>
                        <option value="json">JSON (.json)</option>
                        <option value="svg">SVG (.svg)</option>
                        <option value="png">PNG (.png)</option>
                        <option value="jpeg">JPEG (.jpg)</option>
                        <option value="html">HTML (.html)</option>
                    </select>
                    <p class="form-help">{format_descriptions[export_format]}</p>
                </div>

                <div class="format-info">
                    <h3 class="info-title">Format Details</h3>
                    {#if export_format === 'json'}
                        <ul class="info-list">
                            <li>Preserves all graph data and metadata</li>
                            <li>Can be re-imported into the application</li>
                            <li>Human-readable JSON format</li>
                        </ul>
                    {:else if export_format === 'svg'}
                        <ul class="info-list">
                            <li>Vector graphics - scales without quality loss</li>
                            <li>Embedded styles included</li>
                            <li>Can be edited in vector graphics software</li>
                        </ul>
                    {:else if export_format === 'png'}
                        <ul class="info-list">
                            <li>High-quality raster image (2x resolution)</li>
                            <li>Transparent background</li>
                            <li>Suitable for presentations and documents</li>
                        </ul>
                    {:else if export_format === 'jpeg'}
                        <ul class="info-list">
                            <li>Compressed image format</li>
                            <li>Dark background included</li>
                            <li>Smaller file size than PNG</li>
                        </ul>
                    {:else if export_format === 'html'}
                        <ul class="info-list">
                            <li>Fully interactive standalone webpage</li>
                            <li>Includes zoom, pan, and drag functionality</li>
                            <li>No external dependencies required</li>
                            <li>Open directly in any web browser</li>
                        </ul>
                    {/if}
                </div>
            </div>

            <div class="modal-footer">
                <Button variant="secondary" onclick={handle_close} disabled={is_exporting}>
                    Cancel
                </Button>
                <Button onclick={handle_export} disabled={is_exporting}>
                    {is_exporting ? 'Exporting...' : 'Export'}
                </Button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(var(--blur-sm));
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fade-in 0.2s ease;
    }

    @keyframes fade-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .modal-content {
        background: var(--bg-elevated);
        border: 1px solid var(--border-default);
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        animation: slide-up 0.3s ease;
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

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--border-default);
    }

    .modal-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    .close-btn {
        width: 32px;
        height: 32px;
        background: transparent;
        border: 1px solid var(--border-default);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .close-btn:hover {
        background: var(--bg-secondary);
        border-color: var(--border-hover);
    }

    .modal-body {
        flex: 1;
        padding: var(--spacing-lg);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .form-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .form-input,
    .form-select {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 0.875rem;
        font-family: inherit;
        transition: all 0.2s ease;
    }

    .form-input:hover,
    .form-select:hover {
        border-color: var(--border-hover);
    }

    .form-input:focus,
    .form-select:focus {
        outline: none;
        border-color: var(--accent-primary);
        background: var(--bg-primary);
    }

    .form-select {
        cursor: pointer;
    }

    .form-help {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        margin: 0;
    }

    .format-info {
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: 6px;
    }

    .info-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 var(--spacing-sm) 0;
    }

    .info-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .info-list li {
        font-size: 0.875rem;
        color: var(--text-secondary);
        padding-left: var(--spacing-md);
        position: relative;
    }

    .info-list li::before {
        content: '•';
        position: absolute;
        left: 0;
        color: var(--accent-primary);
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-sm);
        padding: var(--spacing-lg);
        border-top: 1px solid var(--border-default);
    }

    /* Scrollbar styling */
    .modal-body::-webkit-scrollbar {
        width: 6px;
    }

    .modal-body::-webkit-scrollbar-track {
        background: transparent;
    }

    .modal-body::-webkit-scrollbar-thumb {
        background: var(--border-default);
        border-radius: 3px;
    }

    .modal-body::-webkit-scrollbar-thumb:hover {
        background: var(--border-hover);
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .modal-content {
            width: 95%;
            max-height: 90vh;
        }

        .info-list li {
            font-size: 0.75rem;
        }

        .form-help {
            font-size: 0.7rem;
        }
    }
</style>
