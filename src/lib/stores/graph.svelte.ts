/**
 * Graph store using Svelte 5 runes
 * Manages the state of nodes and connections in the logic graph
 */

import type { LogicGraph, LogicNode, LogicConnection } from '$lib/types/graph';
import { ConnectionType } from '$lib/types/graph';

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
                id: crypto.randomUUID()
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

        update_modified(): void {
            _metadata = {
                ..._metadata,
                modified: new Date().toISOString()
            };
        },

        // Sample data for testing
        load_sample_data(): void {
            const sample_nodes: LogicNode[] = [
                {
                    id: crypto.randomUUID(),
                    statement: 'All humans are mortal',
                    details: 'Universal statement about human mortality'
                },
                {
                    id: crypto.randomUUID(),
                    statement: 'Socrates is human',
                    details: 'Particular statement about Socrates'
                },
                {
                    id: crypto.randomUUID(),
                    statement: 'Socrates is mortal',
                    details: 'Logical conclusion from premises'
                },
                {
                    id: crypto.randomUUID(),
                    statement: 'Socrates is immortal',
                    details: 'Contradicts the conclusion'
                }
            ];

            const sample_connections: LogicConnection[] = [
                {
                    id: crypto.randomUUID(),
                    type: ConnectionType.IMPLICATION,
                    sources: [sample_nodes[0].id, sample_nodes[1].id],
                    targets: [sample_nodes[2].id]
                },
                {
                    id: crypto.randomUUID(),
                    type: ConnectionType.CONTRADICTION,
                    sources: [sample_nodes[2].id],
                    targets: [sample_nodes[3].id]
                }
            ];

            this.load_graph({
                nodes: sample_nodes,
                connections: sample_connections,
                metadata: {
                    statement: 'Sample Logic Graph',
                    details: 'Example demonstrating syllogistic reasoning',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                }
            });
        }
    };
}

export const graph_store = create_graph_store();
