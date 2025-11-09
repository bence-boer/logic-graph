<script lang="ts">
    interface Props {
        is_loading: boolean;
        message?: string;
    }

    let { is_loading = false, message = 'Loading...' }: Props = $props();
</script>

{#if is_loading}
    <div
        class="fixed top-0 right-0 bottom-0 left-0 z-9999 flex animate-[fade-in_0.2s_ease] items-center justify-center bg-black/80 backdrop-blur-md"
    >
        <div class="flex flex-col items-center gap-6">
            <div
                class="h-12 w-12 animate-[spin_0.8s_linear_infinite] rounded-full border-4 border-neutral-700 border-t-accent-600"
            ></div>
            <p class="m-0 animate-[pulse_1.5s_ease-in-out_infinite] text-base text-white">
                {message}
            </p>
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

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }
</style>
