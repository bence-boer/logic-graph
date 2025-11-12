<!--
	Answer Checkmark Overlay Component
	
	Displays a green checkmark icon on question nodes that have been answered.
	The icon appears in the top-right corner of the node with a smooth
	scale-in animation when an answer is linked.
	
	@component
-->
<script lang="ts">
    import type { LogicNode } from '$lib/types/graph';
    import { is_question_node } from '$lib/utils/node-classification';

    interface Props {
        /** The node to potentially show checkmark for */
        node: LogicNode;
        /** Width of the node in pixels */
        node_width: number;
        /** Height of the node in pixels */
        node_height: number;
    }

    let { node, node_width, node_height }: Props = $props();

    /** Whether the node is a question with an answer */
    let has_answer = $derived(is_question_node(node) && node.answered_by !== undefined);

    /** X position for the checkmark icon (top-right corner) */
    let checkmark_x = $derived(2000);

    /** Y position for the checkmark icon (top-right corner) */
    let checkmark_y = $derived(40);
</script>

{#if has_answer}
    <g class="answer-checkmark" transform="translate({checkmark_x}, {checkmark_y})">
        <circle cx="8" cy="8" r="10" fill="#10b981" fill-opacity="0.95" />
        <svg
            x="2"
            y="2"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <!-- Checkmark icon -->
            <polyline points="20 6 9 17 4 12" />
        </svg>
    </g>
{/if}

<style>
    .answer-checkmark {
        pointer-events: none;
        animation: scale-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
    }

    @keyframes scale-in {
        from {
            opacity: 0;
            transform: scale(0);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
</style>
