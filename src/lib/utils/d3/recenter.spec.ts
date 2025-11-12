/**
 * Tests for recenter utilities.
 */

import { describe, expect, it } from 'vitest';
import type { LogicNode } from '$lib/types/graph';
import { NodeType } from '$lib/types/graph';
import {
    calculate_bounding_box,
    calculate_recenter_transform,
    calculate_focus_transform,
    DEFAULT_RECENTER_CONFIG
} from './recenter';

describe('calculate_bounding_box', () => {
    it('should return null for empty array', () => {
        const result = calculate_bounding_box([]);
        expect(result).toBeNull();
    });

    it('should return null for nodes without positions', () => {
        const nodes: LogicNode[] = [
            {
                id: '1',
                statement: 'Node 1',
                details: '',
                type: NodeType.STATEMENT,
                x: undefined,
                y: undefined
            }
        ];
        const result = calculate_bounding_box(nodes);
        expect(result).toBeNull();
    });

    it('should calculate bounding box for single node', () => {
        const nodes: LogicNode[] = [
            {
                id: '1',
                statement: 'Node 1',
                details: '',
                type: NodeType.STATEMENT,
                x: 100,
                y: 200
            }
        ];
        const result = calculate_bounding_box(nodes);

        expect(result).toEqual({
            min_x: 100,
            max_x: 100,
            min_y: 200,
            max_y: 200,
            width: 0,
            height: 0,
            center_x: 100,
            center_y: 200
        });
    });

    it('should calculate bounding box for multiple nodes', () => {
        const nodes: LogicNode[] = [
            {
                id: '1',
                statement: 'Node 1',
                details: '',
                type: NodeType.STATEMENT,
                x: 0,
                y: 0
            },
            {
                id: '2',
                statement: 'Node 2',
                details: '',
                type: NodeType.STATEMENT,
                x: 100,
                y: 200
            },
            {
                id: '3',
                statement: 'Node 3',
                details: '',
                type: NodeType.STATEMENT,
                x: -50,
                y: 100
            }
        ];
        const result = calculate_bounding_box(nodes);

        expect(result).toEqual({
            min_x: -50,
            max_x: 100,
            min_y: 0,
            max_y: 200,
            width: 150,
            height: 200,
            center_x: 25,
            center_y: 100
        });
    });

    it('should ignore nodes with invalid positions', () => {
        const nodes: LogicNode[] = [
            {
                id: '1',
                statement: 'Node 1',
                details: '',
                type: NodeType.STATEMENT,
                x: 0,
                y: 0
            },
            {
                id: '2',
                statement: 'Node 2',
                details: '',
                type: NodeType.STATEMENT,
                x: NaN,
                y: NaN
            },
            {
                id: '3',
                statement: 'Node 3',
                details: '',
                type: NodeType.STATEMENT,
                x: 100,
                y: 100
            }
        ];
        const result = calculate_bounding_box(nodes);

        expect(result).toEqual({
            min_x: 0,
            max_x: 100,
            min_y: 0,
            max_y: 100,
            width: 100,
            height: 100,
            center_x: 50,
            center_y: 50
        });
    });
});

describe('calculate_recenter_transform', () => {
    const viewport_width = 800;
    const viewport_height = 600;

    it('should return identity transform for empty nodes', () => {
        const transform = calculate_recenter_transform([], viewport_width, viewport_height);

        expect(transform).toBeDefined();
        expect(transform?.k).toBe(1);
        expect(transform?.x).toBe(0);
        expect(transform?.y).toBe(0);
    });

    it('should center single node at default scale', () => {
        const nodes: LogicNode[] = [
            {
                id: '1',
                statement: 'Node 1',
                details: '',
                type: NodeType.STATEMENT,
                x: 100,
                y: 200
            }
        ];
        const transform = calculate_recenter_transform(nodes, viewport_width, viewport_height);

        expect(transform).toBeDefined();
        expect(transform?.k).toBe(DEFAULT_RECENTER_CONFIG.default_scale);
        // Node at (100, 200) should be centered in viewport
        expect(transform?.x).toBe(viewport_width / 2 - 100 * transform!.k);
        expect(transform?.y).toBe(viewport_height / 2 - 200 * transform!.k);
    });

    it('should fit multiple nodes with padding', () => {
        const nodes: LogicNode[] = [
            {
                id: '1',
                statement: 'Node 1',
                details: '',
                type: NodeType.STATEMENT,
                x: 0,
                y: 0
            },
            {
                id: '2',
                statement: 'Node 2',
                details: '',
                type: NodeType.STATEMENT,
                x: 400,
                y: 300
            }
        ];
        const transform = calculate_recenter_transform(nodes, viewport_width, viewport_height);

        expect(transform).toBeDefined();
        expect(transform?.k).toBeGreaterThan(0);
        expect(transform?.k).toBeLessThanOrEqual(DEFAULT_RECENTER_CONFIG.max_scale);
        expect(transform?.k).toBeGreaterThanOrEqual(DEFAULT_RECENTER_CONFIG.min_scale);
    });

    it('should respect custom padding fraction', () => {
        const nodes: LogicNode[] = [
            {
                id: '1',
                statement: 'Node 1',
                details: '',
                type: NodeType.STATEMENT,
                x: 0,
                y: 0
            },
            {
                id: '2',
                statement: 'Node 2',
                details: '',
                type: NodeType.STATEMENT,
                x: 100,
                y: 100
            }
        ];

        const transform_small_padding = calculate_recenter_transform(
            nodes,
            viewport_width,
            viewport_height,
            { padding_fraction: 0.05 }
        );
        const transform_large_padding = calculate_recenter_transform(
            nodes,
            viewport_width,
            viewport_height,
            { padding_fraction: 0.2 }
        );

        // Larger padding should result in smaller scale
        expect(transform_large_padding?.k).toBeLessThan(transform_small_padding!.k);
    });

    it('should clamp scale to min/max limits', () => {
        // Very small bbox - would zoom in a lot
        const small_nodes: LogicNode[] = [
            {
                id: '1',
                statement: 'Node 1',
                details: '',
                type: NodeType.STATEMENT,
                x: 0,
                y: 0
            },
            {
                id: '2',
                statement: 'Node 2',
                details: '',
                type: NodeType.STATEMENT,
                x: 1,
                y: 1
            }
        ];

        const transform = calculate_recenter_transform(small_nodes, viewport_width, viewport_height, {
            max_scale: 2.0
        });
        expect(transform?.k).toBeLessThanOrEqual(2.0);

        // Very large bbox - would zoom out a lot
        const large_nodes: LogicNode[] = [
            {
                id: '1',
                statement: 'Node 1',
                details: '',
                type: NodeType.STATEMENT,
                x: -5000,
                y: -5000
            },
            {
                id: '2',
                statement: 'Node 2',
                details: '',
                type: NodeType.STATEMENT,
                x: 5000,
                y: 5000
            }
        ];

        const transform2 = calculate_recenter_transform(
            large_nodes,
            viewport_width,
            viewport_height,
            {
                min_scale: 0.2
            }
        );
        expect(transform2?.k).toBeGreaterThanOrEqual(0.2);
    });
});

describe('calculate_focus_transform', () => {
    const viewport_width = 800;
    const viewport_height = 600;

    it('should return null for node without position', () => {
        const node: LogicNode = {
            id: '1',
            statement: 'Node 1',
            details: '',
            type: NodeType.STATEMENT,
            x: undefined,
            y: undefined
        };
        const transform = calculate_focus_transform(node, viewport_width, viewport_height);

        expect(transform).toBeNull();
    });

    it('should center node at current scale', () => {
        const node: LogicNode = {
            id: '1',
            statement: 'Node 1',
            details: '',
            type: NodeType.STATEMENT,
            x: 200,
            y: 300
        };
        const current_scale = 1.5;
        const transform = calculate_focus_transform(
            node,
            viewport_width,
            viewport_height,
            current_scale
        );

        expect(transform).toBeDefined();
        expect(transform?.k).toBe(current_scale);
        expect(transform?.x).toBe(viewport_width / 2 - node.x! * current_scale);
        expect(transform?.y).toBe(viewport_height / 2 - node.y! * current_scale);
    });

    it('should use default scale of 1.0 when not provided', () => {
        const node: LogicNode = {
            id: '1',
            statement: 'Node 1',
            details: '',
            type: NodeType.STATEMENT,
            x: 100,
            y: 100
        };
        const transform = calculate_focus_transform(node, viewport_width, viewport_height);

        expect(transform).toBeDefined();
        expect(transform?.k).toBe(1.0);
    });
});
