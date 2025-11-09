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
        name: 'Untitled Graph',
        description: '',
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
            _nodes = _nodes.filter((n) => n.id !== node_id);
            // Also remove any connections involving this node
            _connections = _connections.filter(
                (c) => !c.sources.includes(node_id) && !c.targets.includes(node_id)
            );
            this.update_modified();
        },

        update_node(node_id: string, updates: Partial<LogicNode>): void {
            _nodes = _nodes.map((n) => (n.id === node_id ? { ...n, ...updates } : n));
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
            _connections = _connections.filter((c) => c.id !== connection_id);
            this.update_modified();
        },

        update_connection(connection_id: string, updates: Partial<LogicConnection>): void {
            _connections = _connections.map((c) =>
                c.id === connection_id ? { ...c, ...updates } : c
            );
            this.update_modified();
        },

        load_graph(graph: LogicGraph): void {
            _nodes = graph.nodes;
            _connections = graph.connections;
            if (graph.metadata) {
                _metadata = {
                    name: graph.metadata.name || _metadata.name,
                    description: graph.metadata.description || _metadata.description,
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
                name: 'Untitled Graph',
                description: '',
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
                    id: '1',
                    name: 'All humans are mortal',
                    description: 'Universal statement about human mortality'
                },
                {
                    id: '2',
                    name: 'Socrates is human',
                    description: 'Particular statement about Socrates'
                },
                {
                    id: '3',
                    name: 'Socrates is mortal',
                    description: 'Logical conclusion from premises'
                },
                {
                    id: '4',
                    name: 'Socrates is immortal',
                    description: 'Contradicts the conclusion'
                }
            ];

            const sample_connections: LogicConnection[] = [
                {
                    id: 'c1',
                    type: ConnectionType.IMPLICATION,
                    sources: ['1', '2'],
                    targets: ['3']
                },
                {
                    id: 'c2',
                    type: ConnectionType.CONTRADICTION,
                    sources: ['3'],
                    targets: ['4']
                }
            ];

            this.load_graph({
                nodes: sample_nodes,
                connections: sample_connections,
                metadata: {
                    name: 'Sample Logic Graph',
                    description: 'Example demonstrating syllogistic reasoning',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                }
            });
        }
    };
}

export const graph_store = create_graph_store();
