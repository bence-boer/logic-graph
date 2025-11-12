<script lang="ts">
    import { notification_store } from '$lib/stores/notification.svelte';

    function handle_close(id: string) {
        notification_store.remove(id);
    }

    function get_icon(type: string) {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
            default:
                return 'ℹ';
        }
    }

    const toast_border_classes = {
        success: 'border-l-4 border-l-emerald-500',
        error: 'border-l-4 border-l-red-500',
        warning: 'border-l-4 border-l-accent-500',
        info: 'border-l-4 border-l-accent-600'
    };

    const icon_color_classes = {
        success: 'text-emerald-500',
        error: 'text-red-500',
        warning: 'text-accent-500',
        info: 'text-accent-600'
    };
</script>

<div class="pointer-events-none fixed right-6 bottom-6 z-10000 flex flex-col gap-2">
    {#each notification_store.toasts as toast (toast.id)}
        <div
            class="pointer-events-auto flex max-w-[400px] min-w-[300px] animate-[slide-in_0.3s_ease] items-center gap-4 rounded-lg border border-neutral-700 bg-neutral-800/80 px-6 py-4 shadow-[0_10px_15px_rgba(0,0,0,0.5)] backdrop-blur-md {toast_border_classes[
                toast.type
            ]}"
            role="alert"
        >
            <span class="shrink-0 text-xl leading-none {icon_color_classes[toast.type]}"
                >{get_icon(toast.type)}</span
            >
            <span class="flex-1 text-sm leading-snug text-white">{toast.message}</span>
            <button
                class="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-base text-neutral-400 transition-all duration-200 hover:bg-neutral-800 hover:text-white"
                onclick={() => handle_close(toast.id)}
                aria-label="Close notification"
            >
                ✕
            </button>
        </div>
    {/each}
</div>

<style>
    @keyframes slide-in {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        div.fixed {
            left: 1rem;
            right: 1rem;
            bottom: 1rem;
        }
    }
</style>
