/**
 * Answer management utilities for question nodes
 *
 * Handles all operations related to linking and managing answers for question nodes.
 * This includes validation, linking/unlinking, and querying answer relationships.
 */

import type { LogicNode, LogicConnection } from '$lib/types/graph';
import { ConnectionType } from '$lib/types/graph';
import { is_question_node, is_statement_node } from './node-classification';

// ============================================================================
// Validation
// ============================================================================

/**
 * Checks if a statement node can be linked as an answer to a question node.
 *
 * Validation rules:
 * - The question node must be a question type
 * - The answer node must be a statement type
 * - Both nodes must exist
 * - The nodes must be different
 *
 * @param question_node - The question node
 * @param answer_node - The potential answer node
 * @returns True if the answer can be linked, false otherwise
 *
 * @example
 * ```ts
 * const question = { id: '1', statement: 'What is truth?', type: NodeType.QUESTION };
 * const answer = { id: '2', statement: 'Truth is correspondence', type: NodeType.STATEMENT };
 * console.log(can_link_as_answer(question, answer)); // true
 * ```
 */
export function can_link_as_answer(
    question_node: LogicNode | undefined,
    answer_node: LogicNode | undefined
): boolean {
    if (!question_node || !answer_node) {
        return false;
    }

    if (question_node.id === answer_node.id) {
        return false;
    }

    if (!is_question_node(question_node)) {
        return false;
    }

    if (!is_statement_node(answer_node)) {
        return false;
    }

    return true;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Gets all answer connections for a question node.
 *
 * @param question_node_id - The ID of the question node
 * @param connections - All connections in the graph
 * @returns Array of answer connections where the question is the source
 *
 * @example
 * ```ts
 * const connections = [
 *   { type: ConnectionType.ANSWER, sources: ['1'], targets: ['2'] },
 *   { type: ConnectionType.IMPLICATION, sources: ['2'], targets: ['3'] }
 * ];
 * const answers = get_linked_answers('1', connections);
 * console.log(answers.length); // 1
 * ```
 */
export function get_linked_answers(
    question_node_id: string,
    connections: LogicConnection[]
): LogicConnection[] {
    return connections.filter(
        (conn) => conn.type === ConnectionType.ANSWER && conn.sources.includes(question_node_id)
    );
}

/**
 * Gets all questions that are answered by a specific statement node.
 *
 * @param statement_node_id - The ID of the statement node
 * @param connections - All connections in the graph
 * @returns Array of answer connections where the statement is the target
 *
 * @example
 * ```ts
 * const connections = [
 *   { type: ConnectionType.ANSWER, sources: ['1'], targets: ['2'] },
 *   { type: ConnectionType.ANSWER, sources: ['3'], targets: ['2'] }
 * ];
 * const questions = get_questions_for_statement('2', connections);
 * console.log(questions.length); // 2
 * ```
 */
export function get_questions_for_statement(
    statement_node_id: string,
    connections: LogicConnection[]
): LogicConnection[] {
    return connections.filter(
        (conn) => conn.type === ConnectionType.ANSWER && conn.targets.includes(statement_node_id)
    );
}

/**
 * Gets the IDs of all question nodes that are answered by a statement.
 *
 * @param statement_node_id - The ID of the statement node
 * @param connections - All connections in the graph
 * @returns Array of question node IDs
 *
 * @example
 * ```ts
 * const connections = [
 *   { type: ConnectionType.ANSWER, sources: ['q1', 'q2'], targets: ['s1'] }
 * ];
 * const question_ids = get_question_ids_for_statement('s1', connections);
 * console.log(question_ids); // ['q1', 'q2']
 * ```
 */
export function get_question_ids_for_statement(
    statement_node_id: string,
    connections: LogicConnection[]
): string[] {
    const question_connections = get_questions_for_statement(statement_node_id, connections);
    const question_ids: string[] = [];

    for (const conn of question_connections) {
        question_ids.push(...conn.sources);
    }

    return [...new Set(question_ids)]; // Remove duplicates
}

/**
 * Gets the answer node ID for a question from the connections graph.
 * This is useful when you need to get the answer from connections rather than
 * from the node's answered_by field.
 *
 * @param question_node_id - The ID of the question node
 * @param connections - All connections in the graph
 * @returns The ID of the answer node, or undefined if no answer exists
 *
 * @example
 * ```ts
 * const connections = [
 *   { type: ConnectionType.ANSWER, sources: ['1'], targets: ['2'] }
 * ];
 * const answer_id = get_answer_id_from_connections('1', connections);
 * console.log(answer_id); // '2'
 * ```
 */
export function get_answer_id_from_connections(
    question_node_id: string,
    connections: LogicConnection[]
): string | undefined {
    const answer_connections = get_linked_answers(question_node_id, connections);

    if (answer_connections.length === 0) {
        return undefined;
    }

    // Take the first target from the first answer connection
    // (There should only be one answer per question, but we handle multiple gracefully)
    return answer_connections[0].targets[0];
}
