<script lang="ts">
    import type { LogicGraph } from '$lib/types/graph';
    import { CircleQuestionMark, FileText, Upload, X } from '@lucide/svelte';

    interface Props {
        is_open: boolean;
        onclose: () => void;
        onimport: (graph: LogicGraph) => void;
    }

    let { is_open = $bindable(false), onclose, onimport }: Props = $props();

    let json_text = $state('');
    let show_help = $state(false);
    let is_importing = $state(false);
    let error_message = $state<string | null>(null);

    function handle_close() {
        is_open = false;
        json_text = '';
        error_message = null;
        show_help = false;
        onclose?.();
    }

    function handle_backdrop_click(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            handle_close();
        }
    }

    function handle_file_upload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';

        input.onchange = async (e) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                try {
                    const text = await file.text();
                    json_text = text;
                    error_message = null;
                } catch (err) {
                    // Log error for debugging and show user-friendly message
                    console.error(err);
                    error_message = 'Failed to read file';
                }
            }
        };

        input.click();
    }

    function handle_import() {
        is_importing = true;
        error_message = null;

        try {
            const trimmed = json_text.trim();
            if (!trimmed) {
                error_message = 'Please paste or upload JSON data';
                is_importing = false;
                return;
            }

            const parsed = JSON.parse(trimmed) as LogicGraph;

            // Basic validation
            if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
                error_message = 'Invalid graph: missing or invalid "nodes" array';
                is_importing = false;
                return;
            }

            if (!parsed.connections || !Array.isArray(parsed.connections)) {
                error_message = 'Invalid graph: missing or invalid "connections" array';
                is_importing = false;
                return;
            }

            onimport(parsed);
            handle_close();
        } catch (error) {
            if (error instanceof SyntaxError) {
                error_message = `Invalid JSON: ${error.message}`;
            } else {
                error_message = 'Failed to parse JSON';
            }
        } finally {
            is_importing = false;
        }
    }

    function toggle_help() {
        show_help = !show_help;
    }
</script>

{#if is_open}
    <div
        class="fixed top-0 right-0 bottom-0 left-0 z-1000 flex animate-[fade-in_0.2s_ease] items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onclick={handle_backdrop_click}
        onkeydown={(event) => event.key === 'Escape' && handle_close()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
        tabindex="-1"
    >
        <div
            class="flex max-h-[80vh] w-[90%] max-w-[700px] animate-[slide-up_0.3s_ease] flex-col rounded-xl border border-neutral-700 bg-neutral-800/80 shadow-[0_10px_15px_rgba(0,0,0,0.5)] max-md:max-h-[90vh] max-md:w-full"
        >
            <div class="flex items-center justify-between border-b border-neutral-700 p-6">
                <h2 id="import-modal-title" class="m-0 text-xl font-semibold text-white">
                    Import Graph
                </h2>
                <div class="flex items-center gap-2">
                    <button
                        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-white transition-all duration-200 hover:border-neutral-600 hover:bg-neutral-800 active:scale-98"
                        onclick={toggle_help}
                        aria-label={show_help ? 'Hide help' : 'Show help'}
                        title={show_help ? 'Hide help' : 'Show help'}
                    >
                        <CircleQuestionMark size={18} />
                    </button>
                    <button
                        class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-white transition-all duration-200 hover:border-neutral-600 hover:bg-neutral-800 active:scale-98"
                        onclick={handle_close}
                        aria-label="Close"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
                {#if show_help}
                    <div
                        class="animate-[fade-in_0.2s_ease] rounded-md border border-accent-600/30 bg-accent-900/20 p-4"
                    >
                        <h3
                            class="m-0 mb-3 flex items-center gap-2 text-sm font-semibold text-white"
                        >
                            <FileText size={16} />
                            Expected JSON Structure
                        </h3>
                        <pre
                            class="m-0 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-neutral-300"><code
                                >{`{
  "nodes": [
    {
      "id": "unique-id",
      "statement": "Statement text",
      "details": "Optional details"
    }
  ],
  "connections": [
    {
      "type": "implication" | "contradiction",
      "sources": ["node-id-1"],
      "targets": ["node-id-2"]
    }
  ],
  "metadata": {
    "statement": "Graph name",
    "details": "Optional description"
  }
}`}</code
                            ></pre>
                        <div class="mt-3 flex flex-col gap-2">
                            <p class="m-0 text-xs text-neutral-400">
                                <strong class="text-white">Required fields:</strong>
                            </p>
                            <ul class="m-0 flex list-none flex-col gap-1.5 p-0">
                                <li
                                    class="relative pl-4 text-xs text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                                >
                                    <code class="text-accent-400">nodes</code>: Array of statement
                                    objects
                                </li>
                                <li
                                    class="relative pl-4 text-xs text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                                >
                                    <code class="text-accent-400">connections</code>: Array of
                                    connection objects
                                </li>
                                <li
                                    class="relative pl-4 text-xs text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                                >
                                    Each node must have: <code class="text-accent-400">id</code>,
                                    <code class="text-accent-400">statement</code> (details is optional)
                                </li>
                                <li
                                    class="relative pl-4 text-xs text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                                >
                                    Each connection must have:
                                    <code class="text-accent-400">type</code>,
                                    <code class="text-accent-400">sources</code>,
                                    <code class="text-accent-400">targets</code> (id is optional)
                                </li>
                                <li
                                    class="relative pl-4 text-xs text-neutral-400 before:absolute before:left-0 before:text-accent-600 before:content-['•']"
                                >
                                    <code class="text-accent-400">metadata</code> is optional but recommended
                                </li>
                            </ul>
                        </div>
                    </div>
                {/if}

                <div class="flex flex-col gap-1.5">
                    <div class="flex items-center justify-between">
                        <label for="import-json-text" class="text-sm font-medium text-neutral-400"
                            >JSON Data</label
                        >
                        <button
                            class="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-600 bg-transparent px-3 py-1.5 text-sm text-white transition-all duration-200 hover:border-neutral-500 hover:bg-neutral-700 active:scale-98"
                            onclick={handle_file_upload}
                            title="Upload JSON file"
                        >
                            <Upload size={14} />
                            Upload File
                        </button>
                    </div>
                    <textarea
                        id="import-json-text"
                        class="min-h-[300px] rounded-md border border-neutral-700 bg-neutral-900 px-4 py-3 font-['Monaco','Courier_New',monospace] text-sm text-white transition-all duration-200 hover:border-neutral-600 focus:border-accent-600 focus:outline-none"
                        bind:value={json_text}
                        placeholder="Paste your JSON here or click 'Upload File'"
                        spellcheck="false"
                    ></textarea>
                    {#if error_message}
                        <p class="m-0 animate-[fade-in_0.2s_ease] text-sm text-red-400">
                            {error_message}
                        </p>
                    {/if}
                </div>

                <div class="rounded-md bg-neutral-800 p-4">
                    <p class="m-0 text-xs text-neutral-400">
                        You can paste JSON directly into the textarea above, or click the "Upload
                        File" button to select a JSON file from your computer.
                    </p>
                </div>
            </div>

            <div class="flex gap-1 border-t border-neutral-700 p-6">
                <button
                    class="flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-2 text-white transition-all duration-200 hover:border-neutral-600 hover:bg-neutral-700 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
                    onclick={handle_close}
                    disabled={is_importing}
                    title="Cancel"
                    aria-label="Cancel"
                >
                    <X size={18} />
                </button>
                <button
                    class="flex cursor-pointer items-center justify-center rounded-md border p-2 text-white transition-all duration-200 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50 {is_importing
                        ? 'border-transparent bg-transparent opacity-50'
                        : 'border-(--accent-primary) bg-(--accent-primary) hover:border-accent-700 hover:bg-accent-700'}"
                    onclick={handle_import}
                    disabled={is_importing || !json_text.trim()}
                    title={is_importing ? 'Importing...' : 'Import'}
                    aria-label={is_importing ? 'Importing...' : 'Import'}
                >
                    <Upload size={18} />
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

        .min-h-\[300px\] {
            min-height: 200px;
        }
    }
</style>
