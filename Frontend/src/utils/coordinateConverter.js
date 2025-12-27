/**
 * Coordinate Converter Utility
 * Converts between browser coordinates (CSS pixels, top-left origin)
 * and PDF coordinates (points, bottom-left origin)
 */

// PDF standard: 72 DPI (points per inch)
const PDF_DPI = 72;

/**
 * Convert CSS pixels to PDF points
 * @param {number} pixels - CSS pixels
 * @param {number} scale - Current scale/zoom factor
 * @returns {number} PDF points
 */
export const pixelsToPoints = (pixels, scale = 1) => {
  // Assuming 96 DPI for CSS (standard browser DPI)
  // Convert to points: pixels * (72 / 96) = pixels * 0.75
  return (pixels / scale) * (PDF_DPI / 96);
};

/**
 * Convert PDF points to CSS pixels
 * @param {number} points - PDF points
 * @param {number} scale - Current scale/zoom factor
 * @returns {number} CSS pixels
 */
export const pointsToPixels = (points, scale = 1) => {
  return points * (96 / PDF_DPI) * scale;
};

/**
 * Convert browser coordinates (top-left origin) to PDF coordinates (bottom-left origin)
 * @param {number} x - X coordinate in CSS pixels (from left)
 * @param {number} y - Y coordinate in CSS pixels (from top)
 * @param {number} pdfHeight - PDF page height in points
 * @param {number} containerHeight - Container height in CSS pixels
 * @param {number} scale - Current scale/zoom factor
 * @returns {Object} {x, y} in PDF points
 */
export const browserToPdfCoords = (x, y, pdfHeight, containerHeight, scale = 1) => {
  const xPoints = pixelsToPoints(x, scale);
  // Convert Y: browser Y is from top, PDF Y is from bottom
  const yPixels = containerHeight - y;
  const yPoints = pixelsToPoints(yPixels, scale);
  return { x: xPoints, y: yPoints };
};

/**
 * Convert PDF coordinates (bottom-left origin) to browser coordinates (top-left origin)
 * @param {number} x - X coordinate in PDF points (from left)
 * @param {number} y - Y coordinate in PDF points (from bottom)
 * @param {number} pdfHeight - PDF page height in points
 * @param {number} containerHeight - Container height in CSS pixels
 * @param {number} scale - Current scale/zoom factor
 * @returns {Object} {x, y} in CSS pixels
 */
export const pdfToBrowserCoords = (x, y, pdfHeight, containerHeight, scale = 1) => {
  const xPixels = pointsToPixels(x, scale);
  // Convert Y: PDF Y is from bottom, browser Y is from top
  const yPixels = pointsToPixels(y, scale);
  const yBrowser = containerHeight - yPixels;
  return { x: xPixels, y: yBrowser };
};

/**
 * Get PDF page dimensions in points
 * @param {Object} page - PDF.js page object
 * @returns {Promise<Object>} {width, height} in points
 */
export const getPdfPageDimensions = async (page) => {
  const viewport = page.getViewport({ scale: 1.0 });
  return {
    width: viewport.width * (PDF_DPI / 96),
    height: viewport.height * (PDF_DPI / 96)
  };
};

