/**
 * Store for managing loading states across the application
 */

export const loading_store = (() => {
    let _is_loading = $state(false);
    let _message = $state('Loading...');

    return {
        get is_loading() {
            return _is_loading;
        },
        get message() {
            return _message;
        },
        start(message = 'Loading...') {
            _is_loading = true;
            _message = message;
        },
        stop() {
            _is_loading = false;
            _message = 'Loading...';
        }
    };
})();
