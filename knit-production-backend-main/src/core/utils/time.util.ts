/**
 * Parse MM:SS format to seconds
 */
export function parseMMSS(str: string): number {
  if (!str) return 0;

  const parts = str.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);

    if (!isNaN(minutes) && !isNaN(seconds)) {
      return minutes * 60 + seconds;
    }
  }

  return 0;
}

/**
 * Convert seconds to MM:SS format
 */
export function formatToMMSS(seconds: number): string {
  if (seconds < 0) return '00:00';

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get elapsed time since a timestamp
 */
export function getElapsedSeconds(timestamp: Date | number): number {
  const now = Date.now();
  const time = typeof timestamp === 'number' ? timestamp : timestamp.getTime();
  return Math.floor((now - time) / 1000);
}
