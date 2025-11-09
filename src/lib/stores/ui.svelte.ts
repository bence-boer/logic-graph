/**
 * UI store using Svelte 5 runes
 * Manages UI state like panel visibility and settings
 */

function create_ui_store() {
    let _left_panel_open = $state(true);
    let _right_panel_open = $state(false);
    let _show_labels = $state(true);
    let _show_descriptions = $state(false);

    return {
        get left_panel_open() {
            return _left_panel_open;
        },
        set left_panel_open(value: boolean) {
            _left_panel_open = value;
        },

        get right_panel_open() {
            return _right_panel_open;
        },
        set right_panel_open(value: boolean) {
            _right_panel_open = value;
        },

        get show_labels() {
            return _show_labels;
        },
        set show_labels(value: boolean) {
            _show_labels = value;
        },

        get show_descriptions() {
            return _show_descriptions;
        },
        set show_descriptions(value: boolean) {
            _show_descriptions = value;
        },

        toggle_left_panel(): void {
            _left_panel_open = !_left_panel_open;
        },

        toggle_right_panel(): void {
            _right_panel_open = !_right_panel_open;
        },

        open_right_panel(): void {
            _right_panel_open = true;
        },

        close_right_panel(): void {
            _right_panel_open = false;
        }
    };
}

export const ui_store = create_ui_store();
