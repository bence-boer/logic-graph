/**
 * Mobile gesture interaction definitions.
 *
 * Defines all touch gesture interactions for mobile devices.
 */

import {
    InteractionContext,
    EventMatcherType,
    GestureType,
    type InteractionDefinition,
    InteractionPreconditionType
} from '../types';
import { graph_store } from '$lib/stores/graph.svelte';

/**
 * Mobile gesture interactions.
 */
export const gesture_interactions: InteractionDefinition[] = [
    // Long press node to pin/unpin
    {
        id: 'gesture.node.long_press.toggle_pin',
        contexts: [InteractionContext.CANVAS],
        matcher: {
            type: EventMatcherType.GESTURE,
            gesture: GestureType.LONG_PRESS,
            target: '.node',
            prevent_default: true
        },
        command: 'graph.node.pin',
        payload_mapper: (event) => {
            const target = event.target as Element;
            const node_element = target.closest('.node');
            const node_id = node_element?.getAttribute('data-node-id');
            const node = graph_store.nodes.find((n) => n.id === node_id);
            const is_pinned = node?.fx !== null && node?.fx !== undefined;
            return {
                node_id,
                pinned: !is_pinned
            };
        },
        priority: 50,
        description: 'Long press node to toggle pin state'
    },

    // Tap node to select
    {
        id: 'gesture.node.tap.select',
        contexts: [InteractionContext.CANVAS],
        matcher: {
            type: EventMatcherType.GESTURE,
            gesture: GestureType.TAP,
            target: '.node',
            prevent_default: true
        },
        command: 'selection.set',
        payload_mapper: (event) => {
            const target = event.target as Element;
            const node_element = target.closest('.node');
            const node_id = node_element?.getAttribute('data-node-id');
            return { node_id };
        },
        priority: 40,
        description: 'Tap node to select it'
    },

    // Tap empty canvas to deselect
    {
        id: 'gesture.canvas.tap.deselect',
        contexts: [InteractionContext.CANVAS],
        matcher: {
            type: EventMatcherType.GESTURE,
            gesture: GestureType.TAP,
            target: 'svg.graph-canvas',
            prevent_default: false
        },
        command: 'selection.clear',
        preconditions: [
            {
                type: InteractionPreconditionType.HAS_SELECTION
            }
        ],
        priority: 10,
        description: 'Tap empty canvas to deselect'
    },

    // Pinch to zoom
    {
        id: 'gesture.canvas.pinch.zoom',
        contexts: [InteractionContext.CANVAS],
        matcher: {
            type: EventMatcherType.GESTURE,
            gesture: GestureType.PINCH,
            target: 'svg.graph-canvas',
            prevent_default: true
        },
        command: 'nav.zoom',
        payload_mapper: (event) => {
            // Extract scale from gesture event
            const gesture_event = event as CustomEvent;
            const scale = gesture_event.detail?.scale || 1;
            return { scale };
        },
        priority: 30,
        description: 'Pinch to zoom in/out'
    },

    // Two-finger pan to move canvas
    {
        id: 'gesture.canvas.pan.move',
        contexts: [InteractionContext.CANVAS],
        matcher: {
            type: EventMatcherType.GESTURE,
            gesture: GestureType.PAN,
            target: 'svg.graph-canvas',
            prevent_default: true
        },
        command: 'nav.pan',
        payload_mapper: (event) => {
            // Extract delta from gesture event
            const gesture_event = event as CustomEvent;
            const delta_x = gesture_event.detail?.deltaX || 0;
            const delta_y = gesture_event.detail?.deltaY || 0;
            return { delta_x, delta_y };
        },
        priority: 30,
        description: 'Two-finger pan to move canvas'
    }
];
