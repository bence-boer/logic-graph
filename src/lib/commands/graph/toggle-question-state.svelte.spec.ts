/**
 * Tests for toggle question state command.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { toggle_question_state_command } from './toggle-question-state';
import { graph_store } from '$lib/stores/graph.svelte';
import { NodeType, QuestionState } from '$lib/types/graph';

const TEST_CONTEXT = { timestamp: Date.now() };

describe('toggle_question_state_command', () => {
beforeEach(() => {
graph_store.clear();
});

describe('validation', () => {
it('should fail if question_id is missing', () => {
const result = toggle_question_state_command.validate({} as any, TEST_CONTEXT);
expect(result.valid).toBe(false);
expect(result.error).toBe('Question ID is required');
});

it('should fail if node is not a question', () => {
const node = graph_store.add_node({
statement: 'Test statement',
type: NodeType.STATEMENT
});

const result = toggle_question_state_command.validate(
{ question_id: node.id },
TEST_CONTEXT
);
expect(result.valid).toBe(false);
expect(result.error).toBe('Node is not a question');
});

it('should pass for valid question', () => {
const node = graph_store.add_node({
statement: 'Test?',
type: NodeType.QUESTION
});

const result = toggle_question_state_command.validate(
{ question_id: node.id },
TEST_CONTEXT
);
expect(result.valid).toBe(true);
});
});

describe('execution', () => {
it('should toggle active to resolved', async () => {
const node = graph_store.add_node({
statement: 'Test?',
type: NodeType.QUESTION,
question_state: QuestionState.ACTIVE
});

const result = await toggle_question_state_command.execute(
{ question_id: node.id },
TEST_CONTEXT
);

expect(result.success).toBe(true);
expect(result.data?.new_state).toBe(QuestionState.RESOLVED);

const updated = graph_store.nodes.find((n) => n.id === node.id);
expect(updated?.question_state).toBe(QuestionState.RESOLVED);
expect(updated?.manual_state_override).toBe(true);
});

it('should toggle resolved to active', async () => {
const node = graph_store.add_node({
statement: 'Test?',
type: NodeType.QUESTION,
question_state: QuestionState.RESOLVED
});

const result = await toggle_question_state_command.execute(
{ question_id: node.id },
TEST_CONTEXT
);

expect(result.success).toBe(true);
expect(result.data?.new_state).toBe(QuestionState.ACTIVE);

const updated = graph_store.nodes.find((n) => n.id === node.id);
expect(updated?.question_state).toBe(QuestionState.ACTIVE);
expect(updated?.manual_state_override).toBe(true);
});
});

describe('undo', () => {
it('should restore previous state', async () => {
const node = graph_store.add_node({
statement: 'Test?',
type: NodeType.QUESTION,
question_state: QuestionState.ACTIVE
});

const result = await toggle_question_state_command.execute(
{ question_id: node.id },
TEST_CONTEXT
);

if (toggle_question_state_command.undo) {
await toggle_question_state_command.undo(result, TEST_CONTEXT);

const restored = graph_store.nodes.find((n) => n.id === node.id);
expect(restored?.question_state).toBe(QuestionState.ACTIVE);
}
});
});
});
