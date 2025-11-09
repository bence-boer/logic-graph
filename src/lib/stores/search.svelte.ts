/**
 * Store for search and filter functionality
 */

export const search_store = (() => {
    let _query = $state('');
    let _filter_type = $state<'all' | 'nodes' | 'connections'>('all');
    let _connection_type_filter = $state<'all' | 'implication' | 'contradiction'>('all');

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
        set filter_type(value: typeof _filter_type) {
            _filter_type = value;
        },
        get connection_type_filter() {
            return _connection_type_filter;
        },
        set connection_type_filter(value: typeof _connection_type_filter) {
            _connection_type_filter = value;
        },
        clear() {
            _query = '';
            _filter_type = 'all';
            _connection_type_filter = 'all';
        }
    };
})();
