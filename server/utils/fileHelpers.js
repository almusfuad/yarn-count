import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * Get the directory path equivalent to __dirname in ESM
 * Usage: const __dirname = getDirname(import.meta.url);
 * @param {string} importMetaUrl - The import.meta.url from the calling module
 * @returns {string} The directory path of the calling module
 */
export const getDirname = (importMetaUrl) => {
  return dirname(fileURLToPath(importMetaUrl));
};

/**
 * Get the file path equivalent to __filename in ESM
 * Usage: const __filename = getFilename(import.meta.url);
 * @param {string} importMetaUrl - The import.meta.url from the calling module
 * @returns {string} The file path of the calling module
 */
export const getFilename = (importMetaUrl) => {
  return fileURLToPath(importMetaUrl);
};

/**
 * Convenience function to get both __dirname and __filename
 * Usage: const { __dirname, __filename } = getPathInfo(import.meta.url);
 * @param {string} importMetaUrl - The import.meta.url from the calling module
 * @returns {object} Object with __dirname and __filename properties
 */
export const getPathInfo = (importMetaUrl) => {
  const __filename = fileURLToPath(importMetaUrl);
  const __dirname = dirname(__filename);
  return { __dirname, __filename };
};
