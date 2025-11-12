/**
 * Node type and state classification utilities
 *
 * Centralizes all node type and state classification logic for the logic graph.
 * This module provides type guards and helper functions for identifying and
 * working with different node types (statements, questions) and their states.
 */

import type { LogicNode, LogicConnection } from '$lib/types/graph';
import { NodeType, QuestionState, StatementState } from '$lib/types/graph';

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Checks if a node is a question node.
 *
 * @param node - The node to check
 * @returns True if the node is a question, false otherwise
 *
 * @example
 * ```ts
 * const node = { id: '1', statement: 'What is truth?', type: NodeType.QUESTION };
 * console.log(is_question_node(node)); // true
 * ```
 */
export function is_question_node(node: LogicNode): boolean {
    return node.type === NodeType.QUESTION;
}

/**
 * Checks if a node is a statement node.
 *
 * @param node - The node to check
 * @returns True if the node is a statement, false otherwise
 *
 * @example
 * ```ts
 * const node = { id: '1', statement: 'Truth exists', type: NodeType.STATEMENT };
 * console.log(is_statement_node(node)); // true
 * ```
 */
export function is_statement_node(node: LogicNode): boolean {
    // Default to STATEMENT for backward compatibility
    return node.type === NodeType.STATEMENT || node.type === undefined;
}

// ============================================================================
// Question State Helpers
// ============================================================================

/**
 * Checks if a question node is in the active state.
 *
 * @param node - The node to check
 * @returns True if the node is an active question, false otherwise
 *
 * @example
 * ```ts
 * const node = {
 *   id: '1',
 *   statement: 'What is truth?',
 *   type: NodeType.QUESTION,
 *   question_state: QuestionState.ACTIVE
 * };
 * console.log(is_active_question(node)); // true
 * ```
 */
export function is_active_question(node: LogicNode): boolean {
    return (
        is_question_node(node) &&
        (node.question_state === QuestionState.ACTIVE || node.question_state === undefined)
    );
}

/**
 * Checks if a question node is in the resolved state.
 *
 * @param node - The node to check
 * @returns True if the node is a resolved question, false otherwise
 *
 * @example
 * ```ts
 * const node = {
 *   id: '1',
 *   statement: 'What is truth?',
 *   type: NodeType.QUESTION,
 *   question_state: QuestionState.RESOLVED
 * };
 * console.log(is_resolved_question(node)); // true
 * ```
 */
export function is_resolved_question(node: LogicNode): boolean {
    return is_question_node(node) && node.question_state === QuestionState.RESOLVED;
}

/**
 * Gets the question state of a node.
 *
 * @param node - The node to check
 * @returns The question state, or undefined if not a question node
 *
 * @example
 * ```ts
 * const node = {
 *   id: '1',
 *   statement: 'What is truth?',
 *   type: NodeType.QUESTION,
 *   question_state: QuestionState.ACTIVE
 * };
 * console.log(get_question_state(node)); // QuestionState.ACTIVE
 * ```
 */
export function get_question_state(node: LogicNode): QuestionState | undefined {
    if (!is_question_node(node)) {
        return undefined;
    }
    // Default to ACTIVE if not specified
    return node.question_state ?? QuestionState.ACTIVE;
}

// ============================================================================
// Statement State Helpers
// ============================================================================

/**
 * Checks if a statement node is an axiom (has no reasons/incoming implications).
 * An axiom is a foundational statement that isn't derived from other statements.
 *
 * @param node_id - The ID of the node to check
 * @param connections - All connections in the graph
 * @returns True if the node is an axiom, false otherwise
 *
 * @example
 * ```ts
 * const connections = [
 *   { type: ConnectionType.IMPLICATION, sources: ['2'], targets: ['3'] }
 * ];
 * console.log(is_axiom_node('1', connections)); // true (no incoming implications)
 * console.log(is_axiom_node('3', connections)); // false (has incoming implication)
 * ```
 */
export function is_axiom_node(node_id: string, connections: LogicConnection[]): boolean {
    // An axiom has no incoming implications (no connections where it's a target)
    return !connections.some(
        (conn) => conn.type === 'implication' && conn.targets.includes(node_id)
    );
}

/**
 * Checks if a statement node is in the settled state.
 *
 * @param node - The node to check
 * @returns True if the node is a settled statement, false otherwise
 *
 * @example
 * ```ts
 * const node = {
 *   id: '1',
 *   statement: 'Truth exists',
 *   type: NodeType.STATEMENT,
 *   statement_state: StatementState.SETTLED
 * };
 * console.log(is_settled_statement(node)); // true
 * ```
 */
export function is_settled_statement(node: LogicNode): boolean {
    return is_statement_node(node) && node.statement_state === StatementState.SETTLED;
}

/**
 * Checks if a statement node is in the debated state.
 *
 * @param node - The node to check
 * @returns True if the node is a debated statement, false otherwise
 *
 * @example
 * ```ts
 * const node = {
 *   id: '1',
 *   statement: 'Truth exists',
 *   type: NodeType.STATEMENT,
 *   statement_state: StatementState.DEBATED
 * };
 * console.log(is_debated_statement(node)); // true
 * ```
 */
export function is_debated_statement(node: LogicNode): boolean {
    return (
        is_statement_node(node) &&
        (node.statement_state === StatementState.DEBATED || node.statement_state === undefined)
    );
}

/**
 * Gets the statement state of a node.
 *
 * @param node - The node to check
 * @returns The statement state, or undefined if not a statement node
 *
 * @example
 * ```ts
 * const node = {
 *   id: '1',
 *   statement: 'Truth exists',
 *   type: NodeType.STATEMENT,
 *   statement_state: StatementState.SETTLED
 * };
 * console.log(get_statement_state(node)); // StatementState.SETTLED
 * ```
 */
export function get_statement_state(node: LogicNode): StatementState | undefined {
    if (!is_statement_node(node)) {
        return undefined;
    }
    // Default to DEBATED if not specified
    return node.statement_state ?? StatementState.DEBATED;
}

// ============================================================================
// Answer Query Helpers
// ============================================================================

/**
 * Checks if a question node has an answer linked.
 *
 * @param node - The node to check
 * @returns True if the question has an answer, false otherwise
 *
 * @example
 * ```ts
 * const node = {
 *   id: '1',
 *   statement: 'What is truth?',
 *   type: NodeType.QUESTION,
 *   answered_by: '2'
 * };
 * console.log(has_answer(node)); // true
 * ```
 */
export function has_answer(node: LogicNode): boolean {
    return is_question_node(node) && node.answered_by !== undefined && node.answered_by !== null;
}

/**
 * Gets the ID of the answer node for a question.
 *
 * @param node - The question node
 * @returns The ID of the answer node, or undefined if no answer is linked
 *
 * @example
 * ```ts
 * const node = {
 *   id: '1',
 *   statement: 'What is truth?',
 *   type: NodeType.QUESTION,
 *   answered_by: '2'
 * };
 * console.log(get_answer_node_id(node)); // '2'
 * ```
 */
export function get_answer_node_id(node: LogicNode): string | undefined {
    if (!is_question_node(node)) {
        return undefined;
    }
    return node.answered_by;
}
