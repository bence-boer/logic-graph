/**
 * Export utilities for saving graphs to various formats
 *
 * This module provides a unified interface for exporting logic graphs to multiple formats:
 * - JSON: Native graph format for import/export
 * - SVG: Vector graphics with embedded styles
 * - PNG: Raster image with transparency
 * - JPEG: Raster image with background
 * - HTML: Standalone interactive visualization
 *
 * All export functions are organized by format in separate modules for maintainability.
 *
 * @example
 * ```ts
 * import {
 *   download_graph_as_json,
 *   download_as_svg,
 *   download_as_png
 * } from '$lib/utils/export';
 *
 * // Export as JSON
 * download_graph_as_json(graph, 'my-graph.json');
 *
 * // Export as SVG
 * download_as_svg('my-graph.svg');
 *
 * // Export as PNG
 * await download_as_png('my-graph.png');
 * ```
 */

// Re-export all format-specific utilities
export { export_graph_to_json, download_graph_as_json } from './json';
export { export_to_svg, download_as_svg } from './svg';
export { export_to_image, download_as_png, download_as_jpeg } from './image';
export { export_to_html, download_as_html } from './html';
export { trigger_download } from './download';

// Re-export types
export type { ImageExportOptions } from './image';
