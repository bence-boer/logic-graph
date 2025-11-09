/**
 * Browser download utilities
 *
 * Provides low-level browser download functionality for various export formats.
 */

/**
 * Trigger a browser download for a blob
 *
 * Creates a temporary object URL and triggers a download via a temporary anchor element.
 * Automatically cleans up the object URL after the download is triggered.
 *
 * @param blob - The blob to download
 * @param filename - Name for the downloaded file
 *
 * @example
 * ```ts
 * const blob = new Blob(['content'], { type: 'text/plain' });
 * trigger_download(blob, 'file.txt');
 * ```
 */
export function trigger_download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}
