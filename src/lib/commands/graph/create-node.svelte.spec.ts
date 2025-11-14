import { CommandEffectType } from '$lib/commands/types';
import { NodeType } from '$lib/types/graph';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { CreateNodePayload } from './create-node';

let create_node_command!: typeof import('./create-node').create_node_command;
let graph_store: typeof import('$lib/stores/graph.svelte')['graph_store'];

const TEST_CONTEXT = { timestamp: Date.now() };

describe('create_node_command', () => {
    beforeAll(async () => {
        // Dynamically import the store and the command after stubbing $state so
        // that module evaluation doesn't fail due to missing Svelte runes.
        graph_store = (await import('$lib/stores/graph.svelte')).graph_store;
        const mod = await import('./create-node');
        create_node_command = mod.create_node_command;
    });

    beforeEach(() => {
        // Clear the graph before each test
        graph_store.nodes = [];
        graph_store.connections = [];
    });

    describe('validation', () => {
        it('should reject empty statement', () => {
            const payload: CreateNodePayload = {
                statement: ''
            };

            const result = create_node_command.validate(payload, TEST_CONTEXT);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('Statement cannot be empty');
            expect(result.field_errors?.statement).toBe('Statement is required');
        });

        it('should reject statement with only whitespace', () => {
            const payload: CreateNodePayload = {
                statement: '   '
            };

            const result = create_node_command.validate(payload, TEST_CONTEXT);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('Statement cannot be empty');
        });

        it('should reject statement that is too long', () => {
            const payload: CreateNodePayload = {
                statement: 'a'.repeat(501)
            };

            const result = create_node_command.validate(payload, TEST_CONTEXT);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('Statement is too long');
            expect(result.field_errors?.statement).toBe('Statement must be 500 characters or less');
        });

        it('should reject details that are too long', () => {
            const payload: CreateNodePayload = {
                statement: 'Valid statement',
                details: 'a'.repeat(2001)
            };

            const result = create_node_command.validate(payload, TEST_CONTEXT);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('Details are too long');
            expect(result.field_errors?.details).toBe('Details must be 2000 characters or less');
        });

        it('should accept valid statement node payload', () => {
            const payload: CreateNodePayload = {
                statement: 'Test statement',
                details: 'Test details',
                type: NodeType.STATEMENT
            };

            const result = create_node_command.validate(payload, TEST_CONTEXT);

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should accept valid question node payload', () => {
            const payload: CreateNodePayload = {
                statement: 'Test question?',
                type: NodeType.QUESTION
            };

            const result = create_node_command.validate(payload, TEST_CONTEXT);

            expect(result.valid).toBe(true);
        });
    });

    describe('execution', () => {
        it('should create a statement node with default values', async () => {
            const payload: CreateNodePayload = {
                statement: 'Test statement'
            };

            const result = await create_node_command.execute(payload, TEST_CONTEXT);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.node_id).toBeDefined();
            expect(result.data?.node).toBeDefined();

            // Check the node was added to the store
            expect(graph_store.nodes.length).toBe(1);
            const created_node = graph_store.nodes[0];
            expect(created_node.statement).toBe('Test statement');
            expect(created_node.type).toBe(NodeType.STATEMENT);
        });

        it('should create a question node', async () => {
            const payload: CreateNodePayload = {
                statement: 'Is this a test?',
                type: NodeType.QUESTION
            };

            const result = await create_node_command.execute(payload, TEST_CONTEXT);

            expect(result.success).toBe(true);
            expect(graph_store.nodes.length).toBe(1);

            const created_node = graph_store.nodes[0];
            expect(created_node.type).toBe(NodeType.QUESTION);
            expect(created_node.answered_by).toBeUndefined(); // Question starts without an answer
        });

        it('should trim whitespace from statement and details', async () => {
            const payload: CreateNodePayload = {
                statement: '  Test statement  ',
                details: '  Test details  '
            };

            const result = await create_node_command.execute(payload, TEST_CONTEXT);

            expect(result.success).toBe(true);
            const created_node = graph_store.nodes[0];
            expect(created_node.statement).toBe('Test statement');
            expect(created_node.details).toBe('Test details');
        });

        it('should include toast and animation effects', async () => {
            const payload: CreateNodePayload = {
                statement: 'Test statement'
            };

            const result = await create_node_command.execute(payload, TEST_CONTEXT);

            expect(result.effects).toBeDefined();
            expect(result.effects?.length).toBe(2);

            const toast_effect = result.effects?.find((e) => e.type === CommandEffectType.TOAST);
            expect(toast_effect).toBeDefined();

            const animation_effect = result.effects?.find(
                (e) => e.type === CommandEffectType.ANIMATION
            );
            expect(animation_effect).toBeDefined();
        });

        it('should set initial position if provided', async () => {
            const payload: CreateNodePayload = {
                statement: 'Test statement',
                x: 100,
                y: 200
            };

            const result = await create_node_command.execute(payload, TEST_CONTEXT);

            expect(result.success).toBe(true);
            const created_node = graph_store.nodes[0];
            expect(created_node.x).toBe(100);
            expect(created_node.y).toBe(200);
        });
    });

    describe('undo', () => {
        it('should remove the created node', async () => {
            const payload: CreateNodePayload = {
                statement: 'Test statement'
            };

            const result = await create_node_command.execute(payload, TEST_CONTEXT);
            expect(graph_store.nodes.length).toBe(1);

            const undo_result = await create_node_command.undo!(result, TEST_CONTEXT);

            expect(undo_result.success).toBe(true);
            expect(graph_store.nodes.length).toBe(0);
        });

        it('should fail if result data is invalid', async () => {
            const invalid_result = {
                success: false,
                error: 'Test error'
            };

            const undo_result = await create_node_command.undo!(invalid_result, TEST_CONTEXT);

            expect(undo_result.success).toBe(false);
            expect(undo_result.error).toContain('invalid result data');
        });
    });

    describe('metadata', () => {
        it('should have correct metadata', () => {
            expect(create_node_command.id).toBe('graph.node.create');
            expect(create_node_command.metadata.name).toBe('Create Node');
            expect(create_node_command.metadata.undoable).toBe(true);
            expect(create_node_command.metadata.mutates_graph).toBe(true);
        });
    });
});
