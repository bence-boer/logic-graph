/**
 * Store for managing toast notifications
 */

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

export const toast_store = (() => {
    let _toasts = $state<Toast[]>([]);
    let _id_counter = 0;

    return {
        get toasts() {
            return _toasts;
        },
        show(message: string, type: Toast['type'] = 'info', duration = 3000) {
            const id = `toast-${++_id_counter}`;
            const toast: Toast = { id, message, type, duration };

            _toasts = [..._toasts, toast];

            if (duration > 0) {
                setTimeout(() => {
                    this.remove(id);
                }, duration);
            }

            return id;
        },
        success(message: string, duration = 3000) {
            return this.show(message, 'success', duration);
        },
        error(message: string, duration = 5000) {
            return this.show(message, 'error', duration);
        },
        warning(message: string, duration = 4000) {
            return this.show(message, 'warning', duration);
        },
        info(message: string, duration = 3000) {
            return this.show(message, 'info', duration);
        },
        remove(id: string) {
            _toasts = _toasts.filter((t) => t.id !== id);
        },
        clear() {
            _toasts = [];
        }
    };
})();
