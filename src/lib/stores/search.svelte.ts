/**
 * Store for search and filter functionality
 */

import { ConnectionType } from '$lib/types/graph';

export enum SearchFilterType {
    ALL = 'all',
    NODES = 'nodes',
    CONNECTIONS = 'connections'
}

export type ConnectionTypeFilter = 'all' | ConnectionType;

export const CONNECTION_TYPE_FILTER_VALUE = {
    ALL: 'all' as const,
    IMPLICATION: ConnectionType.IMPLICATION,
    CONTRADICTION: ConnectionType.CONTRADICTION
} as const;

export const search_store = (() => {
    let _query = $state('');
    let _filter_type = $state<SearchFilterType>(SearchFilterType.ALL);
    let _connection_type_filter = $state<ConnectionTypeFilter>('all');

    return {
        get query() {
            return _query;
        },
        set query(value: string) {
            _query = value;
        },
        get filter_type() {
            return _filter_type;
        },
        set filter_type(value: SearchFilterType) {
            _filter_type = value;
        },
        get connection_type_filter() {
            return _connection_type_filter;
        },
        set connection_type_filter(value: ConnectionTypeFilter) {
            _connection_type_filter = value;
        },
        clear() {
            _query = '';
            _filter_type = SearchFilterType.ALL;
            _connection_type_filter = 'all';
        }
    };
})();
