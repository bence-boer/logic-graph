/**
 * UI-specific type definitions for the Logic Graph application
 *
 * This file contains type definitions for UI components, forms, and
 * user interactions that are not directly related to the graph data model.
 */

/**
 * Form validation error structure
 *
 * Maps field names to their error messages. Used throughout form components
 * to display validation feedback to users.
 *
 * @example
 * ```ts
 * const errors: FormValidationErrors = {
 *   name: 'Name is required',
 *   description: 'Description is too long'
 * };
 * ```
 */
export interface FormValidationErrors {
    [field: string]: string;
}

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'svg' | 'png' | 'jpeg' | 'html';

/**
 * Export configuration options
 *
 * Configuration for exporting the graph in various formats.
 */
export interface ExportOptions {
    /** Output format for the export */
    format: ExportFormat;
    /** Desired filename (without extension) */
    filename: string;
    /** Scale factor for image exports (default: 2 for high quality) */
    scale?: number;
    /** Background color for image exports (default: transparent) */
    background_color?: string;
}

/**
 * Keyboard shortcut category
 */
export type KeyboardShortcutCategory = 'file' | 'edit' | 'view' | 'navigation';

/**
 * Keyboard shortcut definition
 *
 * Defines a keyboard shortcut with its key combination and metadata.
 * Used to document and implement keyboard shortcuts throughout the app.
 *
 * @example
 * ```ts
 * const save_shortcut: KeyboardShortcutDefinition = {
 *   key: 's',
 *   ctrl: true,
 *   description: 'Save graph',
 *   category: 'file'
 * };
 * ```
 */
export interface KeyboardShortcutDefinition {
    /** The primary key for the shortcut */
    key: string;
    /** Whether Ctrl (or Cmd on Mac) is required */
    ctrl?: boolean;
    /** Whether Alt is required */
    alt?: boolean;
    /** Whether Shift is required */
    shift?: boolean;
    /** Human-readable description of what the shortcut does */
    description: string;
    /** Category for grouping shortcuts in help documentation */
    category: KeyboardShortcutCategory;
}

/**
 * Search filter type
 */
export type SearchFilterType = 'all' | 'nodes' | 'connections';

/**
 * Toast notification type
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast notification structure
 *
 * Represents a temporary notification message shown to the user.
 */
export interface Toast {
    /** Unique identifier for the toast */
    id: string;
    /** Type of notification (affects styling) */
    type: ToastType;
    /** Message to display */
    message: string;
    /** Duration in milliseconds before auto-dismiss (0 = no auto-dismiss) */
    duration?: number;
}
