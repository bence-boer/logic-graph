/**
 * Canvas interaction definitions.
 *
 * Defines all interactions that occur on the graph canvas.
 */

import {
    InteractionContext,
    EventMatcherType,
    type InteractionDefinition,
    InteractionPreconditionType
} from '../types';
import { graph_store } from '$lib/stores/graph.svelte';

/**
 * Canvas interactions.
 */
export const canvas_interactions: InteractionDefinition[] = [
    // Click empty space to deselect
    {
        id: 'canvas.click.deselect',
        contexts: [InteractionContext.CANVAS],
        matcher: {
            type: EventMatcherType.CLICK,
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
        description: 'Click empty canvas to deselect nodes'
    },

    // Click node to select
    {
        id: 'canvas.node.click.select',
        contexts: [InteractionContext.CANVAS],
        matcher: {
            type: EventMatcherType.CLICK,
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
        priority: 20,
        description: 'Click node to select it'
    },

    // Double-click node to pin/unpin
    {
        id: 'canvas.node.double_click.toggle_pin',
        contexts: [InteractionContext.CANVAS],
        matcher: {
            type: EventMatcherType.DOUBLE_CLICK,
            target: '.node',
            prevent_default: true
        },
        command: 'graph.node.pin',
        payload_mapper: (event) => {
            const target = event.target as Element;
            const node_element = target.closest('.node');
            const node_id = node_element?.getAttribute('data-node-id');
            const node = graph_store.nodes.find((n) => n.id === node_id);
            // Node is pinned if fx and fy are set to numbers (not null/undefined)
            const is_pinned = node?.fx !== null && node?.fx !== undefined;
            return {
                node_id,
                pinned: !is_pinned
            };
        },
        priority: 25,
        description: 'Double-click node to toggle pin state'
    },

    // Right-click node to show context menu
    {
        id: 'canvas.node.context_menu',
        contexts: [InteractionContext.CANVAS],
        matcher: {
            type: EventMatcherType.CONTEXT_MENU,
            target: '.node',
            prevent_default: true
        },
        command: 'ui.context_menu.show',
        payload_mapper: (event) => {
            const mouse_event = event as MouseEvent;
            const target = event.target as Element;
            const node_element = target.closest('.node');
            const node_id = node_element?.getAttribute('data-node-id');
            return {
                node_id,
                x: mouse_event.clientX,
                y: mouse_event.clientY
            };
        },
        priority: 30,
        description: 'Right-click node to show context menu'
    },

    // Click connection to select
    {
        id: 'canvas.connection.click.select',
        contexts: [InteractionContext.CANVAS],
        matcher: {
            type: EventMatcherType.CLICK,
            target: '.connection',
            prevent_default: true
        },
        command: 'selection.set',
        payload_mapper: (event) => {
            const target = event.target as Element;
            const connection_element = target.closest('.connection');
            const connection_id = connection_element?.getAttribute('data-connection-id');
            return { connection_id };
        },
        priority: 20,
        description: 'Click connection to select it'
    },

    // Hover node to highlight connected nodes
    {
        id: 'canvas.node.hover.highlight',
        contexts: [InteractionContext.CANVAS],
        matcher: {
            type: EventMatcherType.HOVER,
            target: '.node',
            prevent_default: false
        },
        command: 'ui.node.highlight',
        payload_mapper: (event) => {
            const target = event.target as Element;
            const node_element = target.closest('.node');
            const node_id = node_element?.getAttribute('data-node-id');
            return { node_id };
        },
        priority: 15,
        description: 'Hover node to highlight connections'
    },

    // Drag node to move
    {
        id: 'canvas.node.drag.move',
        contexts: [InteractionContext.CANVAS],
        matcher: {
            type: EventMatcherType.DRAG,
            target: '.node',
            prevent_default: true
        },
        command: 'graph.node.move',
        payload_mapper: (event) => {
            const drag_event = event as DragEvent;
            const target = event.target as Element;
            const node_element = target.closest('.node');
            const node_id = node_element?.getAttribute('data-node-id');
            return {
                node_id,
                x: drag_event.clientX,
                y: drag_event.clientY
            };
        },
        priority: 30,
        description: 'Drag node to move it'
    }
];
