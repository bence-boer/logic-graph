/**
 * Graph store using Svelte 5 runes
 * Manages the state of nodes and connections in the logic graph
 */

import type { LogicGraph, LogicNode, LogicConnection } from '$lib/types/graph';
import { ConnectionType, NodeType, QuestionState, StatementState } from '$lib/types/graph';

function create_graph_store() {
    let _nodes = $state<LogicNode[]>([]);
    let _connections = $state<LogicConnection[]>([]);
    let _metadata = $state({
        statement: 'Untitled Graph',
        details: '',
        created: new Date().toISOString(),
        modified: new Date().toISOString()
    });

    return {
        // Getters
        get nodes() {
            return _nodes;
        },
        get connections() {
            return _connections;
        },
        get metadata() {
            return _metadata;
        },

        // Setters
        set nodes(value: LogicNode[]) {
            _nodes = value;
            this.update_modified();
        },
        set connections(value: LogicConnection[]) {
            _connections = value;
            this.update_modified();
        },
        set metadata(value: typeof _metadata) {
            _metadata = value;
        },

        // Methods
        add_node(node: Omit<LogicNode, 'id'>): LogicNode {
            const new_node: LogicNode = {
                ...node,
                id: crypto.randomUUID(),
                // Ensure type is set (default to STATEMENT for backward compatibility)
                type: node.type ?? NodeType.STATEMENT
            };
            _nodes = [..._nodes, new_node];
            this.update_modified();
            return new_node;
        },

        remove_node(node_id: string): void {
            _nodes = _nodes.filter((node) => node.id !== node_id);
            // Also remove any connections involving this node
            _connections = _connections.filter(
                (connection) =>
                    !connection.sources.includes(node_id) && !connection.targets.includes(node_id)
            );
            this.update_modified();
        },

        update_node(node_id: string, updates: Partial<LogicNode>): void {
            _nodes = _nodes.map((node) => (node.id === node_id ? { ...node, ...updates } : node));
            this.update_modified();
        },

        add_connection(connection: Omit<LogicConnection, 'id'>): LogicConnection {
            const new_connection: LogicConnection = {
                ...connection,
                id: crypto.randomUUID()
            };
            _connections = [..._connections, new_connection];
            this.update_modified();
            return new_connection;
        },

        remove_connection(connection_id: string): void {
            _connections = _connections.filter((connection) => connection.id !== connection_id);
            this.update_modified();
        },

        update_connection(connection_id: string, updates: Partial<LogicConnection>): void {
            _connections = _connections.map((connection) =>
                connection.id === connection_id ? { ...connection, ...updates } : connection
            );
            this.update_modified();
        },

        load_graph(graph: LogicGraph): void {
            _nodes = graph.nodes;
            _connections = graph.connections;
            if (graph.metadata) {
                _metadata = {
                    statement: graph.metadata.statement || _metadata.statement,
                    details: graph.metadata.details || _metadata.details,
                    created: graph.metadata.created || _metadata.created,
                    modified: graph.metadata.modified || _metadata.modified
                };
            }
        },

        get_graph(): LogicGraph {
            return {
                nodes: _nodes,
                connections: _connections,
                metadata: _metadata
            };
        },

        clear(): void {
            _nodes = [];
            _connections = [];
            _metadata = {
                statement: 'Untitled Graph',
                details: '',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            };
        },

        /**
         * Sets the question state for a question node.
         *
         * @param node_id - The ID of the question node
         * @param state - The new question state
         */
        set_question_state(node_id: string, state: QuestionState): void {
            this.update_node(node_id, { question_state: state });
        },

        /**
         * Sets the statement state for a statement node.
         *
         * @param node_id - The ID of the statement node
         * @param state - The new statement state
         */
        set_statement_state(node_id: string, state: StatementState): void {
            this.update_node(node_id, { statement_state: state });
        },

        /**
         * Toggles the statement state between settled and debated for axiom nodes.
         *
         * @param node_id - The ID of the statement node
         */
        toggle_statement_state(node_id: string): void {
            const node = _nodes.find((n) => n.id === node_id);
            if (!node) return;

            const new_state =
                node.statement_state === StatementState.SETTLED
                    ? StatementState.DEBATED
                    : StatementState.SETTLED;

            this.update_node(node_id, { statement_state: new_state });
        },

        /**
         * Sets or clears the answer for a question node.
         * Also manages the corresponding ANSWER connection.
         *
         * @param question_node_id - The ID of the question node
         * @param answer_node_id - The ID of the answer node, or null to clear
         */
        set_answer(question_node_id: string, answer_node_id: string | null): void {
            // Remove any existing answer connections for this question
            const existing_answer_connections = _connections.filter(
                (conn) =>
                    conn.type === ConnectionType.ANSWER && conn.sources.includes(question_node_id)
            );

            for (const conn of existing_answer_connections) {
                this.remove_connection(conn.id!);
            }

            // Update the node's answered_by field
            this.update_node(question_node_id, { answered_by: answer_node_id ?? undefined });

            // If a new answer is provided, create the connection
            if (answer_node_id) {
                this.add_connection({
                    type: ConnectionType.ANSWER,
                    sources: [question_node_id],
                    targets: [answer_node_id]
                });
            }
        },

        update_modified(): void {
            _metadata = {
                ..._metadata,
                modified: new Date().toISOString()
            };
        },

        // Sample data for testing - demonstrates all features
        load_sample_data(): void {
            const sample_nodes: LogicNode[] = [
                // 1. SETTLED AXIOM - Foundational truth (white border)
                {
                    id: crypto.randomUUID(),
                    statement: 'Objective truth exists',
                    details: 'Foundational axiom: reality exists independently of observation',
                    type: NodeType.STATEMENT,
                    statement_state: StatementState.SETTLED
                },
                // 2. DEBATED AXIOM - Philosophical assumption under discussion (normal border)
                {
                    id: crypto.randomUUID(),
                    statement: 'All perception is subjective',
                    details: 'Axiom under debate: can we trust what we observe?',
                    type: NodeType.STATEMENT,
                    statement_state: StatementState.DEBATED
                },
                // 3. DERIVED STATEMENT - Has supporting reasons (normal border)
                {
                    id: crypto.randomUUID(),
                    statement: 'We can know truth through reason',
                    details: 'Derived conclusion from the axiom of objective truth',
                    type: NodeType.STATEMENT
                },
                // 4. ACTIVE QUESTION WITH ANSWER - Amber border
                {
                    id: crypto.randomUUID(),
                    statement: 'What is the nature of truth?',
                    details: 'Fundamental epistemological question about truth itself',
                    type: NodeType.QUESTION,
                    question_state: QuestionState.ACTIVE
                },
                // 5. RESOLVED QUESTION WITH ANSWER - Light background, black text
                {
                    id: crypto.randomUUID(),
                    statement: 'Can we trust our senses?',
                    details: 'Question about the reliability of sensory perception',
                    type: NodeType.QUESTION,
                    question_state: QuestionState.RESOLVED
                },
                // 6. ACTIVE QUESTION WITHOUT ANSWER - Amber border, no answer yet
                {
                    id: crypto.randomUUID(),
                    statement: 'How do we verify knowledge claims?',
                    details: 'Methodological question about epistemology',
                    type: NodeType.QUESTION,
                    question_state: QuestionState.ACTIVE
                }
            ];

            const sample_connections: LogicConnection[] = [
                // Settled axiom implies derived statement
                {
                    id: crypto.randomUUID(),
                    type: ConnectionType.IMPLICATION,
                    sources: [sample_nodes[0].id], // Objective truth exists
                    targets: [sample_nodes[2].id] // We can know truth through reason
                },
                // Debated axiom contradicts settled axiom
                {
                    id: crypto.randomUUID(),
                    type: ConnectionType.CONTRADICTION,
                    sources: [sample_nodes[0].id], // Objective truth exists
                    targets: [sample_nodes[1].id] // All perception is subjective
                },
                // Active question answered by settled axiom
                {
                    id: crypto.randomUUID(),
                    type: ConnectionType.ANSWER,
                    sources: [sample_nodes[3].id], // What is truth?
                    targets: [sample_nodes[0].id] // Objective truth exists
                },
                // Resolved question answered by debated axiom
                {
                    id: crypto.randomUUID(),
                    type: ConnectionType.ANSWER,
                    sources: [sample_nodes[4].id], // Can we trust senses?
                    targets: [sample_nodes[1].id] // All perception is subjective
                },
                // Active question (no answer) linked to derived statement
                {
                    id: crypto.randomUUID(),
                    type: ConnectionType.IMPLICATION,
                    sources: [sample_nodes[5].id], // How verify claims?
                    targets: [sample_nodes[2].id] // We can know truth
                }
            ];

            // Set answered_by fields for questions
            sample_nodes[3].answered_by = sample_nodes[0].id; // Active question → settled axiom
            sample_nodes[4].answered_by = sample_nodes[1].id; // Resolved question → debated axiom

            this.load_graph({
                nodes: sample_nodes,
                connections: sample_connections,
                metadata: {
                    statement: 'Epistemology Sample Graph',
                    details:
                        'Demonstrates questions (active/resolved), statements (settled/debated), and answer relationships',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                }
            });
        }
    };
}

export const graph_store = create_graph_store();
