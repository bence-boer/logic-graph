<!--
	Pin Indicator Overlay Component
	
	Displays a small pin icon on pinned nodes to provide visual feedback
	that the node position is fixed. The icon appears in the top-right
	corner of the node with a smooth fade-in animation.
	
	@component
-->
<script lang="ts">
    import type { LogicNode } from '$lib/types/graph';

    interface Props {
        /** The node to potentially show pin indicator for */
        node: LogicNode;
        /** Width of the node in pixels */
        node_width: number;
        /** Height of the node in pixels */
        node_height: number;
    }

    let { node, node_width, node_height }: Props = $props();

    /** Whether the node is currently pinned */
    let is_pinned = $derived(node.fx !== null && node.fx !== undefined);

    /** X position for the pin icon (top-right corner) */
    let pin_x = $derived(node_width - 20);

    /** Y position for the pin icon (top-right corner) */
    let pin_y = $derived(-node_height + 4);
</script>

{#if is_pinned}
    <g class="pin-indicator" transform="translate({pin_x}, {pin_y})">
        <circle cx="8" cy="8" r="10" fill="var(--node-default)" fill-opacity="0.9" />
        <svg
            x="2"
            y="2"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8b5cf6"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <!-- Pin icon (thumbtack) -->
            <path d="M12 17v5" />
            <path
                d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"
            />
        </svg>
    </g>
{/if}

<style>
    .pin-indicator {
        pointer-events: none;
        opacity: 0;
        animation: fade-in 0.3s ease forwards;
    }

    @keyframes fade-in {
        from {
            opacity: 0;
            transform: scale(0.8);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
</style>
