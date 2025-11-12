/**
 * Raster image export utilities (PNG, JPEG)
 *
 * Provides functionality to export graph visualizations as raster images
 * by converting SVG to canvas and then to image formats.
 */

import { export_to_svg } from './svg';
import { trigger_download } from './download';

/**
 * Options for image export
 */
export interface ImageExportOptions {
    /** Optional SVG element to export (defaults to first .graph-canvas) */
    svg_element?: SVGSVGElement;
    /** Scale factor for higher resolution (default: 2) */
    scale?: number;
    /** Background color (default: transparent for PNG, #1a1a1a for JPEG) */
    background_color?: string;
}

/**
 * Export to PNG or JPEG with custom dimensions and scale
 *
 * Converts the SVG visualization to a raster image format using an HTML canvas.
 * The scale parameter allows for higher resolution exports (e.g., scale=2 for 2x resolution).
 * Uses data URI instead of blob URL to avoid tainted canvas security restrictions.
 *
 * @param format - Image format: 'png' or 'jpeg'
 * @param options - Export options including scale and background color
 * @returns Promise resolving to the image blob
 *
 * @throws {Error} If canvas context cannot be obtained
 * @throws {Error} If SVG image fails to load
 * @throws {Error} If canvas drawing fails
 * @throws {Error} If blob creation fails
 *
 * @example
 * ```ts
 * const blob = await export_to_image('png', { scale: 3 });
 * // Use the blob for custom handling
 * ```
 */
export async function export_to_image(
    format: 'png' | 'jpeg',
    options: ImageExportOptions = {}
): Promise<Blob> {
    const { svg_element, scale = 2, background_color } = options;

    const svg_string = export_to_svg(svg_element);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    const img = new Image();

    // Use data URI instead of blob URL to avoid tainted canvas
    // Encode the SVG string as a data URI with proper escaping
    const encoded_svg = encodeURIComponent(svg_string).replace(/'/g, '%27').replace(/"/g, '%22');
    const data_url = `data:image/svg+xml;charset=utf-8,${encoded_svg}`;

    return new Promise((resolve, reject) => {
        img.onload = () => {
            try {
                // Apply scale for higher quality
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                // Scale the context
                ctx.scale(scale, scale);

                // Fill background
                const bg_color =
                    background_color || (format === 'jpeg' ? '#1a1a1a' : 'transparent');
                if (bg_color !== 'transparent') {
                    ctx.fillStyle = bg_color;
                    ctx.fillRect(0, 0, img.width, img.height);
                }

                ctx.drawImage(img, 0, 0);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to create blob from canvas'));
                        }
                    },
                    `image/${format}`,
                    0.95
                );
            } catch (error) {
                reject(
                    new Error(
                        `Failed to draw image to canvas: ${error instanceof Error ? error.message : 'Unknown error'}`
                    )
                );
            }
        };

        img.onerror = (error) => {
            reject(
                new Error(
                    `Failed to load SVG image: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
            );
        };

        // Set crossOrigin to anonymous to avoid CORS issues
        img.crossOrigin = 'anonymous';
        img.src = data_url;
    });
}

/**
 * Download as PNG
 *
 * Exports the graph as a PNG image with transparency support.
 * Default scale of 2 provides high-resolution output.
 *
 * @param filename - Name for the downloaded file (default: 'logic-graph.png')
 * @param svg_element - Optional SVG element to export
 *
 * @example
 * ```ts
 * await download_as_png('my-graph.png');
 * ```
 */
export async function download_as_png(
    filename = 'logic-graph.png',
    svg_element?: SVGSVGElement
): Promise<void> {
    const blob = await export_to_image('png', { svg_element, scale: 2 });
    trigger_download(blob, filename);
}

/**
 * Download as JPEG
 *
 * Exports the graph as a JPEG image with dark background.
 * JPEG format does not support transparency, so a dark background is applied.
 * Default scale of 2 provides high-resolution output.
 *
 * @param filename - Name for the downloaded file (default: 'logic-graph.jpg')
 * @param svg_element - Optional SVG element to export
 *
 * @example
 * ```ts
 * await download_as_jpeg('my-graph.jpg');
 * ```
 */
export async function download_as_jpeg(
    filename = 'logic-graph.jpg',
    svg_element?: SVGSVGElement
): Promise<void> {
    const blob = await export_to_image('jpeg', {
        svg_element,
        scale: 2,
        background_color: '#1a1a1a'
    });
    trigger_download(blob, filename);
}
