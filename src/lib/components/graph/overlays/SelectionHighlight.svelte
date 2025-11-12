<!--
	Selection Highlight Overlay Component
	
	Displays a prominent selection outline around selected nodes to provide
	clear visual feedback. The outline pulses slightly to draw attention.
	
	@component
-->
<script lang="ts">
    import type { LogicNode } from '$lib/types/graph';

    interface Props {
        /** The node to potentially show selection highlight for */
        node: LogicNode;
        /** Width of the node in pixels */
        node_width: number;
        /** Height of the node in pixels */
        node_height: number;
        /** Whether the node is currently selected */
        is_selected: boolean;
    }

    let { node, node_width, node_height, is_selected }: Props = $props();

    /** Padding around the node for the selection outline */
    const SELECTION_PADDING = 4;

    /** X position for the selection rectangle */
    let selection_x = $derived(-node_width / 2 - SELECTION_PADDING);

    /** Y position for the selection rectangle */
    let selection_y = $derived(-node_height / 2 - SELECTION_PADDING);

    /** Width of the selection rectangle */
    let selection_width = $derived(node_width + SELECTION_PADDING * 2);

    /** Height of the selection rectangle */
    let selection_height = $derived(node_height + SELECTION_PADDING * 2);
</script>

{#if is_selected}
    <rect
        class="selection-highlight"
        x={selection_x}
        y={selection_y}
        width={selection_width}
        height={selection_height}
        rx="6"
        fill="none"
        stroke="var(--accent-primary)"
        stroke-width="2"
        pointer-events="none"
    />
{/if}

<style>
    .selection-highlight {
        animation: pulse-selection 2s ease-in-out infinite;
        opacity: 0.8;
    }

    @keyframes pulse-selection {
        0%,
        100% {
            opacity: 0.8;
        }
        50% {
            opacity: 1;
        }
    }
</style>
