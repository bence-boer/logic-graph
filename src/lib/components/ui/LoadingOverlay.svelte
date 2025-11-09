<script lang="ts">
    interface Props {
        is_loading: boolean;
        message?: string;
    }

    let { is_loading = false, message = 'Loading...' }: Props = $props();
</script>

{#if is_loading}
    <div class="loading-overlay">
        <div class="loading-content">
            <div class="spinner"></div>
            <p class="loading-message">{message}</p>
        </div>
    </div>
{/if}

<style>
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(var(--blur-md));
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
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

    .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-lg);
    }

    .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid var(--border-default);
        border-top-color: var(--accent-primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .loading-message {
        font-size: 1rem;
        color: var(--text-primary);
        margin: 0;
        animation: pulse 1.5s ease-in-out infinite;
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
